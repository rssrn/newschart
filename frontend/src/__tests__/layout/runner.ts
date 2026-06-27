// Shared runner: loads a fixture, runs the layout algorithm and evaluator per
// (viewport × strip × projection) config, and returns structured results.
//
// Used by both layout.test.ts (Vitest) and scripts/run-layout-tests.mjs (CLI).
//
// @author Claude Sonnet 4.6 Anthropic

import { calculateOffsetsWithDiagnostics, calculateOffsets, BOX_WIDTH, ANCHOR_Y } from '../../utils/mapCalloutUtils';
import { evaluateLayout, EvalResult, EvalMetrics, Violation } from './evaluateLayout';
import { Viewport, deriveParams } from './viewports';
import { ProjectionConfig, buildD3Projection, buildMapProjection } from './projections';
import { StoryCallout, PositionedCallout, LayoutDiagnostics } from '../../types/news';
import { groupByCountry, fullSizeTier, chipTier, pickDisplayCallout } from '../../utils/consensus';
import { placeChips, PositionedChip, CHIP_WIDTH, CHIP_HEIGHT } from '../../utils/chipLayout';

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
    [],
    viewport.w,
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

function rectsOverlap(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number, pad: number): boolean {
  return ax < bx + bw + pad &&
         ax + aw + pad > bx &&
         ay < by + bh + pad &&
         ay + ah + pad > by;
}

export function runTieredLayout(
  fixture: FixtureData,
  viewport: Viewport,
  projectionConfig: ProjectionConfig,
): RunResult {
  const d3proj = buildD3Projection(projectionConfig);
  const mapProjection = buildMapProjection(projectionConfig);
  const vp = deriveParams(viewport, 90);

  const groups = groupByCountry(fixture.callouts);
  const fullSizeGroups = fullSizeTier(groups, 4);

  const fullSizeCallouts: StoryCallout[] = fullSizeGroups.map(g => pickDisplayCallout(g));
  const chipGroups = chipTier(groups, fullSizeGroups);

  const fullSizePositioned: PositionedCallout[] = calculateOffsets(
    fullSizeCallouts,
    mapProjection,
    vp.visibleSvgHeight,
    vp.bottomPaddingSvg,
    [],
    viewport.w,
  );

  const fullSizeBoxes = fullSizePositioned.map((pc, i) => {
    const proj = d3proj([fullSizeCallouts[i].country.longitude, fullSizeCallouts[i].country.latitude]);
    const sx = proj ? proj[0] : 0;
    const sy = proj ? proj[1] : 0;
    return { x: sx + pc.dx - BOX_WIDTH / 2, y: sy + pc.dy - ANCHOR_Y };
  });

  const positionedChips: PositionedChip[] = placeChips(chipGroups, mapProjection, fullSizeBoxes, [], 800, vp.visibleSvgHeight);

  const fullSizeEval = evaluateLayout(fullSizeCallouts, fullSizePositioned, mapProjection, vp);

  const chipViolations: Violation[] = [];
  for (let i = 0; i < positionedChips.length; i++) {
    const ci = positionedChips[i];
    for (let j = i + 1; j < positionedChips.length; j++) {
      const cj = positionedChips[j];
      if (rectsOverlap(ci.x, ci.y, CHIP_WIDTH, CHIP_HEIGHT, cj.x, cj.y, CHIP_WIDTH, CHIP_HEIGHT, 2)) {
        chipViolations.push({
          type: 'box-overlap',
          calloutA: ci.group.country.name,
          calloutB: cj.group.country.name,
          detail: 'chip-chip overlap',
        });
      }
    }
    for (const fb of fullSizeBoxes) {
      if (rectsOverlap(ci.x, ci.y, CHIP_WIDTH, CHIP_HEIGHT, fb.x, fb.y, BOX_WIDTH, 140, 4)) {
        chipViolations.push({
          type: 'box-overlap',
          calloutA: ci.group.country.name,
          calloutB: '',
          detail: 'chip-fullsize overlap',
        });
      }
    }
  }

  const allViolations = [...fullSizeEval.violations, ...chipViolations];

  const fullSizePlacements: PlacementInfo[] = fullSizePositioned.map((pc, i) => {
    const proj = d3proj([fullSizeCallouts[i].country.longitude, fullSizeCallouts[i].country.latitude]);
    const sx = proj ? proj[0] : 0;
    const sy = proj ? proj[1] : 0;
    return {
      headline: pc.headline,
      country: pc.country.name,
      subjectX: sx,
      subjectY: sy,
      dx: pc.dx,
      dy: pc.dy,
      boxX: sx + pc.dx - BOX_WIDTH / 2,
      boxY: sy + pc.dy - ANCHOR_Y,
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
    pass: allViolations.length === 0,
    violations: allViolations,
    metrics: fullSizeEval.metrics,
    placements: fullSizePlacements,
    diagnostics: { nodes: [], bestScore: 0, combinationsEvaluated: 0 },
    screenshot: null,
  };
}
