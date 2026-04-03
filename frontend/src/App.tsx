import React, { useState, useEffect } from 'react';
import './App.css';
import MapChart, { ProjectionType, PROJECTION_OPTIONS } from './MapChart';

// @author Claude Sonnet 4.6 Anthropic
type NewsSource = 'NEW_YORK_TIMES' | 'GOOGLE_GEMINI';

const NEWS_SOURCES: { value: NewsSource; label: string }[] = [
  { value: 'NEW_YORK_TIMES', label: 'New York Times' },
  { value: 'GOOGLE_GEMINI', label: 'Google Gemini' },
];

function App(): React.ReactElement {
  const [source, setSource] = useState<NewsSource>('NEW_YORK_TIMES');
  const [projectionType, setProjectionType] = useState<ProjectionType>(
    () => (localStorage.getItem('projectionType') as ProjectionType | null) ?? 'geoMercator'
  );
  // @author Claude Sonnet 4.6 Anthropic
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // @author Claude Sonnet 4.6 Anthropic
  const handleProjectionChange = (value: ProjectionType) => {
    setProjectionType(value);
    localStorage.setItem('projectionType', value);
  };

  // @author Claude Sonnet 4.6 Anthropic
  useEffect(() => {
    if (mobileSheetOpen) {
      document.body.classList.add('sheet-open');
    } else {
      document.body.classList.remove('sheet-open');
    }
    return () => document.body.classList.remove('sheet-open');
  }, [mobileSheetOpen]);

  const sourceShortLabel = source === 'NEW_YORK_TIMES' ? 'NYT' : 'Gemini';
  const projectionLabel = PROJECTION_OPTIONS.find(p => p.value === projectionType)?.label ?? '';

  return (
    <div className="App">
      <div className="map-container">

        {/* Desktop controls overlay */}
        <div className="source-selector-overlay">
          {NEWS_SOURCES.map(({ value, label }) => (
            <label key={value} className="source-radio-label">
              <input
                type="radio"
                name="news-source"
                value={value}
                checked={source === value}
                onChange={() => setSource(value)}
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
              />
              {label}
            </label>
          ))}
        </div>

        {/* Mobile toggle pill – @author Claude Sonnet 4.6 Anthropic */}
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
          <span>{sourceShortLabel} · {projectionLabel}</span>
        </button>

        {/* Mobile backdrop – @author Claude Sonnet 4.6 Anthropic */}
        <div
          className={`mobile-controls-backdrop${mobileSheetOpen ? ' open' : ''}`}
          onClick={() => setMobileSheetOpen(false)}
          aria-hidden="true"
        />

        {/* Mobile bottom sheet – @author Claude Sonnet 4.6 Anthropic */}
        <div
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
                onChange={() => setSource(value)}
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

        <MapChart source={source} projectionType={projectionType}/>
        <div className="map-footer-overlay">
          <a
            href="https://github.com/rssrn/newschart"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="newschart on GitHub (opens in new tab)"
          >
            GitHub
          </a>
          <span className="map-footer-sep" aria-hidden="true">·</span>
          <a href="/credits">Credits</a>
        </div>
      </div>
    </div>
  );
}

export default App;
