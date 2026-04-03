import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Credits from './Credits';
import reportWebVitals from './reportWebVitals';

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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
