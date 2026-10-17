import { test, expect } from '@playwright/test';
import { FIXTURE_ORIGIN as F } from './helpers';
import { activeCountries } from './content';

test('the map draws a local base map and one marker per country with participants', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost')) external.push(r.url());
  });
  const svg = page.waitForResponse((r) => r.url().endsWith('/world-map.svg'));
  await page.goto('/map/');
  const res = await svg;
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain('<path');
  const expected = activeCountries('real').length;
  await expect(page.locator('.world-map__marker')).toHaveCount(expected);
  await expect(page.locator('.place')).toHaveCount(expected);
  expect(external, 'no third-party requests').toEqual([]);
});

test('a map marker leads to that country’s people', async ({ page }) => {
  await page.goto('/map/');
  const marker = page.locator('.world-map__marker').first();
  const country = await marker.getAttribute('data-country');
  expect(country).toBeTruthy();
  await marker.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/people/\\?country=${country}$`));
  const shown = page.locator('[data-filter-item="people"]:visible');
  expect(await shown.count()).toBeGreaterThan(0);
  for (const c of await shown.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.country))) {
    expect(c).toBe(country);
  }
});

test('a new country appears on the map and in the place list', async ({ page }) => {
  await page.goto(`${F}/map/`);
  await expect(page.locator('.world-map__marker')).toHaveCount(activeCountries('fixtures').length);
  await expect(page.locator('.world-map__marker[data-country="portugal"]')).toHaveCount(1);
  await expect(page.locator('#place-portugal')).toContainText('Inês');
});
