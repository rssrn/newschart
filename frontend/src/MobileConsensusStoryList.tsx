// @author Claude Sonnet 4.6 Anthropic
import React, { useState } from 'react';
import { StoryCallout } from './types/news';
import { ConsensusGroup, resolveDisplay } from './utils/consensus';
import { SOURCE_ORDER, CalloutSource } from './utils/sources';
import { SourceBadgeHtml } from './components/SourceBadge';
import { EventInspectorModal } from './components/EventInspectorModal';
import { StoryDetailModal } from './StoryCalloutList';
import { getCountryFlag } from './utils/countryUtils';
import { track } from './utils/analytics';

interface MobileConsensusStoryListProps {
  groups: ConsensusGroup[];
  allCallouts: StoryCallout[];
  presentSources: CalloutSource[];
  highlightSource?: CalloutSource | null;
  isHistorical?: boolean;
  date: string;
}

function MobileConsensusStoryList({
  groups,
  allCallouts,
  presentSources,
  highlightSource = null,
  isHistorical = false,
  date,
}: MobileConsensusStoryListProps): React.ReactElement | null {
  const [inspectorGroup, setInspectorGroup] = useState<ConsensusGroup | null>(null);
  const [directDetail, setDirectDetail] = useState<StoryCallout | null>(null);

  if (groups.length === 0) return null;

  function handleRowClick(group: ConsensusGroup) {
    if (group.consensusCount === 1) {
      setDirectDetail(resolveDisplay(group, highlightSource).callout);
      track('consensus_list_chip_clicked', { country: group.country.name });
    } else {
      setInspectorGroup(group);
      track('consensus_list_item_clicked', { country: group.country.name, sources: group.consensusCount });
    }
  }

  return (
    <div className="mobile-consensus-story-list">
      {groups.map((group) => {
        const { callout: displayCallout, highlightFiled } = resolveDisplay(group, highlightSource);
        const dimmed = highlightSource !== null && !highlightFiled;
        const flag = getCountryFlag(group.country.iso2);
        return (
          <button
            key={group.country.iso2}
            className={`mobile-story-item${dimmed ? ' mobile-story-item--dimmed' : ''}`}
            onClick={() => handleRowClick(group)}
            aria-label={`${group.country.name}: ${displayCallout.headline}. Reported by ${group.consensusCount} of ${presentSources.length} sources`}
          >
            <span className="mobile-story-flag" aria-hidden="true">{flag}</span>
            <div className="mobile-story-text">
              <div className="mobile-consensus-country-row">
                <span className="mobile-story-country">{group.country.name}</span>
                <div className="consensus-badge-row mobile-consensus-badges" role="group" aria-hidden="true">
                  {(group.consensusCount === 1
                    ? SOURCE_ORDER.filter(src => group.sourcesFiled.includes(src))
                    : SOURCE_ORDER.filter(src => presentSources.includes(src))
                  ).map(src => (
                    <SourceBadgeHtml
                      key={src}
                      source={src}
                      filled={group.sourcesFiled.includes(src)}
                      size={12}
                    />
                  ))}
                </div>
              </div>
              <span className="mobile-story-headline">{displayCallout.headline}</span>
            </div>
            <svg className="mobile-story-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        );
      })}
      {inspectorGroup && (
        <EventInspectorModal
          group={inspectorGroup}
          allCallouts={allCallouts}
          presentSources={presentSources}
          isHistorical={isHistorical}
          trigger="callout_box"
          date={date}
          onClose={() => setInspectorGroup(null)}
        />
      )}
      {directDetail && (
        <StoryDetailModal
          callout={directDetail}
          isHistorical={isHistorical}
          onClose={() => setDirectDetail(null)}
        />
      )}
    </div>
  );
}

export default MobileConsensusStoryList;
