import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { FIXTURE_ORIGIN as F } from './helpers';

const countryCount = readdirSync('src/content/countries').length;

test('the map draws a local base map and one marker per country', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost')) external.push(r.url());
  });
  const svg = page.waitForResponse((r) => r.url().endsWith('/world-map.svg'));
  await page.goto('/map/');
  const res = await svg;
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain('<path');
  await expect(page.locator('.world-map__marker')).toHaveCount(countryCount);
  await expect(page.locator('.place')).toHaveCount(countryCount);
  expect(external, 'no third-party requests').toEqual([]);
});

test('a map marker leads to that country’s people', async ({ page }) => {
  await page.goto('/map/');
  const marker = page.locator('.world-map__marker[data-country="kenya"]');
  await expect(marker).toHaveAttribute('href', /\/people\/\?country=kenya$/);
  await marker.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/people\/\?country=kenya$/);
  await expect(page.locator('[data-filter-item="people"]:visible')).toHaveCount(1);
});

test('a new country appears on the map and in the place list', async ({ page }) => {
  await page.goto(`${F}/map/`);
  await expect(page.locator('.world-map__marker')).toHaveCount(countryCount + 1);
  await expect(page.locator('#place-portugal')).toContainText('Inês');
});
