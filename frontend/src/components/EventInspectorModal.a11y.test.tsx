// @author Claude Sonnet 4.6 Anthropic
import { render, act } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { EventInspectorModal } from './EventInspectorModal';
import type { ConsensusGroup } from '../utils/consensus';
import type { CalloutSource } from '../utils/sources';
import type { StoryCallout } from '../types/news';

const iranCountry = { iso2: 'IR', isoNumeric: '364', latitude: 32.4279, longitude: 53.688, name: 'Iran' };
const ukCountry = { iso2: 'GB', isoNumeric: '826', latitude: 55.3781, longitude: -3.436, name: 'United Kingdom' };
const usCountry = { iso2: 'US', isoNumeric: '840', latitude: 37.0902, longitude: -95.7129, name: 'United States' };

const group: ConsensusGroup = {
  country: iranCountry,
  callouts: [
    {
      headline: 'Iran tensions rise',
      detail: 'Regional tensions escalate amid nuclear talks.',
      country: iranCountry,
      source: 'GOOGLE_GEMINI' as CalloutSource,
    },
    {
      headline: 'Iran nuclear talks progress',
      detail: 'US-Iran negotiations show signs of progress.',
      country: iranCountry,
      source: 'PERPLEXITY' as CalloutSource,
    },
  ],
  sourcesFiled: ['GOOGLE_GEMINI', 'PERPLEXITY'],
  consensusCount: 2,
};

const allCallouts: StoryCallout[] = [
  ...group.callouts,
  {
    headline: 'UK economy faces headwinds',
    detail: 'Brexit impacts continue to affect trade.',
    country: ukCountry,
    source: 'GOOGLE_GEMINI' as CalloutSource,
  },
  {
    headline: 'US tech stocks rally',
    detail: 'Markets reach new highs.',
    country: usCountry,
    source: 'PERPLEXITY' as CalloutSource,
  },
  {
    headline: 'Global climate summit opens',
    detail: 'World leaders gather for climate talks.',
    country: usCountry,
    source: 'OPENAI' as CalloutSource,
  },
];

const presentSources: CalloutSource[] = ['GOOGLE_GEMINI', 'PERPLEXITY', 'OPENAI'];

describe('EventInspectorModal accessibility', () => {
  it('has no axe violations when open with filed and omitted sources', async () => {
    await act(async () => {
      render(
        <EventInspectorModal
          group={group}
          allCallouts={allCallouts}
          presentSources={presentSources}
          date="2026-06-18" trigger="callout_box"
          onClose={() => {}}
        />
      );
    });
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('has no axe violations when open with isHistorical', async () => {
    await act(async () => {
      render(
        <EventInspectorModal
          group={group}
          allCallouts={allCallouts}
          presentSources={presentSources}
          isHistorical={true}
          date="2026-06-05" trigger="chip"
          onClose={() => {}}
        />
      );
    });
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('has no axe violations when all sources filed', async () => {
    const allFiledGroup: ConsensusGroup = {
      country: usCountry,
      callouts: [
        {
          headline: 'US economy grows',
          detail: 'GDP figures beat expectations.',
          country: usCountry,
          source: 'GOOGLE_GEMINI' as CalloutSource,
        },
        {
          headline: 'US job market strong',
          detail: 'Unemployment hits record low.',
          country: usCountry,
          source: 'PERPLEXITY' as CalloutSource,
        },
        {
          headline: 'US inflation cools',
          detail: 'CPI drops to 2.5%.',
          country: usCountry,
          source: 'OPENAI' as CalloutSource,
        },
        {
          headline: 'US trade deal signed',
          detail: 'New agreement boosts exports.',
          country: usCountry,
          source: 'NEW_YORK_TIMES' as CalloutSource,
        },
      ],
      sourcesFiled: ['GOOGLE_GEMINI', 'PERPLEXITY', 'OPENAI', 'NEW_YORK_TIMES'],
      consensusCount: 4,
    };

    await act(async () => {
      render(
        <EventInspectorModal
          group={allFiledGroup}
          allCallouts={allCallouts}
          presentSources={presentSources}
          date="2026-06-18" trigger="callout_box"
          onClose={() => {}}
        />
      );
    });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
