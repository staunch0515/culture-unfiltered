import type { APIRoute } from 'astro';
import { loadSite } from '@/lib/content';
import { countryShapes, MAP_W, MAP_H } from '@/lib/geo';

/**
 * Static base map, generated at build time and cached by the browser.
 * Participating countries (from content) are filled with the highlighter colour.
 */
export const GET: APIRoute = async () => {
  const s = await loadSite();
  const shapes = countryShapes(s.activeCountries.map((c) => ({ iso: c.data.iso, name: c.data.name })));
  const paths = (active: boolean) =>
    shapes
      .filter((x) => x.active === active && x.d)
      .map((x) => `<path d="${x.d}"/>`)
      .join('');
  // Colours follow the page scheme: an SVG used as an image still sees prefers-color-scheme.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP_W} ${MAP_H}" width="${MAP_W}" height="${MAP_H}">` +
    `<style>.l{fill:#d5d4cb;stroke:#e8e7e0}.a{fill:#d9f24a;stroke:#e8e7e0}` +
    `@media (prefers-color-scheme: dark){.l{fill:#34352f;stroke:#1d1e1b}.a{fill:#d9f24a;stroke:#1d1e1b}}</style>` +
    `<g class="l" stroke-width="0.6" stroke-linejoin="round">${paths(false)}</g>` +
    `<g class="a" stroke-width="0.6" stroke-linejoin="round">${paths(true)}</g>` +
    `</svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
