import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';

test('the CMS config is valid and covers every content folder', async ({ request }) => {
  const res = await request.get('/admin/config.yml');
  expect(res.status()).toBe(200);
  const config = JSON.parse(await res.text()); // JSON is valid YAML
  expect(config.backend).toMatchObject({ name: 'github', auth_endpoint: 'cms-auth/auth', auth_scope: 'public_repo' });
  expect(config.backend.commit_messages.update).toContain('{{author-login}}');
  const folders = config.collections.map((c: { folder: string }) => c.folder.replace('src/content/', '')).sort();
  expect(folders).toEqual(readdirSync('src/content').sort());
});

test('the CMS loads from this site and offers GitHub login', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'the editor is a desktop tool');
  const thirdParty: string[] = [];
  page.on('request', (r) => {
    const host = new URL(r.url()).host;
    // local_backend probes a local decap-server on another localhost port; that is not third party.
    if (!host.startsWith('localhost')) thirdParty.push(r.url());
  });
  await page.goto('/admin/');
  await expect(page.getByRole('button', { name: /Login with GitHub/i })).toBeVisible({ timeout: 20_000 });
  expect(thirdParty).toEqual([]);
});
