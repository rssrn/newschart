import React, { useState, useEffect, useCallback, useRef, useMemo, useReducer } from 'react';
import './App.css';
import MapChart from './MapChart';
import DateTimeline from './DateTimeline';
import { ProjectionType, FetchStatus, PROJECTION_OPTIONS } from './utils/projectionOptions';
import { todayIso, isToday, formatShortDate, nearestAvailableDate } from './utils/dateUtils';
import { track } from './utils/analytics';
import { CalloutStat, StoryCallout } from './types/news';
import { heatmapLegendGradient } from './utils/heatmapUtils';
import HeatmapCountryModal from './HeatmapCountryModal';
import ContactModal from './ContactModal';
import MobileStoryList from './MobileStoryList';
import MobileCoverageList from './MobileCoverageList';
import { ViewMode, VIEW_MODES, NAV } from './constants';
import { SOURCE_META, SOURCE_ORDER, CalloutSource } from './utils/sources';
import { groupByCountry, fullSizeTier } from './utils/consensus';

// @author Claude Sonnet 4.6 Anthropic
type NewsSource = CalloutSource;

// Module-level cache so stats survive source/projection changes but not page reload
let heatmapStatsCache: CalloutStat[] | null = null;

const NEWS_SOURCES: { value: NewsSource; label: string; shortLabel: string }[] =
  SOURCE_ORDER.map(s => ({ value: s, label: SOURCE_META[s].label, shortLabel: SOURCE_META[s].shortLabel }));

