import React from 'react';
import StaticPageShell from './StaticPageShell';

/** @author Claude Sonnet 4.6 Anthropic */
const Accessibility = (): React.ReactElement => (
  <StaticPageShell>
    <style>{`
      .ac-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 0 24px 40px;
        font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 1rem;
        color: #374151;
        line-height: 1.6;
      }
      .ac-container a { color: #2563eb; text-decoration: underline; }
      .ac-container a:hover, .ac-container a:focus { color: #1d4ed8; }
      .ac-header {
        padding: 32px 0 24px;
        border-bottom: 2px solid #dbeafe;
        margin-bottom: 28px;
      }
      .ac-header h1 {
        margin: 0 0 4px;
        font-size: 1.75rem;
        font-weight: 700;
        color: #1e3a5f;
        font-family: 'IBM Plex Mono', monospace;
      }
      .ac-subtitle { color: #4b5563; font-size: 0.95rem; }
      .ac-section {
        background: #ffffff;
        border-radius: 6px;
        padding: 22px 26px;
        margin-bottom: 22px;
        box-shadow: 0 1px 4px rgba(37, 99, 235, 0.08);
      }
      .ac-section h2 {
        margin: 0 0 14px;
        font-size: 1.1rem;
        font-weight: 600;
        color: #1e3a5f;
        font-family: 'IBM Plex Mono', monospace;
      }
      .ac-section p { margin: 0 0 12px; }
      .ac-section p:last-child { margin-bottom: 0; }
      .ac-section ul {
        margin: 0;
        padding-left: 1.4em;
      }
      .ac-section li { margin-bottom: 8px; }
      .ac-section li:last-child { margin-bottom: 0; }
      .ac-updated {
        margin-top: 16px;
        font-style: italic;
        color: #4b5563;
        font-size: 0.85rem;
      }
    `}</style>
    <div className="ac-container">
      <div className="ac-header">
        <h1>Accessibility</h1>
        <div className="ac-subtitle">Our commitment to inclusive access</div>
      </div>

      <main id="main-content">
        <section className="ac-section">
          <h2>Our commitment</h2>
          <p>
            NewsChart aims to be accessible to all users. We follow the{' '}
            <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank" rel="noopener noreferrer">
              Web Content Accessibility Guidelines (WCAG) 2.1
            </a>{' '}
            Level AA where possible.
          </p>
        </section>

        <section className="ac-section">
          <h2>What we've done</h2>
          <ul>
            <li>
              <strong>Language declared.</strong> The root HTML element carries <code>lang="en"</code> so screen readers select the correct voice and language rules automatically.
            </li>
            <li>
              <strong>Semantic HTML structure.</strong> Pages use <code>&lt;header&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;section&gt;</code>, and <code>&lt;footer&gt;</code> elements so assistive technology can navigate by landmark.
            </li>
            <li>
              <strong>ARIA labels on all interactive elements.</strong> Every button, modal dialog, navigation region, map control, and legend has a descriptive <code>aria-label</code> so screen readers announce its purpose clearly. Decorative SVG icons are hidden with <code>aria-hidden="true"</code>.
            </li>
            <li>
              <strong>Modal focus management.</strong> When a modal opens — story detail, country coverage, or contact — focus moves to the modal and is trapped inside until it is dismissed. Focus then returns to the element that triggered the modal.
            </li>
            <li>
              <strong>Keyboard navigation.</strong> All interactive elements are reachable by keyboard. Modals close on Escape; the date slider responds to Arrow Left / Arrow Right; story callout cards expand on Enter or Space.
            </li>
            <li>
              <strong>ARIA slider for the date timeline.</strong> The date navigator uses <code>role="slider"</code> with <code>aria-valuemin</code>, <code>aria-valuemax</code>, <code>aria-valuenow</code>, and <code>aria-valuetext</code> so screen readers announce the current date as you step through the timeline.
            </li>
            <li>
              <strong>Live region for errors.</strong> Network errors are announced immediately to screen readers via a <code>role="alert"</code> / <code>aria-live="assertive"</code> toast, without requiring focus to move.
            </li>
            <li>
              <strong>Responsive design.</strong> The layout adapts to mobile screen sizes with a dedicated mobile sheet and navigation footer. Viewport meta tag is set.
            </li>
            <li>
              <strong>Automated WCAG 2.1 AA testing.</strong> End-to-end{' '}
              <a href="https://playwright.dev/" target="_blank" rel="noopener noreferrer">Playwright</a>{' '}
              tests run{' '}
              <a href="https://github.com/dequelabs/axe-core" target="_blank" rel="noopener noreferrer">axe-core</a>{' '}
              WCAG 2.1 AA audits against the live map view, heatmap view, all modal states, the mobile settings sheet, and every static page. Component-level axe audits run in{' '}
              <a href="https://vitest.dev/" target="_blank" rel="noopener noreferrer">Vitest</a>{' '}
              via{' '}
              <a href="https://www.npmjs.com/package/vitest-axe" target="_blank" rel="noopener noreferrer">vitest-axe</a>.
            </li>
          </ul>
        </section>

        <section className="ac-section">
          <h2>Known limitations</h2>
          <ul>
            <li>
              <strong>The world map SVG is not keyboard navigable.</strong> Country shapes on the map are decorative; they cannot be tabbed to or activated by keyboard. All story information is accessible via the callout cards that appear alongside the map and can be expanded with Enter or Space.
            </li>
            <li>
              <strong>The map is an inherently visual medium.</strong> The geographical layout — which stories are geographically close, which countries dominate on a given day — cannot be fully conveyed to non-visual users. Callout cards surface the headline, country, and summary text, but the spatial relationship to the map is lost.
            </li>
          </ul>
        </section>

        <section className="ac-section">
          <h2>Feedback</h2>
          <p>
            If you encounter an accessibility barrier on this site, please open an issue on{' '}
            <a href="https://github.com/rssrn/newschart/issues" target="_blank" rel="noopener noreferrer">GitHub</a>.
          </p>
        </section>

        <p className="ac-updated">Last updated: May 2026</p>
      </main>

    </div>
  </StaticPageShell>
);

export default Accessibility;
