import { test, expect } from '@playwright/test';

test('scroll reveal shows every element once scrolled into view', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const pending = page.locator('.reveal-pending');
  expect(await pending.count(), 'below-the-fold elements wait for scroll').toBeGreaterThan(0);
  await expect(page.locator('.hero .reveal-pending')).toHaveCount(0);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
  });
  await expect(page.locator('.reveal-pending:not(.is-visible)')).toHaveCount(0);
});

test('reduced motion hides nothing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.reveal-pending')).toHaveCount(0);
});
