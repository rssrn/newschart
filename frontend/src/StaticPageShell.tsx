import React from 'react';
import { NAV } from './constants';

/** @author Claude Sonnet 4.6 Anthropic */
const StaticPageShell = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; background-color: #f5f5f5; }
      .sp-shell {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
      .sp-header {
        background: #0d1b2e;
        border-bottom: 1px solid rgba(96, 165, 250, 0.15);
        padding: 0 20px;
        height: 56px;
        display: flex;
        align-items: center;
        flex-shrink: 0;
        position: sticky;
        top: 0;
        z-index: 100;
      }
      .sp-logo-link {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        text-decoration: none;
      }
      .sp-logo-link:hover .sp-logo-text { color: #93c5fd; }
      .sp-logo-img {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        flex-shrink: 0;
        display: block;
      }
      .sp-logo-text {
        font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 1.1rem;
        font-weight: 600;
        color: #e2e8f0;
        white-space: nowrap;
        letter-spacing: 0.01em;
        transition: color 0.15s ease;
      }
      .sp-content {
        flex: 1;
        padding-bottom: 38px;
      }
      .sp-footer {
        background: #0d1b2e;
        border-top: 1px solid rgba(96, 165, 250, 0.15);
        padding: 8px 20px;
        text-align: left;
        font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 11px;
        color: #94a3b8;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 100;
      }
      .sp-footer a {
        color: #93c5fd;
        text-decoration: none;
        transition: color 0.15s ease;
      }
      .sp-footer a:hover, .sp-footer a:focus { color: #bfdbfe; text-decoration: underline; }
      .sp-footer-sep { margin: 0 8px; opacity: 0.4; }
    `}</style>
    <div className="sp-shell">
      <header className="sp-header">
        <a href="/" className="sp-logo-link" aria-label="NewsChart – back to map">
          <img src="/logo48.webp" className="sp-logo-img" alt="" aria-hidden="true" />
          <span className="sp-logo-text">NewsChart</span>
        </a>
      </header>
      <div className="sp-content">
        {children}
      </div>
      <footer className="sp-footer">
        <a href="/">{NAV.HOME}</a>
        <span className="sp-footer-sep">·</span>
        <a href="/method">{NAV.HOW_IT_WORKS}</a>
        <span className="sp-footer-sep">·</span>
        <a href="/credits">{NAV.CREDITS}</a>
        <span className="sp-footer-sep">·</span>
        <a href="/accessibility">{NAV.ACCESSIBILITY}</a>
        <span className="sp-footer-sep">·</span>
        <a href="https://github.com/rssrn/newschart" target="_blank" rel="noopener noreferrer">{NAV.GITHUB}</a>
      </footer>
    </div>
  </>
);

export default StaticPageShell;
