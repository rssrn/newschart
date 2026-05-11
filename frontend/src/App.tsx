import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import MapChart from './MapChart';
import DateTimeline from './DateTimeline';
import { ProjectionType, FetchStatus, PROJECTION_OPTIONS } from './utils/projectionOptions';
import { todayIso, isToday, formatShortDate } from './utils/dateUtils';
import { track } from './utils/analytics';

// @author Claude Sonnet 4.6 Anthropic
type NewsSource = 'NEW_YORK_TIMES' | 'GOOGLE_GEMINI' | 'PERPLEXITY' | 'OPENAI';

const NEWS_SOURCES: { value: NewsSource; label: string; shortLabel: string }[] = [
  { value: 'GOOGLE_GEMINI', label: 'Google Gemini', shortLabel: 'Gemini' },
  { value: 'PERPLEXITY', label: 'Perplexity Sonar', shortLabel: 'Perplexity' },
  { value: 'OPENAI', label: 'OpenAI ChatGPT', shortLabel: 'ChatGPT' },
  { value: 'NEW_YORK_TIMES', label: 'New York Times', shortLabel: 'NYT' },
];

function App(): React.ReactElement {
  const [source, setSource] = useState<NewsSource>(
    () => (localStorage.getItem('newsSource') as NewsSource | null) ?? 'GOOGLE_GEMINI'
  );
  const [projectionType, setProjectionType] = useState<ProjectionType>(
    () => (localStorage.getItem('projectionType') as ProjectionType | null) ?? 'geoMercator'
  );
  // @author Claude Sonnet 4.6 Anthropic
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  // @author Claude Sonnet 4.6 Anthropic
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  // @author Claude Sonnet 4.6 Anthropic
  const [fetchStatus, setFetchStatus] = useState<FetchStatus | null>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);

  // @author Claude Sonnet 4.6 Anthropic
  const handleSourceChange = (value: NewsSource) => {
    setSource(value);
    localStorage.setItem('newsSource', value);
    track('source_changed', { source: value });
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
  }, []);

  // @author Claude Sonnet 4.6 Anthropic
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/news/availableDays?source=${source}`, { signal: controller.signal })
      .then(r => r.json())
      .then((dates: string[]) => {
        const sorted = [...dates].sort();
        setAvailableDates(sorted);
        // If the currently selected date isn't in the new source's list, snap to most recent
        setSelectedDate(prev => sorted.includes(prev) ? prev : (sorted[sorted.length - 1] ?? todayIso()));
      })
      .catch(err => { if (err.name !== 'AbortError') console.error('Failed to fetch available dates', err); });
    return () => controller.abort();
  }, [source]);

  const showError = fetchStatus === 'error' && !errorDismissed;
  const isLoading = fetchStatus === 'loading';

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
  const projectionLabel = PROJECTION_OPTIONS.find(p => p.value === projectionType)?.label ?? '';

  return (
    <div className="App">
      <div className="map-container">

        {/* Desktop controls overlay */}
        <div className={`source-selector-overlay${isLoading ? ' controls-loading' : ''}`}>
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
          <div className="selector-divider" />
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

        <MapChart
          source={source}
          projectionType={projectionType}
          onFetchStatus={handleFetchStatus}
          date={selectedDate}
          bottomReservedPx={availableDates.length > 1 ? 90 : 0}
          isHistorical={selectedDate !== todayIso()}
        />

        {/* Desktop date timeline – @author Claude Sonnet 4.6 Anthropic */}
        <div className="date-timeline-overlay">
          <DateTimeline
            availableDates={availableDates}
            selectedDate={selectedDate}
            onChange={setSelectedDate}
            disabled={isLoading}
          />
        </div>
        <div className="map-footer-overlay">
          <a
            href="https://github.com/rssrn/newschart"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="newschart on GitHub (opens in new tab)"
            onClick={() => track('nav_link_clicked', { target: 'github' })}
          >
            GitHub
          </a>
          <span className="map-footer-sep" aria-hidden="true">·</span>
          <a href="/method" onClick={() => track('nav_link_clicked', { target: 'method' })}>How it works</a>
          <span className="map-footer-sep" aria-hidden="true">·</span>
          <a href="/credits" onClick={() => track('nav_link_clicked', { target: 'credits' })}>Credits</a>
        </div>
      </div>

      {/* Mobile controls bar – below the map to avoid obscuring callouts – @author Claude Sonnet 4.6 Anthropic */}
      <div className={`mobile-controls-bar${isLoading ? ' controls-loading' : ''}`}>
        <div className="mobile-footer-links">
          <a
            href="https://github.com/rssrn/newschart"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="newschart on GitHub (opens in new tab)"
            onClick={() => track('nav_link_clicked', { target: 'github' })}
          >
            GitHub
          </a>
          <span className="map-footer-sep" aria-hidden="true">·</span>
          <a href="/method" onClick={() => track('nav_link_clicked', { target: 'method' })}>How it works</a>
          <span className="map-footer-sep" aria-hidden="true">·</span>
          <a href="/credits" onClick={() => track('nav_link_clicked', { target: 'credits' })}>Credits</a>
        </div>
        <button
          className="mobile-controls-toggle"
          onClick={() => setMobileSheetOpen(true)}
          aria-label="Open map settings"
          aria-expanded={mobileSheetOpen}
        >
          <svg className="mobile-controls-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="4" y1="12" x2="20" y2="12"/>
            <line x1="4" y1="18" x2="20" y2="18"/>
            <circle cx="16" cy="6" r="2.5" fill="white" stroke="currentColor" strokeWidth="2"/>
            <circle cx="8" cy="12" r="2.5" fill="white" stroke="currentColor" strokeWidth="2"/>
            <circle cx="16" cy="18" r="2.5" fill="white" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>{sourceShortLabel}{!isToday(selectedDate) ? ` · ${formatShortDate(selectedDate)}` : ''} · {projectionLabel}</span>
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

      {/* Mobile date chip strip (outside map-container to avoid overflow clip) – @author Claude Opus 4.6 Anthropic */}
      {availableDates.length > 1 && (
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
    </div>
  );
}

export default App;
