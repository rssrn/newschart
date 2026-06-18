import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { calculateOffsets, calculateOffsetsWithDiagnostics } from "./utils/mapCalloutUtils";
import { StoryCallout, PositionedCallout, ViewportSize, MapProjection } from "./types/news";
import { ConsensusRenderCallout } from "./utils/consensus";
import { track } from './utils/analytics';

interface StoryCalloutListProps {
  readonly projection: MapProjection;
  readonly callouts: StoryCallout[];
  readonly obstacleCallouts?: StoryCallout[];
  readonly bottomReservedPx?: number;
  readonly isHistorical?: boolean;
  readonly consensus?: boolean;
  readonly precomputedOffsets?: PositionedCallout[];
  readonly highlightSource?: CalloutSource | null;
  readonly presentSources?: CalloutSource[];
  readonly onConsensusBoxClick?: (callout: StoryCallout) => void;
}

function getShowBoundingBox(): boolean {
  const params = new URLSearchParams(window.location.search); // NOSONAR
  return params.get('showBoundingBox') === 'true';
}

function getLayoutDiagnostics(): boolean {
  const params = new URLSearchParams(window.location.search); // NOSONAR
  return params.get('layoutDiagnostics') === 'true';
}

// @author Claude Sonnet 4.6 Anthropic
function formatDateTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });
  } catch {
    return isoString;
  }
}

// @author Claude Sonnet 4.6 Anthropic
function formatDatelinePart(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    }).toUpperCase();
  } catch {
    return isoString;
  }
}

// @author Claude Sonnet 4.6 Anthropic
export interface StoryDetailModalProps {
  callout: StoryCallout;
  onClose: () => void;
  isHistorical?: boolean;
}

