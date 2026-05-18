import React from 'react';
import { CalloutStat } from './types/news';
import { getCountryFlag } from './utils/countryUtils';
import { track } from './utils/analytics';

interface MobileCoverageListProps {
  stats: CalloutStat[];
  source: string;
  onCountryClick: (iso2: string, name: string, count: number) => void;
}

const TOP_N = 20;

const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });

function getCountryName(iso2: string): string {
  try {
    return displayNames.of(iso2.toUpperCase()) ?? iso2;
  } catch {
    return iso2;
  }
}

// @author Claude Sonnet 4.6 Anthropic
function MobileCoverageList({ stats, source, onCountryClick }: MobileCoverageListProps): React.ReactElement | null {
  const sourceStats = stats
    .filter(s => s.source === source)
    .sort((a, b) => b.count - a.count);

  const topStats = sourceStats.slice(0, TOP_N);
  const remaining = sourceStats.length - TOP_N;

  if (topStats.length === 0) return null;

  return (
    <div className="mobile-coverage-list">
      <div className="mobile-coverage-list-header">
        {remaining > 0 ? `Top ${TOP_N} countries by coverage` : `All ${topStats.length} ${topStats.length === 1 ? 'country' : 'countries'} by coverage`}
      </div>
      {topStats.map((s) => {
        const name = getCountryName(s.countryCode);
        return (
          <button
            key={s.countryCode}
            className="mobile-coverage-item"
            onClick={() => {
              onCountryClick(s.countryCode, name, s.count);
              track('coverage_list_item_clicked', { country: name, count: s.count });
            }}
          >
            <span className="mobile-coverage-flag" aria-hidden="true">{getCountryFlag(s.countryCode)}</span>
            <span className="mobile-coverage-name">{name}</span>
            <span className="mobile-coverage-count">{s.count}</span>
          </button>
        );
      })}
      {remaining > 0 && (
        <div className="mobile-coverage-list-footer">+ {remaining} more {remaining === 1 ? 'country' : 'countries'}</div>
      )}
    </div>
  );
}

export default MobileCoverageList;
