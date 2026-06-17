// @author Claude Sonnet 4.6 Anthropic
import React from 'react';
import { ConsensusGroup, pickDisplayCallout } from '../utils/consensus';
import { SOURCE_META } from '../utils/sources';
import type { CalloutSource } from '../utils/sources';
import { getCountryFlag } from '../utils/countryUtils';
import { SourceBadgeHtml } from './SourceBadge';
import { CHIP_WIDTH, CHIP_HEIGHT } from '../utils/chipLayout';
import { track } from '../utils/analytics';

interface ConsensusChipProps {
  group: ConsensusGroup;
  x: number;
  y: number;
  isHistorical?: boolean;
  onClick?: (group: ConsensusGroup) => void;
}

export function ConsensusChip({ group, x, y, isHistorical = false, onClick }: ConsensusChipProps): React.ReactElement {
  const flag = getCountryFlag(group.country.iso2);
  const sources = group.sourcesFiled as CalloutSource[];
  const headline = pickDisplayCallout(group).headline;
  const sourceNames = sources.map(s => SOURCE_META[s]?.label ?? s).join(', ');
  const ariaLabel = `${group.country.name} — ${sourceNames}`;

  const handleClick = () => {
    onClick?.(group);
    track('consensus_chip_click', { iso2: group.country.iso2, source_count: group.consensusCount });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      <title>{headline}</title>
      <foreignObject x={0} y={0} width={CHIP_WIDTH} height={CHIP_HEIGHT} style={{ overflow: 'visible' }}>
        <div
          className={`consensus-chip-pill${isHistorical ? ' consensus-chip-pill--historical' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          <span className="consensus-chip-flag" aria-hidden="true">{flag}</span>
          <div className="consensus-badge-row consensus-chip-badges" role="group" aria-label="Sources">
            {sources.map(src => (
              <SourceBadgeHtml key={src} source={src} filled={true} />
            ))}
          </div>
        </div>
      </foreignObject>
    </g>
  );
}
