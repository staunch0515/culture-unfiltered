import type { APIRoute, GetStaticPaths } from 'astro';
import { loadSite } from '@/lib/content';
import { countryShapes, MAP_W, MAP_H } from '@/lib/geo';

/**
 * Static base maps (/world-map-light.svg and /world-map-dark.svg), generated at
 * build time and cached by the browser. The page shows the one matching its
 * current colour scheme. Participating countries (from content) use the
 * highlighter colour. Colours are the design tokens' values.
 */
const palettes = {
  light: { land: '#d5d4cb', active: '#d9f24a', border: '#e8e7e0' },
  dark: { land: '#34352f', active: '#d9f24a', border: '#1d1e1b' },
} as const;

export const getStaticPaths: GetStaticPaths = () => [{ params: { scheme: 'light' } }, { params: { scheme: 'dark' } }];

export const GET: APIRoute = async ({ params }) => {
  const c = palettes[params.scheme as keyof typeof palettes];
  const s = await loadSite();
  const shapes = countryShapes(s.activeCountries.map((x) => ({ iso: x.data.iso, name: x.data.name })));
  const paths = (active: boolean) =>
    shapes
      .filter((x) => x.active === active && x.d)
      .map((x) => `<path d="${x.d}"/>`)
      .join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP_W} ${MAP_H}" width="${MAP_W}" height="${MAP_H}">` +
    `<g fill="${c.land}" stroke="${c.border}" stroke-width="0.6" stroke-linejoin="round">${paths(false)}</g>` +
    `<g fill="${c.active}" stroke="${c.border}" stroke-width="0.6" stroke-linejoin="round">${paths(true)}</g>` +
    `</svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
