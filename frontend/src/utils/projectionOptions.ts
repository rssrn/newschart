import { geoMercator, geoNaturalEarth1, GeoProjection } from "d3-geo";

// @author Claude Sonnet 4.6 Anthropic
export type ProjectionType = 'geoMercator' | 'geoNaturalEarth1';
// @author Claude Sonnet 4.6 Anthropic
export type FetchStatus = 'loading' | 'error' | 'success';

export interface ProjectionOption {
  readonly value: ProjectionType;
  readonly label: string;
  readonly d3Constructor: () => GeoProjection;
  readonly config: { center: [number, number]; scale: number };
}

export const PROJECTION_OPTIONS: ProjectionOption[] = [
  { value: 'geoMercator',       label: 'Mercator',       d3Constructor: geoMercator,       config: { center: [0, -25], scale: 90  } },
  { value: 'geoNaturalEarth1',  label: 'Natural Earth',  d3Constructor: geoNaturalEarth1,  config: { center: [0, -28], scale: 153 } },
];
