// Regression test for issue #101: the stage-3 soft-fallback enumeration in calculateOffsets
// previously had no iteration or time bound, and could peg a CPU core indefinitely on a cluster
// tight enough to defeat stages 1 and 2 (observed: 40+ minutes on a 12-callout case). This test
// forces stage 3 with a tight budget and asserts it terminates promptly with a valid best-so-far
// layout, rather than running the near-cartesian-product search to completion.
//
// Calls calculateOffsetsWithDiagnostics directly rather than going through runLayout/runTieredLayout
// — stage 3's contract is "least-overlap spread", not "overlap-free", so routing this fixture
// through the normal violation-checking harness would force a spurious box-overlap failure. This
// fixture is deliberately kept out of the flat fixtures/ directory (see regression/ subfolder notes)
// so it isn't picked up by layout.test.ts or scripts/run-layout-tests.mjs.
//
// @author Claude Sonnet 5 Anthropic

import { describe, test, expect } from 'vitest';
import { calculateOffsetsWithDiagnostics } from '../../utils/mapCalloutUtils';
import { buildMapProjection, PROJECTIONS } from './projections';
import { VIEWPORTS, deriveParams } from './viewports';
import { FixtureData } from './runner';

const fixtureModules = import.meta.glob('./fixtures/regression/*.json', { eager: true });
const FIXTURES: FixtureData[] = Object.values(fixtureModules).map(m => (m as Record<string, unknown>).default ?? m) as FixtureData[];

describe('stage 3 (soft fallback) enumeration termination', () => {
  const fixture = FIXTURES.find(f => f.id === 'regression-stage3-timeout-guard-12-node');
  test('fixture is present', () => {
    expect(fixture).toBeDefined();
  });

  if (!fixture) return;
  // Rebind so nested function declarations below don't lose TS's non-null narrowing of `fixture`
  // (narrowing on a captured const isn't retained across a function-declaration boundary).
  const loadedFixture: FixtureData = fixture;

  // Tightest desktop viewport (least room to spread candidates), date strip visible — the most
  // constrained, most stage-3-prone configuration, same convention as runner.ts's runLayout.
  const viewport = VIEWPORTS.find(v => v.name === 'laptop-1366-typ')!;
  const vp = deriveParams(viewport, 90);
  const projection = buildMapProjection(PROJECTIONS[0]);

  function runAndAssert(budget: Parameters<typeof calculateOffsetsWithDiagnostics>[6], maxElapsedMs: number) {
    const start = performance.now();
    const { positioned, diagnostics } = calculateOffsetsWithDiagnostics(
      loadedFixture.callouts,
      projection,
      vp.visibleSvgHeight,
      vp.bottomPaddingSvg,
      [],
      viewport.w,
      budget,
    );
    const elapsedMs = performance.now() - start;

    // Proves termination, not just eventual return.
    expect(elapsedMs).toBeLessThan(maxElapsedMs);

    // Proves the fixture actually reached stage 3. If a future change to stage 1/2 makes this
    // cluster resolve earlier, this assertion fails loudly instead of the test silently no longer
    // exercising the bound at all.
    expect(diagnostics.softFallback).toBe(true);

    // Proves the bound actually fired — with 12 nodes it should not have had time to exhaust the
    // (reduced) candidate space within the budget on its own.
    expect(diagnostics.truncated).toBe(true);

    // Proves bestPlacements was returned (best-so-far), not the pre-#101 degenerate stacked
    // fallback (dx:0, dy:-80 for every callout).
    expect(positioned).toHaveLength(loadedFixture.callouts.length);
    for (const p of positioned) {
      expect(Number.isFinite(p.dx)).toBe(true);
      expect(Number.isFinite(p.dy)).toBe(true);
    }
    const allStacked = positioned.every(p => p.dx === 0 && p.dy === -80);
    expect(allStacked).toBe(false);

    return elapsedMs;
  }

  test('terminates within an explicit tight time budget', () => {
    // Generous margin over the 100ms budget to absorb the throttled bound check (every 1024 node
    // visits) and non-softPass stage 1/2 work.
    runAndAssert({ timeBudgetMs: 100 }, 2000);
  });

  test('terminates promptly on the default (no-argument) budget — the actual production path', () => {
    // MapChart.tsx and StoryCalloutList.tsx call calculateOffsets/-WithDiagnostics with no 7th
    // argument, so this is the path issue #101 was filed against — an explicit small budget above
    // proves the *mechanism* works, but only this proves the shipped default actually bounds it.
    const elapsedMs = runAndAssert(undefined, 5000);
    // Surfaces the real default-budget wall time in CI logs, since DEFAULT_STAGE3_TIME_BUDGET_MS
    // (400ms) is only a target the 1024-visit throttle can overshoot, not a hard ceiling — worth
    // being able to see the actual number without re-running.
    console.log(`[stage3Termination] default-budget elapsed: ${elapsedMs.toFixed(1)}ms`);
  });
});
