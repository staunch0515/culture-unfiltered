import { test, expect } from '@playwright/test';

test('main navigation works with the keyboard', async ({ page, isMobile }) => {
  await page.goto('/');
  const nav = page.locator('#site-nav');
  const toggle = page.locator('.menu-toggle');
  if (isMobile) {
    await expect(nav).toBeHidden();
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Enter');
  } else {
    await expect(toggle).toBeHidden();
  }
  for (const label of ['Home', 'People', 'Themes', 'Stories', 'Our Method', 'Resources', 'About']) {
    await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible();
  }
  await nav.getByRole('link', { name: 'Stories', exact: true }).click();
  await expect(page).toHaveURL(/\/stories\/$/);
  await expect(page.locator('#site-nav a[aria-current="page"]')).toHaveText('Stories');
});

test('skip link moves focus to the main content', async ({ page }) => {
  await page.goto('/people/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});
