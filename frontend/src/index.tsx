import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Credits from './Credits';
import Method from './Method';
import Accessibility from './Accessibility';
import TestMapPage from './TestMapPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// @author Claude Sonnet 4.6 Anthropic
const path = window.location.pathname;
const page: React.ReactElement = ['/credits', '/credits.html'].includes(path)
  ? <Credits />
  : ['/method', '/method.html', '/how-it-works'].includes(path)
    ? <Method />
    : ['/accessibility', '/accessibility.html'].includes(path)
      ? <Accessibility />
      : path === '/__layout-test'
        ? <TestMapPage />
        : <App />;

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {page}
  </React.StrictMode>
);
