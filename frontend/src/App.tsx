import React, { useState } from 'react';
import './App.css';
import MapChart from './MapChart';

// @author Claude Sonnet 4.6 Anthropic
type NewsSource = 'NEW_YORK_TIMES' | 'GOOGLE_GEMINI';

const NEWS_SOURCES: { value: NewsSource; label: string }[] = [
  { value: 'NEW_YORK_TIMES', label: 'New York Times' },
  { value: 'GOOGLE_GEMINI', label: 'Google Gemini' },
];

function App(): React.ReactElement {
  const [source, setSource] = useState<NewsSource>('NEW_YORK_TIMES');

  return (
    <div className="App">
      <div className="map-container">
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
        </div>
        <MapChart source={source}/>
      </div>
    </div>
  );
}

export default App;