function App(): React.ReactElement {
  const [source, setSource] = useState<NewsSource>(
    () => (localStorage.getItem('newsSource') as NewsSource | null) ?? 'GOOGLE_GEMINI'
  );
  const [projectionType, setProjectionType] = useState<ProjectionType>(
    () => (localStorage.getItem('projectionType') as ProjectionType | null) ?? 'geoNaturalEarth1'
  );
  // @author Claude Sonnet 4.6 Anthropic
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  // @author Claude Sonnet 4.6 Anthropic
  // Consensus is the default on desktop (D24), but the mobile consensus UX is
  // not built yet (CP7), so mobile viewports retain the existing 'day' default.
  // 640px matches the App.css mobile breakpoint that swaps to the mobile layout.
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('viewMode') as ViewMode | null)
      ?? (window.innerWidth <= 640 ? 'day' : 'consensus')
  );
  const [heatmapStats, setHeatmapStats] = useState<CalloutStat[] | null>(
    () => (localStorage.getItem('viewMode') === 'heatmap' && heatmapStatsCache !== null) ? heatmapStatsCache : null
  );
  // @author Claude Sonnet 4.6 Anthropic
  const [highlightSource, setHighlightSource] = useState<CalloutSource | null>(null);
  // @author Claude Sonnet 4.6 Anthropic
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  // @author Claude Sonnet 4.6 Anthropic
  const [fetchStatus, setFetchStatus] = useState<FetchStatus | null>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);
  // @author Claude Sonnet 4.6 Anthropic
  const [heatmapClickedCountry, setHeatmapClickedCountry] = useState<{ iso2: string; name: string; count: number } | null>(null);
  const [heatmapError, setHeatmapError] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [callouts, setCallouts] = useState<StoryCallout[]>([]);
  const [retryKey, incrementRetryKey] = useReducer((n: number) => n + 1, 0);
  const retryCountRef = useRef(0);

  // @author Claude Sonnet 4.6 Anthropic
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
    track('view_mode_changed', { mode });
    if (mode === 'heatmap') {
      if (heatmapStatsCache !== null) {
        setHeatmapStats(heatmapStatsCache);
        setHeatmapError(false);
      } else {
        setHeatmapError(false);
        fetch('/api/news/statsAllCallouts')
          .then(r => r.json())
          .then((data: CalloutStat[]) => {
            heatmapStatsCache = data;
            setHeatmapStats(data);
            setHeatmapError(false);
          })
          .catch(() => setHeatmapError(true));
      }
    }
  };

  // Fetch heatmap stats on mount (or on retry) if viewMode is 'heatmap' and cache is empty
  // @author Claude Sonnet 4.6 Anthropic
  useEffect(() => {
    if (viewMode !== 'heatmap' || heatmapStatsCache !== null) return;
    fetch('/api/news/statsAllCallouts')
      .then(r => r.json())
      .then((data: CalloutStat[]) => {
        heatmapStatsCache = data;
        setHeatmapStats(data);
        setHeatmapError(false);
      })
      .catch(() => setHeatmapError(true));
  // retryKey included so stats reload when the backend recovers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  // @author Claude Sonnet 4.6 Anthropic
  const handleSourceChange = (value: NewsSource) => {
    setSource(value);
    localStorage.setItem('newsSource', value);
    track('source_changed', { source: value });
  };

  const handleHighlightChange = (value: CalloutSource | null) => {
    setHighlightSource(value);
    track('highlight_changed', { source: value ?? 'all' });
  };

  const handleProjectionChange = (value: ProjectionType) => {
    setProjectionType(value);
    localStorage.setItem('projectionType', value);
    track('projection_changed', { projection: value });
  };

  // @author Claude Sonnet 4.6 Anthropic
  const handleFetchStatus = useCallback((status: FetchStatus) => {
    setFetchStatus(status);
    if (status === 'loading') setErrorDismissed(false);
    if (status === 'success') retryCountRef.current = 0;
  }, []);

  // @author Claude Sonnet 4.6 Anthropic
  // Exponential-backoff retry when the backend is unreachable (5s → 10s → 20s → 40s → 60s cap)
  useEffect(() => {
    if (fetchStatus !== 'error') return;
    const delay = Math.min(5000 * Math.pow(2, retryCountRef.current), 60000);
    const timer = setTimeout(() => {
      retryCountRef.current++;
      incrementRetryKey();
    }, delay);
    return () => clearTimeout(timer);
  }, [fetchStatus, retryKey]);

  // @author Claude Sonnet 4.6 Anthropic
  useEffect(() => {
    const controller = new AbortController();
    const url = viewMode === 'consensus'
      ? '/api/news/availableDays'
      : `/api/news/availableDays?source=${source}`;
    fetch(url, { signal: controller.signal })
      .then(r => r.json())
      .then((dates: string[]) => {
        const sorted = [...dates].sort();
        setAvailableDates(sorted);
        setSelectedDate(prev => sorted.includes(prev) ? prev : nearestAvailableDate(prev, sorted));
      })
      .catch(err => { if (err.name !== 'AbortError') console.error('Failed to fetch available dates', err); });
    return () => controller.abort();
  // retryKey included so dates reload when the backend recovers
  }, [source, viewMode, retryKey]);

  const showError = fetchStatus === 'error' && !errorDismissed;
  const isLoading = fetchStatus === 'loading';

  // @author Claude Sonnet 4.6 Anthropic
  const presentSources: CalloutSource[] = useMemo(() =>
    SOURCE_ORDER.filter(src => callouts.some(c => c.source === src)),
  [callouts]);

  // Treat the stored selection as inactive when the source has no data for this day (D25)
  // @author Claude Sonnet 4.6 Anthropic
  const effectiveHighlightSource: CalloutSource | null =
    highlightSource !== null && presentSources.includes(highlightSource) ? highlightSource : null;

  // @author Claude Sonnet 4.6 Anthropic
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (availableDates.length < 2 || isLoading) return;
      if (document.querySelector('.story-detail-backdrop')) return;
      e.preventDefault();
      const idx = availableDates.indexOf(selectedDate);
      const effective = idx >= 0 ? idx : availableDates.length - 1;
      let newDate: string | null = null;
      if (e.key === 'ArrowLeft' && effective > 0) newDate = availableDates[effective - 1];
      if (e.key === 'ArrowRight' && effective < availableDates.length - 1) newDate = availableDates[effective + 1];
      if (newDate) {
        setSelectedDate(newDate);
        track('date_navigated', { method: 'keyboard', date: newDate });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [availableDates, isLoading, selectedDate]);

  // @author Claude Sonnet 4.6 Anthropic
  useEffect(() => {
    if (mobileSheetOpen) {
      document.body.classList.add('sheet-open');
    } else {
      document.body.classList.remove('sheet-open');
    }
    return () => document.body.classList.remove('sheet-open');
  }, [mobileSheetOpen]);

  const mobileSheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // React 18 types don't expose `inert` as a DOM property; set it imperatively
    if (mobileSheetRef.current) (mobileSheetRef.current as HTMLDivElement & { inert: boolean }).inert = !mobileSheetOpen;
  }, [mobileSheetOpen]);

  const sourceShortLabel = NEWS_SOURCES.find(s => s.value === source)?.shortLabel ?? source;

  // @author Claude Sonnet 4.6 Anthropic
  const mobilePillLabel = useMemo(() => {
    if (viewMode === 'consensus') {
      const dateLabel = isToday(selectedDate) ? 'Today' : formatShortDate(selectedDate);
      return `Consensus · ${dateLabel} · ${callouts.length} ${callouts.length === 1 ? 'story' : 'stories'}`;
    }
    if (viewMode === 'heatmap') {
      const stats = heatmapStats ?? [];
      const sourceTotal = stats.filter(s => s.source === source).reduce((sum, s) => sum + s.count, 0);
      if (sourceTotal > 0 && availableDates.length > 0) {
        const first = availableDates[0];
        const last = availableDates[availableDates.length - 1];
        const range = first === last ? formatShortDate(first) : `${formatShortDate(first)} – ${formatShortDate(last)}`;
        return `${sourceShortLabel} · ${sourceTotal} stories · ${range}`;
      }
      return `${sourceShortLabel} · Coverage Map`;
    }
    const dateLabel = isToday(selectedDate) ? 'Today' : formatShortDate(selectedDate);
    if (callouts.length > 0) {
      return `${sourceShortLabel} · ${dateLabel} · ${callouts.length} ${callouts.length === 1 ? 'story' : 'stories'}`;
    }
    return `${sourceShortLabel} · ${dateLabel}`;
  }, [viewMode, heatmapStats, source, sourceShortLabel, availableDates, selectedDate, callouts]);


  // @author Claude Sonnet 4.6 Anthropic
  // @author Claude Sonnet 4.6 Anthropic
  const heatmapLegend = viewMode === 'heatmap' && availableDates.length > 0 ? (() => {
    const stats = heatmapStats ?? [];
    const globalMax = Math.max(...stats.map(s => s.count), 1);
    const sourceStats = stats.filter(s => s.source === source);
    const sourceMax = sourceStats.reduce((m, s) => Math.max(m, s.count), 0);
    const sourceTotalCount = sourceStats.reduce((sum, s) => sum + s.count, 0);
    const gradient = sourceMax > 0 ? heatmapLegendGradient(sourceMax, globalMax) : null;
    const fmt = (iso: string) => {
      const [y, m, d] = iso.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    const first = availableDates[0];
    const last = availableDates[availableDates.length - 1];
    const dateRange = first === last ? fmt(first) : `${formatShortDate(first)} – ${fmt(last)}`;
    return { sourceMax, globalMax, gradient, dateRange, sourceTotalCount };
  })() : null;

  return (
    <div className="App">

      {/* Mobile-only brand banner – sits above the map canvas */}
      <div className="mobile-brand-banner">
        <img src="/logo48.webp" className="brand-badge-icon" alt="" aria-hidden="true" />
        <div className="brand-badge-label">
          <span className="brand-badge-text">NewsChart</span>
          <span className="brand-badge-date">{isToday(selectedDate) ? 'Today' : formatShortDate(selectedDate)}</span>
        </div>
        <span className="brand-strapline">World news. AI sources.</span>
        <button
          className="mobile-banner-hamburger"
          onClick={() => setMobileSheetOpen(true)}
          aria-label="Open map settings"
          aria-expanded={mobileSheetOpen}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      <main className="map-container">

        {/* Brand badge – top-left, desktop only */}
        <div className="brand-badge" aria-label="NewsChart">
          <img src="/logo48.webp" className="brand-badge-icon" alt="" aria-hidden="true" />
          <div className="brand-badge-label">
            <span className="brand-badge-text">NewsChart</span>
            <span className="brand-badge-date">{isToday(selectedDate) ? 'Today' : formatShortDate(selectedDate)}</span>
          </div>
          <span className="brand-strapline">World news. AI sources.</span>
        </div>

        {/* Desktop controls overlay */}
        <div className={`source-selector-overlay${isLoading ? ' controls-loading' : ''}`}>
          <div className="selector-group">
            <span className="selector-group-title">View</span>
            {VIEW_MODES.map(({ value, label }) => (
              <label key={value} className="source-radio-label">
                <input
                  type="radio"
                  name="view-mode"
                  value={value}
                  checked={viewMode === value}
                  onChange={() => handleViewModeChange(value)}
                />
                {label}
              </label>
            ))}
          </div>
          {viewMode !== 'consensus' && (
          <div className="selector-group">
            <span className="selector-group-title">Source</span>
            {NEWS_SOURCES.map(({ value, label }) => (
              <label key={value} className="source-radio-label">
                <input
                  type="radio"
                  name="news-source"
                  value={value}
                  checked={source === value}
                  onChange={() => handleSourceChange(value)}
                  disabled={isLoading}
                />
                {label}
              </label>
            ))}
          </div>
          )}
          {viewMode === 'consensus' && (
          <div className="selector-group">
            <span className="selector-group-title">Highlight</span>
            <label className="source-radio-label">
              <input
                type="radio"
                name="highlight-source"
                value=""
                checked={effectiveHighlightSource === null}
                onChange={() => handleHighlightChange(null)}
              />
              All Sources
            </label>
            {NEWS_SOURCES.map(({ value, label }) => {
              const notPresent = !presentSources.includes(value);
              const dateLabel = isToday(selectedDate) ? 'today' : formatShortDate(selectedDate);
              return (
                <label key={value} className="source-radio-label" title={notPresent ? `${label} not collected on ${dateLabel}` : undefined}>
                  <input
                    type="radio"
                    name="highlight-source"
                    value={value}
                    checked={effectiveHighlightSource === value}
                    onChange={() => handleHighlightChange(value)}
                    disabled={notPresent}
                  />
                  {label}
                </label>
              );
            })}
          </div>
          )}
          <div className="selector-group">
            <span className="selector-group-title">Map</span>
            {PROJECTION_OPTIONS.map(({ value, label }) => (
              <label key={value} className="source-radio-label">
                <input
                  type="radio"
                  name="projection"
                  value={value}
                  checked={projectionType === value}
                  onChange={() => handleProjectionChange(value)}
                  disabled={isLoading}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Error toast – @author Claude Sonnet 4.6 Anthropic */}
        <div className={`fetch-error-toast${showError ? ' visible' : ''}`} role="alert" aria-live="assertive">
          <svg className="fetch-error-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span className="fetch-error-text">News service unavailable · Check your connection</span>
          <button
            className="fetch-error-dismiss"
            onClick={() => { setErrorDismissed(true); track('error_dismissed'); }}
            aria-label="Dismiss error"
            tabIndex={showError ? 0 : -1}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="map-chart-layer">
          <MapChart
            source={source}
            projectionType={projectionType}
            onFetchStatus={handleFetchStatus}
            date={selectedDate}
            bottomReservedPx={(viewMode === 'day' || viewMode === 'consensus') && availableDates.length > 1 ? 90 : 0}
            isHistorical={selectedDate !== todayIso()}
            viewMode={viewMode}
            heatmapStats={heatmapStats ?? []}
            onCountryClick={(iso2, name, count) => setHeatmapClickedCountry({ iso2, name, count })}
            onCalloutsLoaded={setCallouts}
            retryKey={retryKey}
            highlightSource={effectiveHighlightSource}
          />
          {viewMode === 'heatmap' && heatmapError && (
            <div className="heatmap-error-overlay" role="alert" aria-live="assertive">
              <svg className="heatmap-error-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="heatmap-error-text">Failed to load coverage data</span>
              <button
                className="heatmap-error-retry-btn"
                onClick={() => { incrementRetryKey(); track('heatmap_error_retried'); }}
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Desktop date timeline – @author Claude Sonnet 4.6 Anthropic */}
        {(viewMode === 'day' || viewMode === 'consensus') && (
          <div className="date-timeline-overlay">
            <DateTimeline
              availableDates={availableDates}
              selectedDate={selectedDate}
              onChange={setSelectedDate}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Heatmap legend pill – @author Claude Sonnet 4.6 Anthropic */}
        {heatmapLegend && heatmapLegend.gradient && (
          <div className="heatmap-legend-pill" aria-label="Map legend">
            <span className="heatmap-legend-text">
              {heatmapLegend.sourceTotalCount} stories from {sourceShortLabel}
            </span>
            <div className="heatmap-legend-divider" aria-hidden="true" />
            <span className="heatmap-legend-text">{heatmapLegend.dateRange}</span>
            <div className="heatmap-legend-divider" aria-hidden="true" />
            <div className="heatmap-legend-scale" aria-label={`Scale: 1 to ${heatmapLegend.sourceMax} stories`}>
              <span className="heatmap-legend-bound">1</span>
              <div className="heatmap-legend-bar" style={{ background: heatmapLegend.gradient }} aria-hidden="true" />
              <span className="heatmap-legend-bound">{heatmapLegend.sourceMax}</span>
            </div>
          </div>
        )}

        {/* Consensus context banner – @author Claude Sonnet 4.6 Anthropic */}
        {viewMode === 'consensus' && callouts.length > 0 && (() => {
          const groups = groupByCountry(callouts);
          const fullSize = fullSizeTier(groups, 4);
          if (effectiveHighlightSource !== null) {
            return (
              <div className="consensus-context-banner" role="status" aria-live="polite">
                Showing {SOURCE_META[effectiveHighlightSource].label}'s coverage — greyed = not picked by {SOURCE_META[effectiveHighlightSource].shortLabel}
              </div>
            );
          }
          if (fullSize.length === 0) {
            const dateLabel = isToday(selectedDate) ? 'today' : formatShortDate(selectedDate);
            return (
              <div className="consensus-context-banner" role="status" aria-live="polite">
                All sources picked diverging stories on {dateLabel} — no consensus
              </div>
            );
          }
          return null;
        })()}

        <div className="map-footer-overlay">
          <a href="/method" onClick={() => track('nav_link_clicked', { target: 'method' })}>{NAV.HOW_IT_WORKS}</a>
          <span className="map-footer-sep" aria-hidden="true">·</span>
          <a href="/credits" onClick={() => track('nav_link_clicked', { target: 'credits' })}>{NAV.CREDITS}</a>
          <span className="map-footer-sep" aria-hidden="true">·</span>
          <a href="/accessibility" onClick={() => track('nav_link_clicked', { target: 'accessibility' })}>{NAV.ACCESSIBILITY}</a>
          <span className="map-footer-sep" aria-hidden="true">·</span>
          <a
            href="https://github.com/rssrn/newschart"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="newschart on GitHub (opens in new tab)"
            onClick={() => track('nav_link_clicked', { target: 'github' })}
          >
            {NAV.GITHUB}
          </a>
          <span className="map-footer-sep" aria-hidden="true">·</span>
          <button
            className="map-footer-btn"
            onClick={() => { track('nav_link_clicked', { target: 'contact' }); setContactModalOpen(true); }}
          >
            {NAV.CONTACT}
          </button>
        </div>
      </main>

      {/* Mobile controls bar – below the map to avoid obscuring callouts – @author Claude Sonnet 4.6 Anthropic */}
      <div className={`mobile-controls-bar${isLoading ? ' controls-loading' : ''}`}>
        <button
          className="mobile-controls-toggle"
          onClick={() => setMobileSheetOpen(true)}
          aria-label="Open map settings"
          aria-expanded={mobileSheetOpen}
        >
          <span>{mobilePillLabel}</span>
        </button>
      </div>

      {/* Mobile backdrop – @author Claude Sonnet 4.6 Anthropic */}
      <div
        className={`mobile-controls-backdrop${mobileSheetOpen ? ' open' : ''}`}
        onClick={() => setMobileSheetOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile bottom sheet – @author Claude Sonnet 4.6 Anthropic */}
      <div
        ref={mobileSheetRef}
        className={`mobile-controls-sheet${mobileSheetOpen ? ' open' : ''}`}
        role="dialog"
        aria-label="Map settings"
        aria-modal="true"
      >
        <div className="mobile-sheet-handle" aria-hidden="true" />
        <div className="mobile-sheet-section-title">View</div>
        {VIEW_MODES.map(({ value, label }) => (
          <label key={value} className="mobile-sheet-radio-label">
            <input
              type="radio"
              name="view-mode-mobile"
              value={value}
              checked={viewMode === value}
              onChange={() => handleViewModeChange(value)}
            />
            {label}
          </label>
        ))}
        {viewMode !== 'consensus' && (<>
        <div className="mobile-sheet-divider" />
        <div className="mobile-sheet-section-title">Source</div>
        {NEWS_SOURCES.map(({ value, label }) => (
          <label key={value} className="mobile-sheet-radio-label">
            <input
              type="radio"
              name="news-source-mobile"
              value={value}
              checked={source === value}
              onChange={() => handleSourceChange(value)}
              disabled={isLoading}
            />
            {label}
          </label>
        ))}
        <div className="mobile-sheet-divider" />
        </>)}
        <div className="mobile-sheet-section-title">Projection</div>
        {PROJECTION_OPTIONS.map(({ value, label }) => (
          <label key={value} className="mobile-sheet-radio-label">
            <input
              type="radio"
              name="projection-mobile"
              value={value}
              checked={projectionType === value}
              onChange={() => handleProjectionChange(value)}
              disabled={isLoading}
            />
            {label}
          </label>
        ))}
        <button
          className="mobile-sheet-done"
          onClick={() => setMobileSheetOpen(false)}
        >
          Done
        </button>
      </div>

      {/* Contact modal – @author Claude Sonnet 4.6 Anthropic */}
      {contactModalOpen && (
        <ContactModal onClose={() => setContactModalOpen(false)} />
      )}

      {/* Heatmap country modal – @author Claude Sonnet 4.6 Anthropic */}
      {heatmapClickedCountry && viewMode === 'heatmap' && (
        <HeatmapCountryModal
          source={source}
          iso2={heatmapClickedCountry.iso2}
          countryName={heatmapClickedCountry.name}
          totalCount={heatmapClickedCountry.count}
          onClose={() => setHeatmapClickedCountry(null)}
        />
      )}

      {/* Mobile date chip strip (outside map-container to avoid overflow clip) – @author Claude Opus 4.6 Anthropic */}
      {(viewMode === 'day' || viewMode === 'consensus') && availableDates.length > 1 && (
        <div className={`mobile-date-strip-wrapper${isLoading ? ' controls-loading' : ''}`}>
          <div className="mobile-date-strip-overlay">
            {availableDates.map(d => (
              <button
                key={d}
                className={`mobile-date-chip${d === selectedDate ? ' active' : ''}`}
                ref={d === selectedDate ? (el) => { el?.scrollIntoView({ inline: 'center', block: 'nearest' }); } : undefined}
                onClick={() => { setSelectedDate(d); track('date_navigated', { method: 'chip', date: d }); }}
                disabled={isLoading}
              >
                {isToday(d) ? 'Today' : formatShortDate(d)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile story list – day view – @author Claude Sonnet 4.6 Anthropic */}
      {viewMode === 'day' && (
        <MobileStoryList callouts={callouts} isHistorical={selectedDate !== todayIso()} />
      )}

      {/* Mobile coverage ranking list – heatmap view – @author Claude Sonnet 4.6 Anthropic */}
      {viewMode === 'heatmap' && heatmapStats && (
        <MobileCoverageList
          stats={heatmapStats}
          source={source}
          onCountryClick={(iso2, name, count) => setHeatmapClickedCountry({ iso2, name, count })}
        />
      )}

      {/* Mobile fixed footer nav – @author Claude Sonnet 4.6 Anthropic */}
      <nav className="mobile-nav-footer" aria-label="Site navigation">
        <a href="/method" onClick={() => track('nav_link_clicked', { target: 'method' })}>{NAV.HOW_IT_WORKS}</a>
        <span className="map-footer-sep" aria-hidden="true">·</span>
        <a href="/credits" onClick={() => track('nav_link_clicked', { target: 'credits' })}>{NAV.CREDITS}</a>
        <span className="map-footer-sep" aria-hidden="true">·</span>
        <a href="/accessibility" onClick={() => track('nav_link_clicked', { target: 'accessibility' })}>{NAV.ACCESSIBILITY}</a>
        <span className="map-footer-sep" aria-hidden="true">·</span>
        <a
          href="https://github.com/rssrn/newschart"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="newschart on GitHub (opens in new tab)"
          onClick={() => track('nav_link_clicked', { target: 'github' })}
        >
          {NAV.GITHUB}
        </a>
        <span className="map-footer-sep" aria-hidden="true">·</span>
        <button
          className="map-footer-btn"
          onClick={() => { track('nav_link_clicked', { target: 'contact' }); setContactModalOpen(true); }}
        >
          {NAV.CONTACT}
        </button>
      </nav>
    </div>
  );
}

export default App;
