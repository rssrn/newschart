import React from 'react';

// @author Claude Sonnet 4.6 Anthropic
const Credits = (): React.ReactElement => (
  <>
    <style>{`
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; background-color: #f5f5f5; }
      .cr-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 0 24px 40px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
        font-size: 1rem;
        color: #374151;
      }
      .cr-container a { color: #2563eb; text-decoration: none; }
      .cr-container a:hover, .cr-container a:focus { color: #1d4ed8; text-decoration: underline; }
      .cr-header {
        padding: 32px 0 24px;
        border-bottom: 2px solid #dbeafe;
        margin-bottom: 28px;
      }
      .cr-header h1 { margin: 0 0 4px; font-size: 1.75rem; font-weight: 700; color: #1e3a5f; }
      .cr-subtitle { color: #6b7280; font-size: 0.95rem; }
      .cr-breadcrumb { margin-bottom: 20px; font-size: 0.875rem; color: #6b7280; }
      .cr-breadcrumb .sep { margin: 0 6px; }
      .cr-breadcrumb .cur { color: #374151; }
      .cr-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8px;
        background: #ffffff;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(37, 99, 235, 0.08);
      }
      .cr-table th {
        background: #eff6ff;
        padding: 10px 12px;
        text-align: left;
        font-weight: 600;
        color: #1e3a5f;
        border-bottom: 2px solid #dbeafe;
        font-size: 0.875rem;
      }
      .cr-table td {
        padding: 10px 12px;
        border-bottom: 1px solid #f3f4f6;
        vertical-align: top;
        color: #374151;
        font-size: 0.9rem;
      }
      .cr-table td.sec-hdr {
        background: #2563eb;
        color: #ffffff;
        font-size: 0.95rem;
        padding: 10px 14px;
        font-weight: 600;
      }
      .cr-table td a { color: #2563eb; font-weight: 500; border-bottom: 1px dotted #93c5fd; }
      .cr-table td a:hover, .cr-table td a:focus { color: #1d4ed8; border-bottom-style: solid; text-decoration: none; }
      .cr-table .icon-col { width: 32px; text-align: center; vertical-align: middle; }
      .favicon-img { width: 16px; height: 16px; display: inline-block; vertical-align: middle; border-radius: 2px; }
      .cr-table tbody:last-child tr:last-child td { border-bottom: none; }
      .cr-table tr:hover td:not(.sec-hdr) { background: #f9fafb; }
      .cr-footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #dbeafe;
        text-align: center;
        font-size: 0.875rem;
        color: #6b7280;
      }
      .visually-hidden {
        position: absolute; width: 1px; height: 1px; padding: 0;
        margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
        white-space: nowrap; border: 0;
      }
    `}</style>
    <div className="cr-container">
      <header className="cr-header">
        <h1>Credits &amp; Acknowledgments</h1>
        <div className="cr-subtitle">Technologies and data sources powering NewsChart</div>
      </header>

      <nav aria-label="Breadcrumb" className="cr-breadcrumb">
        <a href="/">Home</a>
        <span className="sep">/</span>
        <span className="cur">Credits</span>
      </nav>

      <table className="cr-table">
        <thead>
          <tr>
            <th scope="col" className="icon-col"></th>
            <th scope="col" style={{ width: '25%' }}>Person / Project / Service</th>
            <th scope="col" style={{ width: '50%' }}>Purpose</th>
            <th scope="col" style={{ width: '25%' }}>License</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={4} className="sec-hdr" role="rowheader">NewsChart Codebase</td></tr>
          <tr>
            <td className="icon-col"><a href="https://github.com/rssrn/newschart" target="_blank" rel="noopener noreferrer" aria-label="newschart on GitHub"><FaviconImg domain="github.com" alt="newschart on GitHub" /></a></td>
            <td><a href="https://github.com/rssrn/newschart" target="_blank" rel="noopener noreferrer">newschart</a></td>
            <td>Interactive world map of top news stories</td>
            <td></td>
          </tr>
          <tr>
            <td className="icon-col"></td>
            <td><a href="https://www.linkedin.com/in/rarnold/" target="_blank" rel="noopener noreferrer">Ross Arnold</a></td>
            <td>Project Owner / Lead Developer</td>
            <td></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="anthropic.com" alt="" /></td>
            <td><a href="https://claude.ai/" target="_blank" rel="noopener noreferrer">Anthropic - Claude AI</a></td>
            <td>AI Coding Assistant — collaborated on majority of the NewsChart codebase</td>
            <td>Commercial Service</td>
          </tr>
        </tbody>
        <tbody>
          <tr><td colSpan={4} className="sec-hdr" role="rowheader">Data Sources</td></tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="nytimes.com" alt="" /></td>
            <td><a href="https://rss.nytimes.com/" target="_blank" rel="noopener noreferrer">New York Times RSS</a></td>
            <td>World news headlines feed used as primary news source</td>
            <td><a href="https://thenewyorktimeshelpcenter.helpjuice.com/115002797688-Policies/115014893428-Terms-of-Service/" target="_blank" rel="noopener noreferrer">NYT Terms of Service</a></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="gemini.google.com" alt="" /></td>
            <td><a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer">Google Gemini API</a></td>
            <td>AI language model used to summarise news stories and extract geographic context</td>
            <td>Commercial Service</td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="github.com" alt="" /></td>
            <td><a href="https://github.com/topojson/world-atlas" target="_blank" rel="noopener noreferrer">world-atlas</a></td>
            <td>Pre-built TopoJSON world map geometry used for country rendering</td>
            <td><a href="https://opensource.org/licenses/ISC" target="_blank" rel="noopener noreferrer">ISC</a></td>
          </tr>
        </tbody>
        <tbody>
          <tr><td colSpan={4} className="sec-hdr" role="rowheader">Frontend Libraries</td></tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="react.dev" alt="" /></td>
            <td><a href="https://github.com/facebook/react" target="_blank" rel="noopener noreferrer">React 18</a></td>
            <td>UI component library and rendering framework</td>
            <td><a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">MIT</a></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="github.com" alt="" /></td>
            <td><a href="https://github.com/zcreativelabs/react-simple-maps" target="_blank" rel="noopener noreferrer">react-simple-maps</a></td>
            <td>SVG world map component with geography rendering</td>
            <td><a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">MIT</a></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="d3js.org" alt="" /></td>
            <td><a href="https://github.com/d3/d3-geo" target="_blank" rel="noopener noreferrer">d3-geo</a></td>
            <td>Geographic projections (Mercator, Natural Earth, Equal Earth, Equirectangular)</td>
            <td><a href="https://opensource.org/licenses/ISC" target="_blank" rel="noopener noreferrer">ISC</a></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="typescriptlang.org" alt="" /></td>
            <td><a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer">TypeScript</a></td>
            <td>Typed superset of JavaScript for the frontend codebase</td>
            <td><a href="https://opensource.org/licenses/Apache-2.0" target="_blank" rel="noopener noreferrer">Apache 2.0</a></td>
          </tr>
        </tbody>
        <tbody>
          <tr><td colSpan={4} className="sec-hdr" role="rowheader">Backend Framework &amp; Libraries</td></tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="spring.io" alt="" /></td>
            <td><a href="https://spring.io/projects/spring-boot" target="_blank" rel="noopener noreferrer">Spring Boot 4</a></td>
            <td>Java application framework; REST API, scheduling, dependency injection</td>
            <td><a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer">Apache 2.0</a></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="spring.io" alt="" /></td>
            <td><a href="https://spring.io/projects/spring-ai" target="_blank" rel="noopener noreferrer">Spring AI</a></td>
            <td>AI model integration layer used to call the Google Gemini API</td>
            <td><a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer">Apache 2.0</a></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="spring.io" alt="" /></td>
            <td><a href="https://spring.io/projects/spring-data-mongodb" target="_blank" rel="noopener noreferrer">Spring Data MongoDB</a></td>
            <td>MongoDB object mapping and repository abstraction</td>
            <td><a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer">Apache 2.0</a></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="spring.io" alt="" /></td>
            <td><a href="https://spring.io/projects/spring-framework" target="_blank" rel="noopener noreferrer">Spring WebFlux</a></td>
            <td>Reactive HTTP client for non-blocking outbound API calls</td>
            <td><a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer">Apache 2.0</a></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="sourceforge.net" alt="" /></td>
            <td><a href="https://opencsv.sourceforge.net/" target="_blank" rel="noopener noreferrer">opencsv</a></td>
            <td>CSV parsing for country / ISO code lookup data</td>
            <td><a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer">Apache 2.0</a></td>
          </tr>
        </tbody>
        <tbody>
          <tr><td colSpan={4} className="sec-hdr" role="rowheader">Database &amp; Cloud Services</td></tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="mongodb.com" alt="" /></td>
            <td><a href="https://www.mongodb.com/atlas" target="_blank" rel="noopener noreferrer">MongoDB Atlas</a></td>
            <td>Managed cloud MongoDB cluster for storing news callout documents</td>
            <td>Commercial Service</td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="github.com" alt="" /></td>
            <td><a href="https://github.com/features/actions" target="_blank" rel="noopener noreferrer">GitHub Actions</a></td>
            <td>CI/CD platform for automated testing and deployment workflows</td>
            <td>Commercial Service</td>
          </tr>
        </tbody>
        <tbody>
          <tr><td colSpan={4} className="sec-hdr" role="rowheader">Development &amp; Testing</td></tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="testcontainers.com" alt="" /></td>
            <td><a href="https://github.com/testcontainers/testcontainers-java" target="_blank" rel="noopener noreferrer">Testcontainers</a></td>
            <td>Spins up a real MongoDB container for integration tests</td>
            <td><a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">MIT</a></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="testing-library.com" alt="" /></td>
            <td><a href="https://github.com/testing-library/react-testing-library" target="_blank" rel="noopener noreferrer">React Testing Library</a></td>
            <td>Frontend unit and integration testing utilities</td>
            <td><a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">MIT</a></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="playwright.dev" alt="" /></td>
            <td><a href="https://playwright.dev/" target="_blank" rel="noopener noreferrer">Playwright</a></td>
            <td>Screenshot tests for visual regression checking of the map layout</td>
            <td><a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer">Apache 2.0</a></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="owasp.org" alt="" /></td>
            <td><a href="https://owasp.org/www-project-dependency-check/" target="_blank" rel="noopener noreferrer">OWASP Dependency-Check</a></td>
            <td>Maven plugin that scans Java dependencies for known CVEs</td>
            <td><a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer">Apache 2.0</a></td>
          </tr>
        </tbody>
      </table>

      <footer className="cr-footer">
        <a href="/">Home</a>
        {' | '}
        <a href="https://github.com/rssrn/newschart" target="_blank" rel="noopener noreferrer">GitHub</a>
        <div style={{ marginTop: 8 }}>
          Powered by <a href="https://github.com/rssrn/newschart" target="_blank" rel="noopener noreferrer">newschart</a>
          {' \u2022 '}Made with appreciation for the open source community
        </div>
      </footer>
    </div>
  </>
);

// @author Claude Sonnet 4.6 Anthropic
const FaviconImg = ({ domain, alt }: { domain: string; alt: string }): React.ReactElement => (
  <img
    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
    className="favicon-img"
    alt={alt}
    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
  />
);

export default Credits;
