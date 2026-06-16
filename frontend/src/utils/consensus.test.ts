import { describe, it, expect } from 'vitest';
import { groupByCountry, fullSizeTier, pickDisplayCallout, ConsensusGroup } from './consensus';
import { StoryCallout } from '../types/news';
import live20260605 from '../__tests__/layout/fixtures/live-2026-06-05-all-sources.json';

function makeCallout(overrides: Partial<StoryCallout>): StoryCallout {
  return {
    headline: 'Test',
    detail: 'Test detail',
    country: { name: 'Test', iso2: 'XX', latitude: 0, longitude: 0 },
    source: 'GOOGLE_GEMINI',
    ...overrides,
  };
}

describe('groupByCountry', () => {
  it('groups callouts by country iso2', () => {
    const callouts = [
      makeCallout({ country: { name: 'US', iso2: 'US', latitude: 0, longitude: 0 }, source: 'GOOGLE_GEMINI' }),
      makeCallout({ country: { name: 'US', iso2: 'US', latitude: 0, longitude: 0 }, source: 'PERPLEXITY' }),
      makeCallout({ country: { name: 'GB', iso2: 'GB', latitude: 0, longitude: 0 }, source: 'OPENAI' }),
    ];
    const groups = groupByCountry(callouts);
    expect(groups).toHaveLength(2);
    const us = groups.find(g => g.country.iso2 === 'US')!;
    expect(us.callouts).toHaveLength(2);
    expect(us.sourcesFiled).toEqual(['GOOGLE_GEMINI', 'PERPLEXITY']);
    expect(us.consensusCount).toBe(2);
    const gb = groups.find(g => g.country.iso2 === 'GB')!;
    expect(gb.callouts).toHaveLength(1);
    expect(gb.sourcesFiled).toEqual(['OPENAI']);
    expect(gb.consensusCount).toBe(1);
  });

  it('deduplicates sources within a country group', () => {
    const callouts = [
      makeCallout({ country: { name: 'US', iso2: 'US', latitude: 0, longitude: 0 }, source: 'GOOGLE_GEMINI' }),
      makeCallout({ country: { name: 'US', iso2: 'US', latitude: 0, longitude: 0 }, source: 'GOOGLE_GEMINI' }),
    ];
    const groups = groupByCountry(callouts);
    const us = groups.find(g => g.country.iso2 === 'US')!;
    expect(us.sourcesFiled).toEqual(['GOOGLE_GEMINI']);
    expect(us.callouts).toHaveLength(2);
  });

  it('returns empty array for no callouts', () => {
    expect(groupByCountry([])).toEqual([]);
  });
});

describe('fullSizeTier', () => {
  function makeGroup(iso2: string, count: number): ConsensusGroup {
    return {
      country: { name: iso2, iso2, latitude: 0, longitude: 0 },
      callouts: [],
      sourcesFiled: Array.from({ length: count }, (_, i) => `SOURCE_${i}`),
      consensusCount: count,
    };
  }

  it('keeps only groups with consensusCount >= 2', () => {
    const groups = [makeGroup('US', 1), makeGroup('GB', 2), makeGroup('DE', 3)];
    const result = fullSizeTier(groups);
    expect(result).toHaveLength(2);
    expect(result.map(g => g.country.iso2)).toEqual(['DE', 'GB']);
  });

  it('sorts by consensusCount descending, ties by iso2 ascending', () => {
    const groups = [makeGroup('US', 3), makeGroup('GB', 2), makeGroup('DE', 2)];
    const result = fullSizeTier(groups);
    expect(result.map(g => g.country.iso2)).toEqual(['US', 'DE', 'GB']);
  });

  it('caps at 4 by default', () => {
    const groups = Array.from({ length: 6 }, (_, i) =>
      makeGroup(String.fromCharCode(65 + i), 2)
    );
    const result = fullSizeTier(groups);
    expect(result).toHaveLength(4);
  });

  it('respects custom cap parameter', () => {
    const groups = Array.from({ length: 6 }, (_, i) =>
      makeGroup(String.fromCharCode(65 + i), 2)
    );
    const result = fullSizeTier(groups, 3);
    expect(result).toHaveLength(3);
  });

  it('returns empty array when no groups qualify', () => {
    const groups = [makeGroup('US', 1), makeGroup('GB', 1)];
    expect(fullSizeTier(groups)).toEqual([]);
  });
});

describe('live 2026-06-05 all-sources fixture (regression guard)', () => {
  const callouts = live20260605.callouts as StoryCallout[];

  it('reduces 12 all-sources callouts to the 2 by-country consensus groups', () => {
    // Grouping is by country (D02), so the cross-source "Hezbollah" event filed
    // under different countries does NOT cluster — only Israel (Gemini+NYT) and
    // Kuwait (OpenAI+Perplexity) reach 2+ sources in the same country.
    const tier = fullSizeTier(groupByCountry(callouts), 4);
    // Both have count 2, so the iso2 tie-break orders Israel before Kuwait.
    expect(tier.map(g => g.country.iso2)).toEqual(['IL', 'KW']);
    expect(tier.every(g => g.consensusCount === 2)).toBe(true);
  });

  it('picks the Gemini-first display callout for the Israel group', () => {
    const israel = groupByCountry(callouts).find(g => g.country.iso2 === 'IL')!;
    expect(pickDisplayCallout(israel).source).toBe('GOOGLE_GEMINI');
  });
});

describe('pickDisplayCallout', () => {
  it('picks the first callout matching source order (Gemini first)', () => {
    const group: ConsensusGroup = {
      country: { name: 'US', iso2: 'US', latitude: 0, longitude: 0 },
      callouts: [
        makeCallout({ headline: 'From Perplexity', source: 'PERPLEXITY' }),
        makeCallout({ headline: 'From Gemini', source: 'GOOGLE_GEMINI' }),
      ],
      sourcesFiled: ['PERPLEXITY', 'GOOGLE_GEMINI'],
      consensusCount: 2,
    };
    const result = pickDisplayCallout(group);
    expect(result.headline).toBe('From Gemini');
  });

  it('falls through source order and picks first available callout', () => {
    const group: ConsensusGroup = {
      country: { name: 'US', iso2: 'US', latitude: 0, longitude: 0 },
      callouts: [
        makeCallout({ headline: 'From NYT', source: 'NEW_YORK_TIMES' }),
      ],
      sourcesFiled: ['NEW_YORK_TIMES'],
      consensusCount: 1,
    };
    const result = pickDisplayCallout(group);
    expect(result.headline).toBe('From NYT');
  });
});
