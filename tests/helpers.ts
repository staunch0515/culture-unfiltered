import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Every page in a build output folder, as URL paths. New content means new pages, tested automatically. */
export function builtRoutes(dir = 'dist'): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) {
        if (name === '_astro' || name === 'pagefind' || name === 'admin') continue;
        walk(full);
      } else if (name === 'index.html') {
        const rel = relative(dir, d).split(sep).join('/');
        out.push(rel ? `/${rel}/` : '/');
      }
    }
  };
  walk(dir);
  out.push('/404.html');
  return out.sort();
}

/** Collects console errors and uncaught exceptions for a page. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

export async function seriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
}

export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

export const SITE_ORIGIN = 'http://localhost:4421';
export const FIXTURE_ORIGIN = 'http://localhost:4422';
