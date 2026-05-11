// Thin test page rendered at /__layout-test for Playwright screenshot capture.
// Reads ?case=<fixture-id>, ?strip=<0|1>, and ?projection=<mercator|natural-earth>
// from URL params, looks up the matching fixture (bundled at build time via
// import.meta.glob), and renders the map with those callouts — no API fetch.
//
// @author Claude Sonnet 4.6 Anthropic

import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { geoMercator, geoNaturalEarth1 } from 'd3-geo';
import StoryCalloutList from './StoryCalloutList';
import { StoryCallout } from './types/news';

// Bundle all handcrafted and live fixtures at build time.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FIXTURE_MODULES = import.meta.glob<{ default: any }>(
  './__tests__/layout/fixtures/*.json',
  { eager: true },
);

interface FixtureShape {
  id: string;
  callouts: StoryCallout[];
}

function loadFixture(caseId: string): FixtureShape | null {
  for (const [path, mod] of Object.entries(FIXTURE_MODULES)) {
    const data = mod.default ?? mod;
    if (typeof data === 'object' && data !== null && (data as FixtureShape).id === caseId) {
      return data as FixtureShape;
    }
    const filename = path.split('/').pop()?.replace('.json', '');
    if (filename === caseId) return data as FixtureShape;
  }
  return null;
}

// Projection configs — must match projections.ts in the test harness.
const PROJECTION_CONFIGS = {
  'mercator':      { type: 'geoMercator'      as const, center: [0, -25] as [number, number], scale: 90  },
  'natural-earth': { type: 'geoNaturalEarth1' as const, center: [0, -28] as [number, number], scale: 153 },
} as const;

type ProjectionKey = keyof typeof PROJECTION_CONFIGS;

const DEFAULT_FILL   = '#1e2d3d';
const DEFAULT_STROKE = '#2d4257';

// @author Claude Sonnet 4.6 Anthropic
export default function TestMapPage(): React.ReactElement {
  const params = new URLSearchParams(window.location.search); // NOSONAR
  const caseId = params.get('case') ?? '';
  const stripOn = params.get('strip') === '1';
  const projKey = (params.get('projection') ?? 'mercator') as ProjectionKey;

  const projConfig = PROJECTION_CONFIGS[projKey] ?? PROJECTION_CONFIGS['mercator'];

  const fixture = useMemo(() => loadFixture(caseId), [caseId]);

  const d3Projection = useMemo(() => {
    const fn = projConfig.type === 'geoNaturalEarth1' ? geoNaturalEarth1 : geoMercator;
    return fn().center(projConfig.center).scale(projConfig.scale).translate([400, 300]);
  }, [projConfig]);

  const mapProjection = useMemo(() => {
    return (pt: [number, number]) => {
      const r = d3Projection(pt);
      return r ?? null;
    };
  }, [d3Projection]);

  if (!fixture) {
    return (
      <div style={{ padding: 40, color: '#fff', background: '#111', fontFamily: 'monospace' }}>
        <h2>Layout test page</h2>
        <p>No fixture found for <code>?case={caseId}</code></p>
        <p>Available IDs:</p>
        <ul>
          {Object.values(FIXTURE_MODULES).map((mod, i) => {
            const data = (mod as { default?: FixtureShape }).default ?? (mod as unknown as FixtureShape);
            return <li key={i}><code>{data.id}</code></li>;
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="map-container" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <ComposableMap
        projection={projConfig.type}
        projectionConfig={{ center: projConfig.center, scale: projConfig.scale }}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies
          geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
          stroke={DEFAULT_STROKE}
          strokeWidth={0.5}
          style={{ pointerEvents: 'none' }}
        >
          {({ geographies }) =>
            geographies
              .filter(geo => geo.properties.name !== 'Antarctica')
              .map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={DEFAULT_FILL}
                  stroke={DEFAULT_STROKE}
                  strokeWidth={0.5}
                  tabIndex={-1}
                />
              ))
          }
        </Geographies>
        <StoryCalloutList
          projection={mapProjection}
          callouts={fixture.callouts}
          bottomReservedPx={stripOn ? 90 : 0}
        />
      </ComposableMap>
    </div>
  );
}
