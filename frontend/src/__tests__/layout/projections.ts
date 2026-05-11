// Projection configs for the layout test matrix.
// Values must match PROJECTION_OPTIONS in src/utils/projectionOptions.ts and
// the ComposableMap defaults (translate = [width/2, height/2] = [400, 300]).
//
// @author Claude Sonnet 4.6 Anthropic

import { geoMercator, geoNaturalEarth1, GeoProjection } from 'd3-geo';
import { MapProjection } from '../../types/news';

export interface ProjectionConfig {
  name: string;
  // d3 projection string used by ComposableMap (for TestMapPage URL param)
  projectionType: 'geoMercator' | 'geoNaturalEarth1';
  center: [number, number];
  scale: number;
}

export const PROJECTIONS: ProjectionConfig[] = [
  { name: 'mercator',      projectionType: 'geoMercator',      center: [0, -25], scale: 90  },
  { name: 'natural-earth', projectionType: 'geoNaturalEarth1', center: [0, -28], scale: 153 },
];

export function buildD3Projection(config: ProjectionConfig): GeoProjection {
  const d3Constructor = config.projectionType === 'geoNaturalEarth1' ? geoNaturalEarth1 : geoMercator;
  return d3Constructor().center(config.center).scale(config.scale).translate([400, 300]);
}

export function buildMapProjection(config: ProjectionConfig): MapProjection {
  const d3proj = buildD3Projection(config);
  return (pt: [number, number]) => d3proj(pt) ?? null;
}
