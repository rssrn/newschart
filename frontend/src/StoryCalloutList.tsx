import React, { useState, useEffect, useMemo, useCallback } from "react";
import ReactDOM from "react-dom";
import { Annotation } from "react-simple-maps";
import { calculateOffsets } from "./utils/mapCalloutUtils";
import { StoryCallout, PositionedCallout, ViewportSize, MapProjection } from "./types/news";

interface StoryCalloutListProps {
  readonly projection: MapProjection;
  readonly callouts: StoryCallout[];
  readonly bottomReservedPx?: number;
  readonly isHistorical?: boolean;
}

function getShowBoundingBox(): boolean {
  const params = new URLSearchParams(window.location.search); // NOSONAR
  return params.get('showBoundingBox') === 'true';
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
interface StoryDetailModalProps {
  callout: StoryCallout;
  onClose: () => void;
  isHistorical?: boolean;
}

// @author Claude Sonnet 4.6 Anthropic
// @author Claude Opus 4.6 Anthropic
function StoryDetailModal({ callout, onClose, isHistorical = false }: StoryDetailModalProps): React.ReactElement {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
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
      <article className={`story-detail-card${isHistorical ? ' story-detail-card--historical' : ''}`} onClick={e => e.stopPropagation()}>
        <header className="story-detail-header">
          <div className="story-detail-location">
            <span className="story-detail-flag">{flag}</span>
            <span className="story-detail-country">{callout.country.name}</span>
            {headerMeta && <span className="story-detail-header-meta">· {headerMeta}</span>}
          </div>
          <button className="story-detail-close" onClick={onClose} aria-label="Close">
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

function StoryCalloutList({ projection, callouts, bottomReservedPx = 0, isHistorical = false }: StoryCalloutListProps): React.ReactElement {

const [viewportSize, setViewportSize] = useState<ViewportSize>({ w: window.innerWidth, h: window.innerHeight });
const showBoundingBox = getShowBoundingBox();
// @author Claude Sonnet 4.6 Anthropic
const [selectedCallout, setSelectedCallout] = useState<StoryCallout | null>(null);

// @author Claude Sonnet 4.6 Anthropic
const handleMoreDetails = useCallback((callout: StoryCallout) => {
  setSelectedCallout(callout);
}, []);

// @author Claude Sonnet 4.6 Anthropic
const handleCloseModal = useCallback(() => {
  setSelectedCallout(null);
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

// Compute bounding box coordinates for debug overlay
// Shows the full area where any part of a box can appear
const boundingBox = useMemo(() => {
  if (!showBoundingBox) return null;
  const EDGE_PADDING = 40;

  const x = EDGE_PADDING;
  const y = EDGE_PADDING;
  const w = SVG_WIDTH - EDGE_PADDING * 2;
  const h = visibleSvgHeight - EDGE_PADDING * 2;
  return { x, y, w, h };
}, [showBoundingBox, visibleSvgHeight]);

  const processedCallouts: PositionedCallout[] = useMemo(() => {
    // Only run if we have data AND the map context/projection is ready
    if (callouts.length === 0 || !projection) return [];

    const bottomPaddingSvg = bottomReservedPx * (SVG_WIDTH / viewportSize.w);
    return calculateOffsets(callouts, projection, visibleSvgHeight, bottomPaddingSvg);
  }, [callouts, projection, visibleSvgHeight, bottomReservedPx, viewportSize.w]);

  return (
  <>
  {boundingBox && (
    <rect
      x={boundingBox.x} y={boundingBox.y}
      width={boundingBox.w} height={boundingBox.h}
      fill="none" stroke="red" strokeWidth={1} strokeDasharray="6 3"
      style={{ pointerEvents: "none" }}
    />
  )}
  {processedCallouts.map((callout) => (
        <Annotation
          key={`${callout.country.name}-${callout.headline}`}
          subject={[callout.country.longitude, callout.country.latitude]}
          dx={callout.dx}
          dy={callout.dy}
          connectorProps={{
            stroke: isHistorical ? "#b45309" : "#2563EB",
            strokeWidth: 1.5,
            strokeLinecap: "round",
          }}
          style={{ pointerEvents: "none" }}
        >
          <foreignObject
          x={-67.5}
          y={-50}
          width="135"
          height="100"
          style={{ overflow: 'visible', pointerEvents: 'all' }}>

            <div className={`map-annotation-box${isHistorical ? ' map-annotation-box--historical' : ''}`}>
              <div className="map-annotation-header map-annotation-header--clickable" onClick={() => handleMoreDetails(callout)}>
                <div className="map-annotation-location">
                  <span className="location-flag">{getCountryFlag(callout.country.iso2)}</span>
                  <span>{callout.country.name}</span>
                </div>
                <svg className="map-annotation-expand" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 3 21 3 21 9"/>
                  <polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/>
                  <line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              </div>
              <h4 className="map-annotation-title">{callout.headline}</h4>
              <p className="map-annotation-text">{callout.detail}</p>
            </div>
          </foreignObject>
        </Annotation>
  ))}
  {selectedCallout && (
    <StoryDetailModal callout={selectedCallout} onClose={handleCloseModal} isHistorical={isHistorical} />
  )}
  </>
  );

}

function getCountryFlag(countryCode: string | undefined): string {
  if (countryCode?.length === 2) {
    // Convert country code to flag emoji using regional indicator symbols
    // Each letter maps to a regional indicator symbol (🇦 = U+1F1E6, 🇧 = U+1F1E7, etc.)
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.codePointAt(0)!); // 127397 = 0x1F1E6 - 65

    return String.fromCodePoint(...codePoints);
  }

  return '🌍'; // Default globe emoji for unknown/international
}

export default StoryCalloutList;
