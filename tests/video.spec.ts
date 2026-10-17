import { test, expect } from '@playwright/test';
import { builtRoutes, SITE_ORIGIN, FIXTURE_ORIGIN as F } from './helpers';

test('story pages make no third-party requests until play is pressed', async ({ page }) => {
  for (const route of builtRoutes('dist').filter((r) => /^\/stories\/.+/.test(r))) {
    const external: string[] = [];
    await page.route('**/*', (r) => {
      const url = r.request().url();
      if (url.startsWith(SITE_ORIGIN) || url.startsWith('data:')) return r.continue();
      external.push(url);
      return r.abort();
    });
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    expect(external, `third-party requests on ${route} before play`).toEqual([]);
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  }
});

test('pressing play loads the privacy-friendly player', async ({ page }) => {
  const external: string[] = [];
  await page.route('**/*', (r) => {
    const url = r.request().url();
    if (url.startsWith(F) || url.startsWith('data:')) return r.continue();
    external.push(url);
    return r.abort();
  });
  await page.goto(`${F}/stories/fixture-video-diary/`);
  await page.waitForLoadState('networkidle');
  expect(external, 'nothing third-party before play').toEqual([]);
  await page.locator('.video__play').first().click();
  const iframe = page.locator('.video__frame iframe').first();
  await expect(iframe).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\/aqz-KE-bpKQ/);
  await expect(iframe).toHaveAttribute('title', /.+/);
});
