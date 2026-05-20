// @author Claude Sonnet 4.6 Anthropic
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import MobileCoverageList from './MobileCoverageList';
import statsFixture from './__tests__/a11y/fixtures/stats-all-callouts.json';
import type { CalloutStat } from './types/news';

const stats = statsFixture as CalloutStat[];

describe('MobileCoverageList accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <MobileCoverageList
        stats={stats}
        source="GOOGLE_GEMINI"
        onCountryClick={() => {}}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
