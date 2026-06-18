// @author Claude Sonnet 4.6 Anthropic
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { StoryCallout } from '../types/news';
import { ConsensusGroup } from '../utils/consensus';
import { SOURCE_ORDER, SOURCE_META, CalloutSource } from '../utils/sources';
import { SourceBadgeHtml } from './SourceBadge';
import { StoryDetailModal } from '../StoryCalloutList';
import { track } from '../utils/analytics';
import { getCountryFlag } from '../utils/countryUtils';
import { isToday, formatShortDate } from '../utils/dateUtils';

interface EventInspectorModalProps {
  group: ConsensusGroup;
  allCallouts: StoryCallout[];
  presentSources: CalloutSource[];
  isHistorical?: boolean;
  trigger: 'callout_box' | 'chip';
  date: string;
  onClose: () => void;
}

function omissionCountries(
  source: CalloutSource,
  allCallouts: StoryCallout[],
  currentIso2: string
): string {
  const seen = new Set<string>();
  return allCallouts
    .filter(c => c.source === source && c.country.iso2 !== currentIso2 && !seen.has(c.country.iso2) && (seen.add(c.country.iso2), true))
    .slice(0, 6)
    .map(c => getCountryFlag(c.country.iso2))
    .join(' / ');
}

export function EventInspectorModal({
  group,
  allCallouts,
  presentSources,
  isHistorical = false,
  trigger,
  date,
  onClose,
}: EventInspectorModalProps): React.ReactElement {
  const [detailCallout, setDetailCallout] = useState<StoryCallout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map());
  const detailCalloutRef = useRef(detailCallout);
  useEffect(() => { detailCalloutRef.current = detailCallout; });

  const flag = getCountryFlag(group.country.iso2);
  const dateLabel = isToday(date) ? 'Today' : formatShortDate(date);
  const filteredSources = useMemo(
    () => SOURCE_ORDER.filter(s => presentSources.includes(s)),
    [presentSources]
  );

  useEffect(() => {
    track('inspector_opened', {
      iso2: group.country.iso2,
      source_count: group.consensusCount,
      trigger,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    firstFocusRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (detailCalloutRef.current) return;
        onClose();
        return;
      }
      if (e.key === 'Tab' && cardRef.current) {
        const focusable = Array.from(
          cardRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) { e.preventDefault(); return; }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  const handleRowClick = useCallback((callout: StoryCallout, source: CalloutSource) => {
    track('inspector_source_row_clicked', { iso2: group.country.iso2, source });
    track('callout_clicked', { country: callout.country.name, headline: callout.headline, fromInspector: true });
    setDetailCallout(callout);
  }, [group.country.iso2]);

  const handleCloseDetail = useCallback(() => {
    const sourceKey = detailCalloutRef.current?.source ?? '';
    setDetailCallout(null);
    setTimeout(() => {
      rowRefs.current.get(sourceKey)?.focus();
    }, 0);
  }, []);

  const setRowRef = useCallback((source: string, el: HTMLElement | null) => {
    if (el) rowRefs.current.set(source, el);
    else rowRefs.current.delete(source);
  }, []);

  const backdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const modal = (
    <>
      <div className="inspector-backdrop" onClick={backdropClick} aria-hidden="true" />
      <div
        ref={cardRef}
        className="inspector-card"
        role="dialog"
        aria-modal="true"
        aria-label={group.country.name}
      >
        <div className="inspector-header">
          <div className="inspector-header-title">
            <span className="inspector-flag" aria-hidden="true">{flag}</span>
            <span className="inspector-country">{group.country.name}</span>
          </div>
          <div className="inspector-header-right">
            <span className="inspector-header-date">{dateLabel}</span>
          <button
            ref={firstFocusRef}
            className="inspector-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          </div>
        </div>

        <div className="inspector-body">
          {filteredSources.filter(s => group.callouts.some(c => c.source === s)).map(source => {
            const sourceCallouts = group.callouts.filter(c => c.source === source);
            const meta = SOURCE_META[source];
            return sourceCallouts.map((callout, idx) => (
              <button
                key={`${source}-${idx}`}
                ref={el => setRowRef(source, el)}
                className="inspector-row inspector-row--filed"
                onClick={() => handleRowClick(callout, source)}
                aria-label={`${meta.label}: ${callout.headline}`}
              >
                <span className="inspector-row-badge">
                  <SourceBadgeHtml source={source} filled={true} size={22} className="consensus-badge--lg" />
                </span>
                <div className="inspector-row-content">
                  <span className="inspector-row-source">{meta.label}</span>
                  <span className="inspector-row-headline">{callout.headline}</span>
                </div>
              </button>
            ));
          })}
          {filteredSources.filter(s => !group.callouts.some(c => c.source === s)).map(source => {
            const meta = SOURCE_META[source];
            const flags = omissionCountries(source, allCallouts, group.country.iso2);
            return (
              <div
                key={source}
                className="inspector-row inspector-row--omission"
                aria-label={`${meta.label}: not covered here`}
              >
                <span className="inspector-row-omission-line">
                  {meta.shortLabel}{flags ? ` · Picked ${flags} instead` : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {detailCallout && (
        <StoryDetailModal callout={detailCallout} onClose={handleCloseDetail} isHistorical={isHistorical} />
      )}
    </>
  );

  return ReactDOM.createPortal(modal, document.body);
}
