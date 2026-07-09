import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { reportError } from './utils/ferrtrap';
const Credits = lazy(() => import('./Credits'));
const Method = lazy(() => import('./Method'));
const Accessibility = lazy(() => import('./Accessibility'));
const App = lazy(() => import('./App'));
const TestMapPage = lazy(() => import('./TestMapPage'));

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

// @author Claude Sonnet 5 Anthropic
window.addEventListener('error', e => reportError('window.onerror', e.message));
window.addEventListener('unhandledrejection', e => reportError('unhandledrejection', String(e.reason)));

// @author Claude Sonnet 5 Anthropic
// Prod smoke-test trigger for the ferrtrap pipeline: visit ?ferrtrap_test=1 to
// throw a synthetic uncaught error via the window 'error' listener above.
if (new URLSearchParams(window.location.search).has('ferrtrap_test')) {
  window.setTimeout(() => { throw new Error('ferrtrap synthetic test error'); });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#94a3b8', fontFamily: 'system-ui, sans-serif' }}>Loading map…</div>}>
        {page}
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);
