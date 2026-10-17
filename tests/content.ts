/**
 * Reads the content files so tests derive their expectations from the data,
 * never from specific people or stories that editors may change in the CMS.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = { real: ['src/content'], fixtures: ['src/content', 'tests/fixtures/content'] } as const;

const field = (text: string, key: string) => text.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))?.[1]?.trim();
const ids = (dir: string) => (existsSync(dir) ? readdirSync(dir).map((f) => f.replace(/\.[^.]+$/, '')) : []);

export function readPeople(site: keyof typeof ROOTS = 'real') {
  return ROOTS[site].flatMap((root) => {
    const dir = join(root, 'people');
    return existsSync(dir)
      ? readdirSync(dir).map((f) => {
          const text = readFileSync(join(dir, f), 'utf8');
          return { id: f.replace(/\.md$/, ''), country: field(text, 'country') ?? '', published: field(text, 'published') !== 'false' };
        })
      : [];
  });
}

/** Countries that have at least one published participant (the ones the map and filters show). */
export function activeCountries(site: keyof typeof ROOTS = 'real'): string[] {
  const countries = new Set(ROOTS[site].flatMap((root) => ids(join(root, 'countries'))));
  return [...new Set(readPeople(site).filter((p) => p.published && countries.has(p.country)).map((p) => p.country))];
}

export function publishedPeople(site: keyof typeof ROOTS = 'real') {
  return readPeople(site).filter((p) => p.published);
}
