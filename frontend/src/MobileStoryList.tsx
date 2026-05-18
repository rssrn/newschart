import React, { useState } from 'react';
import { StoryCallout } from './types/news';
import { StoryDetailModal } from './StoryCalloutList';
import { getCountryFlag } from './utils/countryUtils';
import { track } from './utils/analytics';

interface MobileStoryListProps {
  callouts: StoryCallout[];
  isHistorical?: boolean;
}

// @author Claude Sonnet 4.6 Anthropic
function MobileStoryList({ callouts, isHistorical = false }: MobileStoryListProps): React.ReactElement | null {
  const [selected, setSelected] = useState<StoryCallout | null>(null);

  if (callouts.length === 0) return null;

  return (
    <div className="mobile-story-list">
      {callouts.map((c) => (
        <button
          key={c.headline}
          className="mobile-story-item"
          onClick={() => {
            setSelected(c);
            track('story_list_item_clicked', { country: c.country.name, headline: c.headline });
          }}
        >
          <span className="mobile-story-flag" aria-hidden="true">{getCountryFlag(c.country.iso2)}</span>
          <div className="mobile-story-text">
            <span className="mobile-story-country">{c.country.name}</span>
            <span className="mobile-story-headline">{c.headline}</span>
          </div>
          <svg className="mobile-story-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      ))}
      {selected && (
        <StoryDetailModal
          callout={selected}
          onClose={() => setSelected(null)}
          isHistorical={isHistorical}
        />
      )}
    </div>
  );
}

export default MobileStoryList;
