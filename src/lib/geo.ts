/**
 * Build-time map geometry. One projection is shared by the static base map
 * (/world-map.svg) and the inline markers, so they always line up.
 */
import { geoEqualEarth, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry } from 'geojson';
import world from 'world-atlas/countries-110m.json';

export const MAP_W = 1000;
export const MAP_H = 470;

const ANTARCTICA = '010';
type CountryProps = { name: string };
const topology = world as unknown as Topology<{ countries: GeometryCollection<CountryProps> }>;
const all = feature(topology, topology.objects.countries) as FeatureCollection<Geometry, CountryProps>;
const land: FeatureCollection<Geometry, CountryProps> = {
  type: 'FeatureCollection',
  features: all.features.filter((f) => String(f.id) !== ANTARCTICA),
};

const projection = geoEqualEarth().fitExtent(
  [
    [8, 8],
    [MAP_W - 8, MAP_H - 8],
  ],
  land,
);
const path = geoPath(projection).digits(0);

/** Project latitude/longitude to SVG coordinates. */
export function project(lat: number, lng: number): { x: number; y: number } {
  const p = projection([lng, lat]) ?? [0, 0];
  return { x: Math.round(p[0] * 10) / 10, y: Math.round(p[1] * 10) / 10 };
}

/** SVG path data for every country, flagged when it matches a participating country. */
export function countryShapes(match: { iso?: string | undefined; name: string }[]) {
  const isos = new Set(match.map((m) => m.iso).filter(Boolean));
  const names = new Set(match.map((m) => m.name.toLowerCase()));
  return land.features.map((f) => ({
    d: path(f) ?? '',
    active: isos.has(String(f.id)) || names.has(f.properties.name.toLowerCase()),
  }));
}
