// @ts-check
/**
 * Stateless GitHub OAuth endpoint for Decap CMS (github backend).
 *
 *   GET /cms-auth/auth      Decap opens this in a popup; redirects to GitHub's consent page.
 *   GET /cms-auth/callback  GitHub returns here; exchanges the code for a token (needs the
 *                           client secret, which is why this cannot run in the browser) and
 *                           hands the token to the CMS window with Decap's postMessage protocol.
 *   GET /cms-auth/health    Liveness check.
 *
 * Editors sign in with their own GitHub accounts, so every change is committed under
 * their name and the repository history records who changed what.
 */
import { randomBytes, timingSafeEqual } from 'node:crypto';

const STATE_COOKIE = 'cms_oauth_state';
const ALLOWED_SCOPES = new Set(['repo', 'public_repo']);

/**
 * @typedef {{ clientId: string, clientSecret: string, publicOrigin: string,
 *   githubWeb?: string, port?: number }} Config
 */

/** @param {NodeJS.ProcessEnv} env @returns {Config} */
export function loadConfig(env = process.env) {
  const need = (k) => {
    const v = env[k]?.trim();
    if (!v) throw new Error(`Missing required environment variable ${k}`);
    return v;
  };
  return {
    clientId: need('GITHUB_OAUTH_CLIENT_ID'),
    clientSecret: need('GITHUB_OAUTH_CLIENT_SECRET'),
    publicOrigin: new URL(need('CMS_PUBLIC_ORIGIN')).origin,
    githubWeb: (env.GITHUB_WEB_URL?.trim() || 'https://github.com').replace(/\/$/, ''),
    port: Number(env.PORT ?? 8081),
  };
}

/** @param {unknown} s */
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

function readCookie(req, name) {
  for (const part of String(req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return '';
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

/**
 * Popup page that reports the result to the CMS window, only to our own origin.
 * @param {{ origin: string, status: 'success' | 'error', content: object, message: string }} p
 */
function resultPage({ origin, status, content, message }) {
  const nonce = randomBytes(16).toString('base64');
  const data = JSON.stringify(`authorization:github:${status}:${JSON.stringify(content)}`).replace(/</g, '\\u003c');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>CMS login</title>
<style nonce="${nonce}">body{font:16px/1.5 system-ui,sans-serif;background:#f6f3ec;color:#121212;display:grid;place-items:center;min-height:100vh;margin:0;padding:1rem}</style>
</head><body><p id="msg">${esc(message)}</p>
<script nonce="${nonce}">
(function () {
  var origin = ${JSON.stringify(origin)};
  var data = ${data};
  var msg = document.getElementById('msg');
  if (!window.opener) { msg.textContent = 'Go back to the CMS tab and press the login button again.'; return; }
  window.addEventListener('message', function (e) {
    if (e.origin !== origin || e.data !== 'authorizing:github') return;
    window.opener.postMessage(data, origin);
    setTimeout(function () { window.close(); }, 200);
  });
  window.opener.postMessage('authorizing:github', origin);
})();
</script></body></html>`;
  return {
    html,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; frame-ancestors 'none'; base-uri 'none'`,
      'Referrer-Policy': 'no-referrer',
    },
  };
}

/**
 * @param {{ config: Config, fetchImpl?: typeof fetch, log?: (msg: string) => void }} deps
 */
export function createApp({ config, fetchImpl = fetch, log = () => {} }) {
  const callbackUrl = `${config.publicOrigin}/cms-auth/callback`;
  const secureCookie = config.publicOrigin.startsWith('https://');

  /** @param {import('node:http').ServerResponse} res */
  function send(res, status, body, headers = {}) {
    res.writeHead(status, { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
    res.end(body);
  }
  function finish(res, status, content, message) {
    const page = resultPage({ origin: config.publicOrigin, status, content, message });
    send(res, 200, page.html, {
      ...page.headers,
      'Set-Cookie': `${STATE_COOKIE}=; Path=/cms-auth; Max-Age=0; HttpOnly; SameSite=Lax${secureCookie ? '; Secure' : ''}`,
    });
  }

  /** @param {import('node:http').IncomingMessage} req @param {import('node:http').ServerResponse} res */
  return async function handler(req, res) {
    try {
      const url = new URL(req.url ?? '/', config.publicOrigin);
      if (req.method !== 'GET') return send(res, 405, 'Method not allowed', { Allow: 'GET' });

      if (url.pathname === '/cms-auth/health') {
        return send(res, 200, '{"status":"ok"}', { 'Content-Type': 'application/json' });
      }

      if (url.pathname === '/cms-auth/auth') {
        if ((url.searchParams.get('provider') ?? 'github') !== 'github') return send(res, 400, 'Unsupported provider');
        const requested = url.searchParams.get('scope') ?? 'public_repo';
        const scope = ALLOWED_SCOPES.has(requested) ? requested : 'public_repo';
        const state = randomBytes(24).toString('base64url');
        const target = new URL(`${config.githubWeb}/login/oauth/authorize`);
        target.searchParams.set('client_id', config.clientId);
        target.searchParams.set('redirect_uri', callbackUrl);
        target.searchParams.set('scope', scope);
        target.searchParams.set('state', state);
        target.searchParams.set('allow_signup', 'false');
        return send(res, 302, '', {
          Location: target.toString(),
          'Set-Cookie': `${STATE_COOKIE}=${state}; Path=/cms-auth; Max-Age=600; HttpOnly; SameSite=Lax${secureCookie ? '; Secure' : ''}`,
        });
      }

      if (url.pathname === '/cms-auth/callback') {
        const error = url.searchParams.get('error');
        if (error) {
          return finish(res, 'error', { message: url.searchParams.get('error_description') || error }, 'Login was cancelled.');
        }
        const code = url.searchParams.get('code') ?? '';
        const state = url.searchParams.get('state') ?? '';
        if (!code || !safeEqual(state, readCookie(req, STATE_COOKIE))) {
          return finish(res, 'error', { message: 'Login expired. Please try again.' }, 'Login expired. Close this window and try again.');
        }
        let token = '';
        try {
          const r = await fetchImpl(`${config.githubWeb}/login/oauth/access_token`, {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'culture-unfiltered-cms-auth' },
            body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: callbackUrl }),
            signal: AbortSignal.timeout(10_000),
          });
          const data = /** @type {any} */ (await r.json());
          token = typeof data.access_token === 'string' ? data.access_token : '';
          if (!token) log(`token exchange failed: ${data.error ?? r.status}`);
        } catch (err) {
          log(`token exchange error: ${err}`);
        }
        if (!token) {
          return finish(res, 'error', { message: 'GitHub did not accept the login. Please try again.' }, 'Login failed. Close this window and try again.');
        }
        return finish(res, 'success', { token, provider: 'github' }, 'Logged in. This window will close.');
      }

      return send(res, 404, 'Not found');
    } catch (err) {
      log(`error: ${err}`);
      if (!res.headersSent) send(res, 500, 'Something went wrong');
      else res.end();
    }
  };
}

/**
 * Handler used when OAuth settings are missing: health stays green (so the rest
 * of the site keeps deploying) and login attempts get a clear 503.
 * @param {string} reason
 */
export function createUnconfiguredApp(reason) {
  /** @param {import('node:http').IncomingMessage} req @param {import('node:http').ServerResponse} res */
  return function handler(req, res) {
    const path = new URL(req.url ?? '/', 'http://localhost').pathname;
    if (path === '/cms-auth/health') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify({ status: 'ok', configured: false }));
    }
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(`CMS login is not configured on this server yet (${reason}).`);
  };
}
