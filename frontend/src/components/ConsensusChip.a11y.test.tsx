// @author Claude Sonnet 4.6 Anthropic
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { ConsensusChip } from './ConsensusChip';
import type { ConsensusGroup } from '../utils/consensus';

const group: ConsensusGroup = {
  country: { iso2: 'IR', isoNumeric: '364', latitude: 32.4279, longitude: 53.688, name: 'Iran' },
  callouts: [
    {
      headline: 'Iran tensions rise',
      detail: 'Regional tensions escalate.',
      country: { iso2: 'IR', isoNumeric: '364', latitude: 32.4279, longitude: 53.688, name: 'Iran' },
      source: 'GOOGLE_GEMINI',
    },
  ],
  sourcesFiled: ['GOOGLE_GEMINI'],
  consensusCount: 1,
};

describe('ConsensusChip accessibility', () => {
  it('has no axe violations when rendered', async () => {
    render(
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
        <ConsensusChip group={group} x={100} y={100} />
      </svg>
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('has no axe violations with onClick handler', async () => {
    render(
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
        <ConsensusChip group={group} x={100} y={100} onClick={() => {}} />
      </svg>
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('has no axe violations in emphasis state (filed by highlighted source)', async () => {
    render(
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
        <ConsensusChip group={group} x={100} y={100} highlight="GOOGLE_GEMINI" />
      </svg>
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('has no axe violations in greyed state (highlighted source omitted)', async () => {
    render(
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
        <ConsensusChip group={group} x={100} y={100} highlight="PERPLEXITY" />
      </svg>
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
