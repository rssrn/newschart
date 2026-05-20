// @author Claude Sonnet 4.6 Anthropic
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { StoryDetailModal } from './StoryCalloutList';
import type { StoryCallout } from './types/news';

const callout: StoryCallout = {
  headline: 'Middle East Tensions Rise Amid Iran Nuclear Talks',
  detail: 'US-Iran nuclear talks progress while military activity in the region increases.',
  extendedDetail: 'Extended detail about the story goes here.',
  country: { iso2: 'IR', isoNumeric: '364', latitude: 32.4279, longitude: 53.688, name: 'Iran' },
  source: 'GOOGLE_GEMINI',
  generatedAt: '2026-05-19T06:05:33.649Z',
  type: 'NEWS',
};

describe('StoryDetailModal accessibility', () => {
  it('has no axe violations when open', async () => {
    render(<StoryDetailModal callout={callout} onClose={() => {}} />);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('has no axe violations in historical mode', async () => {
    render(<StoryDetailModal callout={callout} onClose={() => {}} isHistorical />);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
