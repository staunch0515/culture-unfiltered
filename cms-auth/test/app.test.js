import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp, loadConfig } from '../src/app.js';

const config = {
  clientId: 'test-client',
  clientSecret: 'test-secret',
  publicOrigin: 'https://cms.example',
  githubWeb: 'https://github.example',
};

/** Fake GitHub token endpoint. */
const exchanges = [];
let nextResponse = { access_token: 'gho_testtoken' };
async function fakeFetch(url, init) {
  exchanges.push({ url, body: JSON.parse(init.body) });
  return new Response(JSON.stringify(nextResponse), { headers: { 'Content-Type': 'application/json' } });
}

let server;
let base;
before(async () => {
  server = createServer(createApp({ config, fetchImpl: fakeFetch }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const get = (path, headers = {}) => fetch(`${base}${path}`, { headers, redirect: 'manual' });
const stateCookie = (res) => /cms_oauth_state=([^;]+)/.exec(res.headers.get('set-cookie') ?? '')?.[1];

test('health check answers without any external dependency', async () => {
  const res = await get('/cms-auth/health');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
});

test('auth redirects to GitHub with state, callback URL and a safe scope', async () => {
  const res = await get('/cms-auth/auth?provider=github&site_id=cms.example&scope=public_repo');
  assert.equal(res.status, 302);
  const target = new URL(res.headers.get('location'));
  assert.equal(target.origin + target.pathname, 'https://github.example/login/oauth/authorize');
  assert.equal(target.searchParams.get('client_id'), 'test-client');
  assert.equal(target.searchParams.get('redirect_uri'), 'https://cms.example/cms-auth/callback');
  assert.equal(target.searchParams.get('scope'), 'public_repo');
  const state = target.searchParams.get('state');
  assert.ok(state && state.length >= 32);
  assert.equal(stateCookie(res), state);
  const cookie = res.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
});

test('unexpected scopes are reduced to public_repo', async () => {
  const res = await get('/cms-auth/auth?scope=admin:org,delete_repo');
  assert.equal(new URL(res.headers.get('location')).searchParams.get('scope'), 'public_repo');
});

test('other providers are rejected', async () => {
  assert.equal((await get('/cms-auth/auth?provider=gitlab')).status, 400);
});

test('callback exchanges the code and posts the token only to the site origin', async () => {
  const auth = await get('/cms-auth/auth');
  const state = stateCookie(auth);
  exchanges.length = 0;
  const res = await get(`/cms-auth/callback?code=abc123&state=${state}`, { cookie: `cms_oauth_state=${state}` });
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.equal(exchanges.length, 1);
  assert.equal(exchanges[0].url, 'https://github.example/login/oauth/access_token');
  assert.deepEqual(exchanges[0].body, {
    client_id: 'test-client', client_secret: 'test-secret', code: 'abc123',
    redirect_uri: 'https://cms.example/cms-auth/callback',
  });
  assert.match(html, /authorization:github:success:/);
  assert.match(html, /gho_testtoken/);
  assert.match(html, /var origin = "https:\/\/cms\.example"/);
  assert.doesNotMatch(html, /postMessage\([^)]*["']\*["']/, 'never posts to a wildcard origin');
  assert.doesNotMatch(html, /test-secret/, 'never leaks the client secret');
  assert.match(res.headers.get('content-security-policy'), /script-src 'nonce-/);
  assert.match(res.headers.get('set-cookie'), /Max-Age=0/);
});

test('callback with a missing or mismatched state is refused without contacting GitHub', async () => {
  exchanges.length = 0;
  const noCookie = await (await get('/cms-auth/callback?code=abc&state=forged')).text();
  const wrong = await (await get('/cms-auth/callback?code=abc&state=forged', { cookie: 'cms_oauth_state=other' })).text();
  assert.equal(exchanges.length, 0);
  for (const html of [noCookie, wrong]) {
    assert.match(html, /authorization:github:error:/);
    assert.doesNotMatch(html, /gho_/);
  }
});

test('a rejected code reports an error to the CMS', async () => {
  nextResponse = { error: 'bad_verification_code' };
  const auth = await get('/cms-auth/auth');
  const state = stateCookie(auth);
  const html = await (await get(`/cms-auth/callback?code=old&state=${state}`, { cookie: `cms_oauth_state=${state}` })).text();
  assert.match(html, /authorization:github:error:/);
  nextResponse = { access_token: 'gho_testtoken' };
});

test('user cancelling on GitHub reports an error', async () => {
  const html = await (await get('/cms-auth/callback?error=access_denied&error_description=The+user+denied')).text();
  assert.match(html, /authorization:github:error:/);
  assert.match(html, /The user denied/);
});

test('injected HTML in error text is escaped', async () => {
  const html = await (await get('/cms-auth/callback?error=x&error_description=%3C%2Fscript%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E')).text();
  assert.doesNotMatch(html, /<\/script><script>alert/);
});

test('only GET is accepted and unknown paths are 404', async () => {
  assert.equal((await fetch(`${base}/cms-auth/auth`, { method: 'POST' })).status, 405);
  assert.equal((await get('/cms-auth/nope')).status, 404);
});

test('configuration requires every secret', () => {
  assert.throws(() => loadConfig({ CMS_PUBLIC_ORIGIN: 'https://x.example' }), /GITHUB_OAUTH_CLIENT_ID/);
  const c = loadConfig({
    GITHUB_OAUTH_CLIENT_ID: 'id', GITHUB_OAUTH_CLIENT_SECRET: 's', CMS_PUBLIC_ORIGIN: 'https://x.example/path/',
  });
  assert.equal(c.publicOrigin, 'https://x.example');
});

test('without OAuth settings the service stays healthy but refuses logins', async () => {
  const { createUnconfiguredApp } = await import('../src/app.js');
  const srv = createServer(createUnconfiguredApp('Missing required environment variable GITHUB_OAUTH_CLIENT_ID'));
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const b = `http://127.0.0.1:${srv.address().port}`;
  const health = await fetch(`${b}/cms-auth/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', configured: false });
  const auth = await fetch(`${b}/cms-auth/auth`, { redirect: 'manual' });
  assert.equal(auth.status, 503);
  assert.match(await auth.text(), /not configured/);
  srv.close();
});
