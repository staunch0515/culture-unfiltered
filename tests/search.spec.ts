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

// Search and filter behaviour is tested on the fixture build, whose fixture stories
// and people never change, so CMS edits to real content cannot break these tests.
test.describe('site search (Pagefind)', () => {
  test('finds stories and narrows by result type', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(`${F}/search/?q=fixture`);
    const results = page.locator('.result');
    await expect(page.getByRole('link', { name: 'Fixture Song of Home' })).toBeVisible();
    await expect(page.locator('[data-search-status]')).toContainText('for “fixture”');

    await page.fill('#search-q', 'fado');
    await page.getByRole('radio', { name: 'People' }).check({ force: true });
    await expect(page).toHaveURL(/q=fado/);
    await expect(page).toHaveURL(/type=Person/);
    await expect(results).toHaveCount(1);
    await expect(results.first().locator('.result__type')).toHaveText('Person');
    await results.first().getByRole('link').click();
    await expect(page).toHaveURL(/\/people\/ines\/$/);
    expect(errors).toEqual([]);
  });

  test('shows a clear empty state', async ({ page }) => {
    await page.goto('/search/?q=zzzzqqq');
    await expect(page.locator('[data-search-status]')).toHaveText('0 results for “zzzzqqq”');
  });

  test('the header search link is reachable on every width', async ({ page }) => {
    await page.goto('/');
    await page.locator('.site-header').getByRole('link', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/search\/$/);
  });
});

test.describe('story filters with search', () => {
  test('search combines with the format filter, and lives in the URL', async ({ page }) => {
    await page.goto(`${F}/stories/`);
    const visible = page.locator('[data-filter-item="stories"]:visible');
    const all = await visible.count();
    await page.fill('#story-q', 'fixture');
    await expect(page).toHaveURL(/q=fixture/);
    await expect(visible).toHaveCount(2);
    await page.locator('input[name="media"][value="video"]').check({ force: true });
    await expect(visible).toHaveCount(1);
    await expect(page.getByRole('status')).toHaveText('Showing 1 story matching “fixture”');

    await page.reload();
    await expect(page.locator('#story-q')).toHaveValue('fixture');
    await expect(visible).toHaveCount(1);

    await page.getByRole('button', { name: 'Clear all filters' }).click();
    await expect(visible).toHaveCount(all);
    await expect(page).not.toHaveURL(/[?&](q|media)=/);
  });

  test('chips in one group combine with OR, across groups with AND', async ({ page }) => {
    await page.goto(`${F}/stories/`);
    const visible = page.locator('[data-filter-item="stories"]:visible');
    const countOf = async (sel: string) => page.locator(`[data-filter-item="stories"]${sel}`).count();
    await page.locator('input[name="media"][value="video"]').check({ force: true });
    const videos = await countOf('[data-media="video"]');
    await expect(visible).toHaveCount(videos);
    await page.locator('input[name="media"][value="audio"]').check({ force: true });
    await expect(visible).toHaveCount(videos + (await countOf('[data-media="audio"]')));
    await expect(page).toHaveURL(/media=video%2Caudio|media=video,audio/);
    await page.locator('input[name="country"][value="portugal"]').check({ force: true });
    await expect(visible).toHaveCount(2); // the two Portugal fixture stories: one video, one audio
  });

  test('a search with no matches shows the empty message', async ({ page }) => {
    await page.goto('/stories/?q=zzzzqqq');
    await expect(page.locator('[data-filter-empty="stories"]')).toBeVisible();
  });
});

test('resources can be filtered by type', async ({ page }) => {
  await page.goto('/resources/');
  const kinds = page.locator('input[name="kind"]:not([value=""])');
  test.skip((await kinds.count()) === 0, 'fewer than two resource types in the content');
  const kind = (await kinds.first().getAttribute('value'))!;
  await kinds.first().check({ force: true });
  const expected = await page.locator(`[data-filter-item="resources"][data-kind="${kind}"]`).count();
  await expect(page.locator('[data-filter-item="resources"]:visible')).toHaveCount(expected);
  await expect(page).toHaveURL(new RegExp(`kind=${kind}`));
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
