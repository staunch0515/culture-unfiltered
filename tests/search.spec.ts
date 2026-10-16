import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURE_ORIGIN as F, trackErrors } from './helpers';

/** True if any file in a build folder contains the text. */
function buildContains(dir: string, text: string): boolean {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (buildContains(full, text)) return true;
    } else if (/\.(html|json|js|svg)$/.test(name) && readFileSync(full, 'utf8').includes(text)) {
      return true;
    }
  }
  return false;
}

test.describe('site search (Pagefind)', () => {
  test('finds stories and narrows by result type', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/search/?q=kitchen');
    const results = page.locator('.result');
    await expect(results.first()).toBeVisible();
    await expect(page.getByRole('link', { name: "Grandmother's Kitchen" })).toBeVisible();
    await expect(page.locator('[data-search-status]')).toContainText('for “kitchen”');

    await page.fill('#search-q', 'cello');
    await page.getByRole('radio', { name: 'People' }).check({ force: true });
    await expect(page).toHaveURL(/q=cello/);
    await expect(page).toHaveURL(/type=Person/);
    await expect(results).toHaveCount(1);
    await expect(results.first().locator('.result__type')).toHaveText('Person');
    await results.first().getByRole('link').click();
    await expect(page).toHaveURL(/\/people\/lena\/$/);
    expect(errors).toEqual([]);
  });

  test('shows a clear empty state', async ({ page }) => {
    await page.goto('/search/?q=zzzzqqq');
    await expect(page.locator('[data-search-status]')).toHaveText('0 results for “zzzzqqq”');
  });

  test('the header search link is reachable on every width', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/search\/$/);
  });
});

test.describe('story filters with search', () => {
  test('search combines with country and format filters, and lives in the URL', async ({ page }) => {
    await page.goto('/stories/');
    const visible = page.locator('[data-filter-item="stories"]:visible');
    const all = await visible.count();
    await page.fill('#story-q', 'kitchen');
    await expect(page).toHaveURL(/q=kitchen/);
    await expect(visible).toHaveCount(2);
    await page.selectOption('select[name="media"]', 'photo');
    await expect(visible).toHaveCount(1);
    await expect(page.getByRole('status')).toHaveText('Showing 1 story matching “kitchen”');

    await page.reload();
    await expect(page.locator('#story-q')).toHaveValue('kitchen');
    await expect(visible).toHaveCount(1);

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(visible).toHaveCount(all);
    await expect(page).not.toHaveURL(/[?&](q|media)=/);
  });

  test('a search with no matches shows the empty message', async ({ page }) => {
    await page.goto('/stories/?q=zzzzqqq');
    await expect(page.locator('[data-filter-empty="stories"]')).toBeVisible();
  });
});

test('resources can be filtered by type', async ({ page }) => {
  await page.goto('/resources/');
  await page.getByRole('radio', { name: 'Discussion guide' }).check({ force: true });
  await expect(page.locator('[data-filter-item="resources"]:visible')).toHaveCount(1);
  await expect(page).toHaveURL(/kind=discussion/);
});

test('new content is searchable without code changes', async ({ page }) => {
  await page.goto(`${F}/search/?q=fado`);
  await expect(page.getByRole('link', { name: 'Inês' })).toBeVisible();
  // The unpublished fixture participant must not exist anywhere in the build or the results.
  expect(buildContains('dist-fixtures', 'Draftina')).toBe(false);
  await page.goto(`${F}/search/?q=draftina`);
  await expect(page.locator('[data-search-status]')).toContainText('for “draftina”');
  await expect(page.getByRole('link', { name: /Draftina/ })).toHaveCount(0);
});
