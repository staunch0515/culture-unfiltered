import { test, expect } from '@playwright/test';
import { builtRoutes, trackErrors, seriousA11yViolations, horizontalOverflow } from './helpers';

const routes = builtRoutes('dist');

test('the build produced every expected section', () => {
  for (const r of ['/', '/people/', '/themes/', '/stories/', '/method/', '/resources/', '/about/', '/map/']) {
    expect(routes).toContain(r);
  }
});

for (const route of routes) {
  test(`page ${route}`, async ({ page }) => {
    const errors = trackErrors(page);
    const res = await page.goto(route);
    expect(res?.status(), 'HTTP status').toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/Culture, Unfiltered/);
    expect(await horizontalOverflow(page), 'horizontal scroll (px)').toBeLessThanOrEqual(0);
    const missingAlt = await page.locator('img:not([alt])').count();
    expect(missingAlt, 'images without alt').toBe(0);
    expect(await seriousA11yViolations(page), 'axe serious/critical').toEqual([]);
    expect(errors, 'console errors').toEqual([]);
  });
}

test('unknown URLs show the 404 page', async ({ page }) => {
  const res = await page.goto('/this-does-not-exist/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('wandered off');
});
