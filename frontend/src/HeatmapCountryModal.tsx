import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { SpringPage, SourceCallout } from './types/news';
import { track } from './utils/analytics';

// @author Claude Sonnet 4.6 Anthropic
const pageCache = new Map<string, SpringPage<SourceCallout>>();

interface HeatmapCountryModalProps {
  source: string;
  iso2: string;
  countryName: string;
  totalCount: number;
  onClose: () => void;
}

function isoToFlag(iso2: string): string {
  return [...iso2.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
}

function formatSource(source: string): string {
  const map: Record<string, string> = {
    GOOGLE_GEMINI: 'Gemini',
    PERPLEXITY: 'Perplexity',
    OPENAI: 'ChatGPT',
    NEW_YORK_TIMES: 'NYT',
  };
  return map[source] ?? source;
}

function formatGeneratedAt(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// @author Claude Sonnet 4.6 Anthropic
const HeatmapCountryModal = ({ source, iso2, countryName, totalCount, onClose }: HeatmapCountryModalProps): React.ReactElement => {
  const pageSize = useMemo(() => {
    const isMobile = window.innerWidth <= 767;
    if (isMobile) {
      // Modal is 82svh on mobile; use tighter overhead and actual row height
      return Math.max(5, Math.floor((window.innerHeight * 0.82 - 120) / 41));
    }
    return Math.max(5, Math.floor((Math.min(window.innerHeight * 0.88, 640) - 160) / 52));
  }, []);

  const [page, setPage] = useState(0);
  const [error, setError] = useState(false);
  const [retryCounter, setRetryCounter] = useState(0);
  const cacheKey = `${source}:${iso2}:${page}:${pageSize}`;
  const cachedData = pageCache.get(cacheKey) ?? null;
  // Key the fetch result so stale data self-invalidates when cacheKey changes (no effect reset needed)
  const [fetchResult, setFetchResult] = useState<{ key: string; data: SpringPage<SourceCallout> } | null>(null);
  const fetchedData = fetchResult?.key === cacheKey ? fetchResult.data : null;
  const data = cachedData ?? fetchedData ?? null;
  // Derived: true whenever the current page has no data yet
  const loading = data === null;
  // Derived from the page-0 cache entry — stable once page 0 is loaded, no state/refs needed
  const page0Data = pageCache.get(`${source}:${iso2}:0:${pageSize}`) ?? null;
  const lockedBodyHeight = page0Data && page0Data.totalPages > 1 ? page0Data.content.length * 41 : null;
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Trap focus on mount, restore on unmount
  useEffect(() => {
    track('heatmap_country_clicked', { iso2, source });
    previousFocusRef.current = document.activeElement as HTMLElement;
    firstFocusRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowLeft') setPage(p => { const next = Math.max(0, p - 1); if (next !== p) track('heatmap_modal_paged', { method: 'keyboard', page: next }); return next; });
      if (e.key === 'ArrowRight') setPage(p => { const next = p + 1; track('heatmap_modal_paged', { method: 'keyboard', page: next }); return next; });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cachedData) return;
    setError(false);
    fetch(`/api/news/calloutsForSourceAndCountry?source=${encodeURIComponent(source)}&countryCode=${encodeURIComponent(iso2)}&page=${page}&size=${pageSize}`)
      .then(r => r.json())
      .then((result: SpringPage<SourceCallout>) => {
        pageCache.set(cacheKey, result);
        setFetchResult({ key: cacheKey, data: result });
      })
      .catch(err => {
        console.error('Failed to fetch country stories', err);
        setError(true);
      });
  }, [cacheKey, retryCounter]); // eslint-disable-line react-hooks/exhaustive-deps

  const flag = isoToFlag(iso2);
  const totalPages = data?.totalPages ?? 1;

  const modal = (
    <>
      <div
        className="heatmap-modal-backdrop story-detail-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="heatmap-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={`Stories for ${countryName}`}
      >
        <div className="heatmap-modal-header">
          <div className="heatmap-modal-title">
            {flag && <span className="heatmap-modal-flag">{flag}</span>}
            <span className="heatmap-modal-country">{countryName}</span>
            <span className="heatmap-modal-sep">·</span>
            <span className="heatmap-modal-source">{formatSource(source)}</span>
            <span className="heatmap-modal-sep">·</span>
            <span className="heatmap-modal-count">{totalCount} {totalCount === 1 ? 'story' : 'stories'}</span>
          </div>
          <button
            ref={firstFocusRef}
            className="heatmap-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="heatmap-modal-body" style={lockedBodyHeight !== null ? { minHeight: `${lockedBodyHeight}px` } : undefined}>
          {error && (
            <div className="heatmap-modal-error" role="alert">
              <span className="heatmap-modal-error-text">Failed to load stories</span>
              <button
                className="heatmap-modal-retry-btn"
                onClick={() => {
                  setError(false);
                  setRetryCounter(c => c + 1);
                  track('heatmap_modal_retry', { source, iso2 });
                }}
              >
                Retry
              </button>
            </div>
          )}
          {!error && loading && <div className="heatmap-modal-loading">Loading…</div>}
          {!error && !loading && data && data.content.length === 0 && (
            <div className="heatmap-modal-empty">No stories found.</div>
          )}
          {!error && !loading && data && data.content.map((story, i) => (
            <div key={i} className="heatmap-modal-row">
              <span className="heatmap-modal-date">{formatGeneratedAt(story.generatedAt)}</span>
              <span className="heatmap-modal-headline">{story.headline}</span>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="heatmap-modal-pagination">
            <button
              className="heatmap-modal-page-btn"
              onClick={() => { const next = page - 1; setPage(next); track('heatmap_modal_paged', { method: 'button', page: next }); }}
              disabled={page === 0}
              aria-label="Previous page"
            >
              ← Prev
            </button>
            <span className="heatmap-modal-page-info">Page {page + 1} of {totalPages}</span>
            <button
              className="heatmap-modal-page-btn"
              onClick={() => { const next = page + 1; setPage(next); track('heatmap_modal_paged', { method: 'button', page: next }); }}
              disabled={page >= totalPages - 1}
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default HeatmapCountryModal;
