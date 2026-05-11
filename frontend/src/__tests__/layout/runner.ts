// Shared runner: loads a fixture, runs the layout algorithm and evaluator per
// (viewport × strip × projection) config, and returns structured results.
//
// Used by both layout.test.ts (Vitest) and scripts/run-layout-tests.mjs (CLI).
//
// @author Claude Sonnet 4.6 Anthropic

import { calculateOffsetsWithDiagnostics } from '../../utils/mapCalloutUtils';
import { evaluateLayout, EvalResult, EvalMetrics, Violation } from './evaluateLayout';
import { Viewport, deriveParams } from './viewports';
import { ProjectionConfig, buildD3Projection, buildMapProjection } from './projections';
import { StoryCallout, PositionedCallout, LayoutDiagnostics } from '../../types/news';

export interface FixtureData {
  id: string;
  group: 'handcrafted' | 'live';
  tags: string[];
  notes?: string;
  callouts: StoryCallout[];
}

export interface PlacementInfo {
  headline: string;
  country: string;
  subjectX: number;
  subjectY: number;
  dx: number;
  dy: number;
  boxX: number;
  boxY: number;
}

export interface RunResult {
  fixtureId: string;
  group: string;
  tags: string[];
  projection: string;
  viewport: {
    name: string;
    w: number;
    h: number;
    visibleSvgHeight: number;
    bottomPaddingSvg: number;
  };
  pass: boolean;
  violations: Violation[];
  metrics: EvalMetrics;
  placements: PlacementInfo[];
  diagnostics: LayoutDiagnostics;
  screenshot: string | null;
}

export function runLayout(
  fixture: FixtureData,
  viewport: Viewport,
  projectionConfig: ProjectionConfig,
): RunResult {
  const d3proj = buildD3Projection(projectionConfig);
  const mapProjection = buildMapProjection(projectionConfig);

  // Always test with the date strip visible (bottomReservedPx=90) — the more
  // constrained, production-representative case. Strip off is only a transient
  // state when there is exactly one date of data, so it doesn't warrant its own
  // test dimension.
  const vp = deriveParams(viewport, 90);

  const { positioned, diagnostics } = calculateOffsetsWithDiagnostics(
    fixture.callouts,
    mapProjection,
    vp.visibleSvgHeight,
    vp.bottomPaddingSvg,
  );

  const evalResult: EvalResult = evaluateLayout(
    fixture.callouts,
    positioned,
    mapProjection,
    vp,
  );

  const placements: PlacementInfo[] = positioned.map((pc: PositionedCallout) => {
    const proj = d3proj([pc.country.longitude, pc.country.latitude]);
    const sx = proj ? proj[0] : 0;
    const sy = proj ? proj[1] : 0;
    return {
      headline: pc.headline,
      country: pc.country.name,
      subjectX: sx,
      subjectY: sy,
      dx: pc.dx,
      dy: pc.dy,
      boxX: sx + pc.dx - 135 / 2,
      boxY: sy + pc.dy - 50,
    };
  });

  return {
    fixtureId: fixture.id,
    group: fixture.group,
    tags: fixture.tags,
    projection: projectionConfig.name,
    viewport: {
      name: viewport.name,
      w: viewport.w,
      h: viewport.h,
      visibleSvgHeight: vp.visibleSvgHeight,
      bottomPaddingSvg: vp.bottomPaddingSvg,
    },
    pass: evalResult.pass,
    violations: evalResult.violations,
    metrics: evalResult.metrics,
    placements,
    diagnostics,
    screenshot: null,
  };
}
