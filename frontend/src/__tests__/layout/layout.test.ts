// Vitest suite for the callout layout algorithm.
// One test per (fixture × projection × viewport) — fails on any hard Violation.
// Always runs with the date strip visible (the more constrained production case).
//
// @author Claude Sonnet 4.6 Anthropic

import { describe, test, expect } from 'vitest';
import { runLayout, FixtureData } from './runner';
import { VIEWPORTS } from './viewports';
import { PROJECTIONS } from './projections';

import wideAusBraCan from './fixtures/handcrafted-wide-aus-bra-can.json';

const FIXTURES: FixtureData[] = [
  wideAusBraCan as FixtureData,
];

describe('callout layout algorithm', () => {
  for (const fixture of FIXTURES) {
    describe(fixture.id, () => {
      for (const proj of PROJECTIONS) {
        describe(proj.name, () => {
          for (const viewport of VIEWPORTS) {
            test(viewport.name, () => {
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
