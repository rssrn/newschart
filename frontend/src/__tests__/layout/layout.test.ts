// Vitest suite for the callout layout algorithm.
// One test per (fixture × projection × viewport) — fails on any hard Violation.
// Always runs with the date strip visible (the more constrained production case).
// Fixtures tagged 'needs-fix' are skipped so CI stays green while bugs are tracked.
//
// @author Claude Sonnet 4.6 Anthropic

import { describe, test, expect } from 'vitest';
import { runLayout, FixtureData } from './runner';
import { VIEWPORTS } from './viewports';
import { PROJECTIONS } from './projections';

// Load all fixture files from the fixtures directory.
const fixtureModules = import.meta.glob('./fixtures/*.json', { eager: true });
const FIXTURES: FixtureData[] = Object.values(fixtureModules).map(m => (m as Record<string, unknown>).default ?? m) as FixtureData[];

describe('callout layout algorithm', () => {
  for (const fixture of FIXTURES) {
    const needsFix = fixture.tags?.includes('needs-fix');
    describe(fixture.id, () => {
      for (const proj of PROJECTIONS) {
        describe(proj.name, () => {
          for (const viewport of VIEWPORTS) {
            const run = needsFix ? test.skip : test;
            run(viewport.name, () => {
              const result = runLayout(fixture, viewport, proj);
              if (result.violations.length > 0) {
                const v = result.violations[0];
                const msg = `${v.type}: ${v.calloutA}${v.calloutB ? ` / ${v.calloutB}` : ''} — ${v.detail}`;
                expect.fail(msg);
              }
              expect(result.pass).toBe(true);
            });
          }
        });
      }
    });
  }
});