// @author Claude Sonnet 4.6 Anthropic
export function StoryDetailModal({ callout, onClose, isHistorical = false }: StoryDetailModalProps): React.ReactElement {
  const cardRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { closeButtonRef.current?.focus(); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
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
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const flag = getCountryFlag(callout.country.iso2);
  const sourceLabel = callout.source?.replace(/_/g, ' ');

  const headerMeta = [
    sourceLabel,
    callout.generatedAt ? formatDatelinePart(callout.generatedAt) : null,
  ].filter(Boolean).join(' · ');

  return ReactDOM.createPortal(
    <div
      className="story-detail-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={callout.headline}
    >
      <article ref={cardRef} className={`story-detail-card${isHistorical ? ' story-detail-card--historical' : ''}`} onClick={e => e.stopPropagation()}>
        <header className="story-detail-header">
          <div className="story-detail-location">
            <span className="story-detail-flag">{flag}</span>
            <span className="story-detail-country">{callout.country.name}</span>
            {headerMeta && <span className="story-detail-header-meta">· {headerMeta}</span>}
          </div>
          <button ref={closeButtonRef} className="story-detail-close" onClick={onClose} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>

        <div className="story-detail-body">
          <h2 className="story-detail-headline">{callout.headline}</h2>
          <p className="story-detail-lead">{callout.detail}</p>
          {callout.extendedDetail && (<>
            <hr className="story-detail-extended-divider" />
            <p className="story-detail-extended">{callout.extendedDetail}</p>
          </>)}
        </div>

        <footer className="story-detail-meta">
          <div className="story-detail-meta-grid">
            {callout.type && (
              <div className="story-detail-meta-item">
                <span className="story-detail-meta-label">Type</span>
                <span className="story-detail-meta-value">{callout.type}</span>
              </div>
            )}
            {callout.generatedAt && (
              <div className="story-detail-meta-item story-detail-meta-item--wide">
                <span className="story-detail-meta-label">Fetched</span>
                <span className="story-detail-meta-value">{formatDateTime(callout.generatedAt)}</span>
              </div>
            )}
          </div>
        </footer>
      </article>
    </div>,
    document.body
  );
}

function StoryCalloutList({ projection, callouts, obstacleCallouts = [], bottomReservedPx = 0, isHistorical = false, consensus = false, precomputedOffsets, highlightSource = null, presentSources, onConsensusBoxClick }: StoryCalloutListProps): React.ReactElement {

const [viewportSize, setViewportSize] = useState<ViewportSize>({ w: window.innerWidth, h: window.innerHeight });
const showBoundingBox = getShowBoundingBox();
const layoutDiagnostics = getLayoutDiagnostics();
// @author Claude Sonnet 4.6 Anthropic
const [selectedCallout, setSelectedCallout] = useState<StoryCallout | null>(null);
const modalTriggerRef = useRef<HTMLElement | null>(null);

// @author Claude Sonnet 4.6 Anthropic
const handleMoreDetails = useCallback((callout: StoryCallout) => {
  modalTriggerRef.current = document.activeElement as HTMLElement;
  setSelectedCallout(callout);
  track('callout_clicked', { country: callout.country.name, headline: callout.headline });
}, []);

// @author Claude Sonnet 4.6 Anthropic
const handleCloseModal = useCallback(() => {
  setSelectedCallout(null);
  setTimeout(() => modalTriggerRef.current?.focus(), 0);
  track('story_modal_closed');
}, []);

// Track viewport size for visible SVG height calculation
useEffect(() => {
  const handleResize = () => setViewportSize({ w: window.innerWidth, h: window.innerHeight });
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// SVG viewBox is 800×600, rendered at full width. Visible height in SVG coords:
const SVG_WIDTH = 800;
const visibleSvgHeight = Math.min(600, SVG_WIDTH * (viewportSize.h / viewportSize.w));

// Compute bounding box coordinates for debug overlay.
// Must mirror the exact constants used in mapCalloutUtils.ts.
const boundingBox = useMemo(() => {
  if (!showBoundingBox) return null;
  const EDGE_PADDING = 40;
  const TOP_PADDING = 20;
  const BOX_WIDTH = 135;
  const RENDERED_HEIGHT = 140;
  const bottomPaddingSvg = bottomReservedPx * (SVG_WIDTH / viewportSize.w);

  // Valid zone for box top-left corners
  const tlMinX = EDGE_PADDING;
  const tlMaxX = SVG_WIDTH - BOX_WIDTH - EDGE_PADDING;  // 625
  const tlMaxY = visibleSvgHeight - RENDERED_HEIGHT - bottomPaddingSvg;

  // Full visual extent: where any pixel of a box can appear
  const visualLeft   = tlMinX;
  const visualTop    = TOP_PADDING;
  const visualRight  = tlMaxX + BOX_WIDTH;  // 760
  const visualBottom = tlMaxY + RENDERED_HEIGHT;  // = visibleSvgHeight - bottomPaddingSvg

  return { visualLeft, visualTop, visualRight, visualBottom, tlMaxY };
}, [showBoundingBox, visibleSvgHeight, bottomReservedPx, viewportSize.w]);

  const processedCallouts: PositionedCallout[] = useMemo(() => {
    if (precomputedOffsets) {
      return callouts.map((c, i) => ({
        ...c,
        dx: precomputedOffsets[i]?.dx ?? 0,
        dy: precomputedOffsets[i]?.dy ?? 0,
      }));
    }
    if (callouts.length === 0 || !projection) return [];

    const obstacles = obstacleCallouts
      .map(c => projection([c.country.longitude, c.country.latitude]))
      .filter((pt): pt is [number, number] => pt !== null)
      .map(([x, y]) => ({ x, y }));

    const bottomPaddingSvg = bottomReservedPx * (SVG_WIDTH / viewportSize.w);
    if (layoutDiagnostics) {
      const { positioned, diagnostics } = calculateOffsetsWithDiagnostics(callouts, projection, visibleSvgHeight, bottomPaddingSvg, obstacles);
      console.group('[layoutDiagnostics] Score breakdown');
      diagnostics.nodes.forEach((node, i) => {
        const label = callouts[i]?.country?.name ?? `node ${i}`;
        const total = Object.values(node.scoreContribution).reduce((a, b) => a + b, 0);
        const accepted = node.allCandidates.filter(c => !c.rejectedReason).length;
        const byReason = node.allCandidates.reduce<Record<string, number>>((acc, c) => {
          const key = c.rejectedReason ?? 'accepted';
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {});
        const chosen = node.chosenCandidate;
        const angleDeg = (chosen.angle * 180 / Math.PI).toFixed(1);
        console.group(`${label} — total: ${total.toFixed(1)} | chosen: dist=${chosen.dist} angle=${angleDeg}° | candidates: ${accepted} accepted ${JSON.stringify(byReason)}`);
        console.table(node.scoreContribution);
        console.groupEnd();
      });
      console.log('Best score:', diagnostics.bestScore, '| Combinations evaluated:', diagnostics.combinationsEvaluated);
      console.groupEnd();
      return positioned;
    }
    return calculateOffsets(callouts, projection, visibleSvgHeight, bottomPaddingSvg, obstacles);
  }, [callouts, obstacleCallouts, projection, visibleSvgHeight, bottomReservedPx, viewportSize.w, layoutDiagnostics, precomputedOffsets]);

  return (
  <>
  {boundingBox && (<>
    {/* Outer dashed rectangle: full visual area where any part of a box can appear */}
    <rect
      x={boundingBox.visualLeft} y={boundingBox.visualTop}
      width={boundingBox.visualRight - boundingBox.visualLeft}
      height={boundingBox.visualBottom - boundingBox.visualTop}
      fill="none" stroke="red" strokeWidth={1} strokeDasharray="6 3"
      style={{ pointerEvents: "none" }}
    />
    {/* Horizontal line at boundsMaxY: box top-left corners must stay above this line */}
    <line
      x1={boundingBox.visualLeft} y1={boundingBox.tlMaxY}
      x2={boundingBox.visualRight} y2={boundingBox.tlMaxY}
      stroke="orange" strokeWidth={1} strokeDasharray="3 3"
      style={{ pointerEvents: "none" }}
    />
    <text x={boundingBox.visualLeft + 4} y={boundingBox.tlMaxY - 4}
      fill="orange" fontSize={9} style={{ pointerEvents: "none" }}>
      boundsMaxY (box top-left limit)
    </text>
  </>)}
  {processedCallouts.map((callout) => {
    const origin = projection([callout.country.longitude, callout.country.latitude]);
    if (!origin) return null;
    const [ox, oy] = origin;
    const { dx, dy } = callout;
    // Highlight state is conveyed visually by greying/emphasis; mirror it into the
    // box's accessible name so screen-reader users aren't left with a colour-only signal.
    const { highlightFiled, voiceSource } = callout as ConsensusRenderCallout;
    const baseLabel = `${callout.country.name}: ${callout.headline}`;
    const countSuffix = consensus && callout.consensus
      ? ` Reported by ${callout.consensus.count} of ${presentSources?.length ?? 0} sources`
      : '';
    const consensusAriaLabel = consensus && highlightSource
      ? highlightFiled === false
        ? `${baseLabel}. ${SOURCE_META[highlightSource].shortLabel} did not file here; showing ${voiceSource ? SOURCE_META[voiceSource].shortLabel : 'another source'}'s coverage${countSuffix}`
        : `${baseLabel}. Showing ${SOURCE_META[highlightSource].shortLabel}'s coverage${countSuffix}`
      : baseLabel + countSuffix;
    return (
      <g
        key={`${callout.country.name}-${callout.headline}`}
        transform={`translate(${ox + dx}, ${oy + dy})`}
        style={{ pointerEvents: 'none' }}
      >
        <path
          d={`M0,0 Q${-dx / 2},${-dy / 2} ${-dx},${-dy}`}
          fill="transparent"
          stroke={isHistorical ? '#fbbf24' : '#60a5fa'}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <foreignObject
          x={-67.5}
          y={-70}
          width="135"
          height="140"
          style={{ overflow: 'visible', pointerEvents: 'all' }}>
          {(() => {
            const isHighlightMissed = consensus && highlightFiled === false;
            const boxClassName = [
              'map-annotation-box',
              consensus ? 'map-annotation-box--consensus' : 'map-annotation-box--clickable',
              isHistorical ? 'map-annotation-box--historical' : '',
              isHighlightMissed ? 'map-annotation-box--highlight-missed' : '',
            ].filter(Boolean).join(' ');
            const ariaLabel = consensus
              ? consensusAriaLabel
              : `${callout.country.name}: ${callout.headline}. Press Enter to expand.`;
            const handleClick = consensus
              ? () => onConsensusBoxClick?.(callout)
              : () => handleMoreDetails(callout);
            const handleKeyDown = (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }
            };
            return (
              <div
                className={boxClassName}
                role="button"
                tabIndex={0}
                aria-label={ariaLabel}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
              >
                <div className={`map-annotation-header${consensus ? ' map-annotation-header--consensus' : ''}`}>
                  <div className="map-annotation-location">
                    <span className="location-flag">{getCountryFlag(callout.country.iso2)}</span>
                    <span>{shortenCountryName(callout.country.name)}</span>
                  </div>
                  <span className="map-annotation-expand" aria-hidden="true">+</span>
                </div>
                {consensus && (
                  <div className="consensus-badge-row" role="group" aria-label="Source coverage">
                    {SOURCE_ORDER.filter(s => presentSources?.includes(s)).map(src => (
                      <SourceBadgeHtml
                        key={src}
                        source={src}
                        filled={callout.consensus?.sourcesFiled.includes(src) ?? false}
                        highlight={isHighlightMissed ? null : highlightSource}
                      />
                    ))}
                  </div>
                )}
                <h4 className="map-annotation-title">{callout.headline}</h4>
                <p className="map-annotation-text">{callout.detail}</p>
              </div>
            );
          })()}
        </foreignObject>
      </g>
    );
  })}
  {selectedCallout && (
    <StoryDetailModal callout={selectedCallout} onClose={handleCloseModal} isHistorical={isHistorical} />
  )}
  </>
  );

}

import { getCountryFlag, shortenCountryName } from './utils/countryUtils';
import { SOURCE_ORDER, SOURCE_META, CalloutSource } from './utils/sources';
import { SourceBadgeHtml } from './components/SourceBadge';

export default StoryCalloutList;
