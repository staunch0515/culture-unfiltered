import { test, expect } from '@playwright/test';
import { builtRoutes, SITE_ORIGIN } from './helpers';

test('story pages make no third-party requests until play is pressed', async ({ page }) => {
  const storyRoutes = builtRoutes('dist').filter((r) => /^\/stories\/.+/.test(r));
  let videoPages = 0;
  for (const route of storyRoutes) {
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

    const play = page.locator('.video__play').first();
    if (await play.count()) {
      videoPages++;
      await play.click();
      const iframe = page.locator('.video__frame iframe').first();
      await expect(iframe).toHaveAttribute('src', /^https:\/\/(www\.youtube-nocookie\.com|player\.vimeo\.com)\//);
      await expect(iframe).toHaveAttribute('title', /.+/);
    }
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  }
  expect(videoPages, 'at least one story has a video').toBeGreaterThan(0);
});
