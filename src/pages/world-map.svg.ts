import type { APIRoute } from 'astro';
import { loadSite } from '@/lib/content';
import { countryShapes, MAP_W, MAP_H } from '@/lib/geo';

/**
 * Static base map, generated at build time and cached by the browser.
 * Participating countries (from content) are filled with the accent tint.
 */
export const GET: APIRoute = async () => {
  const s = await loadSite();
  const shapes = countryShapes(s.activeCountries.map((c) => ({ iso: c.data.iso, name: c.data.name })));
  const paths = (active: boolean) =>
    shapes
      .filter((x) => x.active === active && x.d)
      .map((x) => `<path d="${x.d}"/>`)
      .join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP_W} ${MAP_H}" width="${MAP_W}" height="${MAP_H}">` +
    `<g fill="#ddd5c6" stroke="#f6f3ec" stroke-width="0.6" stroke-linejoin="round">${paths(false)}</g>` +
    `<g fill="#f0c7b5" stroke="#f6f3ec" stroke-width="0.6" stroke-linejoin="round">${paths(true)}</g>` +
    `</svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
