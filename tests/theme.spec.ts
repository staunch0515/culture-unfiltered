import { test, expect } from '@playwright/test';

const bg = (page: import('@playwright/test').Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const LIGHT = 'rgb(242, 241, 236)';
const DARK = 'rgb(19, 20, 18)';

test('visitors can switch colour scheme, and the choice is remembered', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await bg(page)).toBe(LIGHT);

  const toggle = page.locator('.site-header [data-theme-toggle]');
  await expect(toggle).toHaveAttribute('aria-label', 'Switch to dark mode');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await bg(page)).toBe(DARK);
  await expect(toggle).toHaveAttribute('aria-label', 'Switch to light mode');
  await expect(page.locator('[data-theme-choice="dark"]')).toHaveAttribute('aria-pressed', 'true');

  // Remembered across pages and reloads, applied before the page script runs.
  await page.goto('/people/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await bg(page)).toBe(DARK);

  // "Auto" hands control back to the system setting.
  await page.locator('[data-theme-choice="auto"]').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
  expect(await bg(page)).toBe(LIGHT);
  expect(await page.evaluate(() => localStorage.getItem('cu-theme'))).toBeNull();
});

test('a light choice overrides a dark system setting', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await bg(page)).toBe(DARK);
  await page.locator('[data-theme-choice="light"]').click();
  expect(await bg(page)).toBe(LIGHT);
  await page.reload();
  expect(await bg(page)).toBe(LIGHT);
});

test('the map shows the base map for the current scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/map/');
  await expect(page.locator('.world-map__base--light')).toBeVisible();
  await expect(page.locator('.world-map__base--dark')).toBeHidden();
  const dark = page.waitForResponse((r) => r.url().endsWith('/world-map-dark.svg'));
  await page.locator('.site-header [data-theme-toggle]').click();
  await expect(page.locator('.world-map__base--dark')).toBeVisible();
  await expect(page.locator('.world-map__base--light')).toBeHidden();
  expect((await dark).status()).toBe(200);
});
