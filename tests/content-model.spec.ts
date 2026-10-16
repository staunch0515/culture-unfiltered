/**
 * Proves that adding content needs only new files.
 * dist-fixtures/ is the real site plus tests/fixtures/content: a 7th participant
 * from a new country (Portugal), an unpublished participant, a new theme
 * (Music) and a new story. None of these exist in the real content.
 */
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { mediaTypes, resourceKinds } from '../src/lib/constants';
import { FIXTURE_ORIGIN as F, trackErrors, seriousA11yViolations, horizontalOverflow, builtRoutes } from './helpers';

test.describe('adding content is just adding files', () => {
  test('a 7th participant from a new country appears on People, in the filter and on the map', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(`${F}/people/`);
    await expect(page.getByRole('heading', { level: 2, name: 'Inês' })).toBeVisible();
    await expect(page.getByText('Draftina')).toHaveCount(0);

    const portugal = page.getByRole('radio', { name: /Portugal/ });
    await expect(portugal).toHaveCount(1);
    await portugal.check({ force: true });
    await expect(page).toHaveURL(/country=portugal/);
    await expect(page.locator('[data-filter-item="people"]:visible')).toHaveCount(1);
    await expect(page.getByRole('status')).toHaveText('Showing 1 person');

    await page.goto(`${F}/map/`);
    await expect(page.locator('.world-map__marker[data-country="portugal"]')).toHaveCount(1);
    await page.goto(`${F}/`);
    await expect(page.locator('.world-map__marker[data-country="portugal"]')).toHaveCount(1);
    await expect(page.locator('.hero .lede')).toContainText('7 young people in 7 countries');
    expect(errors).toEqual([]);
  });

  test('the new participant gets a profile with derived themes and stories', async ({ page }) => {
    await page.goto(`${F}/people/ines/`);
    await expect(page.locator('h1')).toHaveText('Inês');
    const themes = page.locator('.facts').getByRole('link');
    await expect(themes).toHaveText([/Home/, /Music/]);
    await expect(page.getByRole('link', { name: 'Fixture Song of Home' })).toBeVisible();
    expect(await seriousA11yViolations(page)).toEqual([]);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test('a new theme gets its own page with a country-by-country comparison', async ({ page }) => {
    await page.goto(`${F}/themes/`);
    await expect(page.getByRole('link', { name: 'Music' })).toBeVisible();
    await page.goto(`${F}/themes/music/`);
    const columns = page.locator('.compare__col h3');
    await expect(columns).toHaveText([/Japan/, /Portugal/]);
    await expect(page.getByText('Fixture perspective from Inês about music.')).toBeVisible();
  });

  test('stories filters pick up the new country and theme', async ({ page }) => {
    await page.goto(`${F}/stories/`);
    await expect(page.locator('select[name="country"] option[value="portugal"]')).toHaveCount(1);
    await expect(page.locator('select[name="theme"] option[value="music"]')).toHaveCount(1);
    await page.selectOption('select[name="country"]', 'portugal');
    await expect(page.locator('[data-filter-item="stories"]:visible')).toHaveCount(1);
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page).not.toHaveURL(/country=/);
  });

  test('unpublished participants have no page', async ({ page }) => {
    const res = await page.goto(`${F}/people/hidden-draft/`);
    expect(res?.status()).toBe(404);
    expect(builtRoutes('dist-fixtures')).not.toContain('/people/hidden-draft/');
  });

  test('fixtures never leak into the real build', async ({ page }) => {
    const real = builtRoutes('dist');
    expect(real).not.toContain('/people/ines/');
    expect(real).not.toContain('/themes/music/');
    await page.goto('/people/');
    await expect(page.getByText('Inês')).toHaveCount(0);
    await expect(page.getByRole('radio', { name: /Portugal/ })).toHaveCount(0);
  });
});

test('code contains no hard-coded country, participant or theme lists', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'static check, run once');
  const read = (dir: string) => readdirSync(dir).map((f) => readFileSync(join(dir, f), 'utf8'));
  const field = (text: string, key: string) => text.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();
  const countryNames = read('src/content/countries').map((t) => JSON.parse(t).name as string);
  const personNames = read('src/content/people').map((t) => field(t, 'name')!);
  // Fixed format vocabularies (e.g. the "language" resource kind) may share a word with a theme slug.
  const vocab = new Set<string>([...mediaTypes, ...resourceKinds]);
  const themeSlugs = readdirSync('src/content/themes')
    .map((f) => f.replace(/\.md$/, ''))
    .filter((slug) => !vocab.has(slug));

  const codeFiles: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (p !== join('src', 'content')) walk(p); }
      else if (['.astro', '.ts', '.mjs', '.js', '.css'].includes(extname(p))) codeFiles.push(p);
    }
  };
  walk('src');
  codeFiles.push('astro.config.mjs');

  const hits: string[] = [];
  for (const file of codeFiles) {
    const code = readFileSync(file, 'utf8');
    for (const name of [...countryNames, ...personNames]) {
      if (new RegExp(`\\b${name}\\b`).test(code)) hits.push(`${file}: "${name}"`);
    }
    for (const slug of themeSlugs) {
      if (new RegExp(`['"\`/]${slug}['"\`/]`).test(code)) hits.push(`${file}: theme "${slug}"`);
    }
  }
  expect(hits).toEqual([]);
});
