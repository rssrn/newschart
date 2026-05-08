import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Credits from './Credits';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// @author Claude Sonnet 4.6 Anthropic
const isCreditsPage = ['/credits', '/credits.html'].includes(window.location.pathname);

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isCreditsPage ? <Credits /> : <App />}
  </React.StrictMode>
);
