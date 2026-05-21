import React from 'react';
import StaticPageShell from './StaticPageShell';

const Credits =(): React.ReactElement => (
  <StaticPageShell>
    <style>{`
      .cr-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 0 24px 40px;
        font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
      .cr-header h1 { margin: 0 0 4px; font-size: 1.75rem; font-weight: 700; color: #1e3a5f; font-family: 'IBM Plex Mono', monospace; }
      .cr-subtitle { color: #4b5563; font-size: 0.95rem; }
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
        padding: 12px 14px;
        text-align: left;
        font-weight: 600;
        color: #1e3a5f;
        border-bottom: 2px solid #dbeafe;
        font-size: 0.875rem;
      }
      .cr-table td {
        padding: 12px 14px;
        border-bottom: 1px solid #f3f4f6;
        vertical-align: top;
        color: #374151;
        font-size: 0.9rem;
      }
      .cr-table td.sec-hdr {
        background: #2563eb;
        color: #ffffff;
        font-size: 0.95rem;
        padding: 12px 14px;
        font-weight: 600;
      }
      .sec-hdr-link {
        font-size: 0.75rem;
        font-weight: 400;
        color: #dbeafe;
        text-decoration: none;
        margin-left: 10px;
        letter-spacing: 0.01em;
        border-bottom: 1px solid rgba(255,255,255,0.4);
      }
      .sec-hdr-link:hover, .sec-hdr-link:focus {
        color: #ffffff;
        border-bottom-color: #ffffff;
        text-decoration: none;
      }
      .cr-table td a { color: #2563eb; font-weight: 500; border-bottom: 1px dotted #93c5fd; }
      .cr-table td a:hover, .cr-table td a:focus { color: #1d4ed8; border-bottom-style: solid; text-decoration: none; }
      .cr-table .icon-col { width: 32px; text-align: center; vertical-align: middle; }
      .favicon-img { width: 20px; height: 20px; display: inline-block; vertical-align: middle; border-radius: 2px; }
      .cr-table tbody:last-child tr:last-child td { border-bottom: none; }
      .cr-table tr:hover td:not(.sec-hdr) { background: #eff6ff; }
      @media (max-width: 600px) {
        .cr-table thead { display: none; }
        .cr-table,
        .cr-table tbody { display: block; }
        .cr-table tr {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          padding: 10px 14px;
          border-bottom: 1px solid #f3f4f6;
        }
        .cr-table tr:has(.sec-hdr) { padding: 0; }
        .cr-table td { padding: 0; border-bottom: none; }
        .cr-table .icon-col {
          width: 28px;
          flex-shrink: 0;
          align-self: center;
          text-align: left;
        }
        .cr-table td:nth-child(2) {
          flex: 1;
          min-width: 0;
          align-self: center;
        }
        .cr-table td:nth-child(3) {
          flex-basis: 100%;
          padding-left: 32px;
          margin-top: 4px;
        }
        .cr-table td:nth-child(4) {
          flex-basis: 100%;
          padding-left: 32px;
          margin-top: 4px;
        }
        .sec-hdr { display: block !important; width: 100% !important; }
        .cr-table tr:hover td:not(.sec-hdr) { background: transparent; }
      }
      .visually-hidden {
        position: absolute; width: 1px; height: 1px; padding: 0;
        margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
        white-space: nowrap; border: 0;
      }
      .license-badge {
        display: inline-block;
        padding: 2px 9px;
        border-radius: 999px;
        font-size: 0.775rem;
        font-weight: 500;
        white-space: nowrap;
        line-height: 1.6;
        text-decoration: none !important;
        border-bottom: none !important;
      }
      .license-badge a { border-bottom: none !important; }
      .badge-commercial { background: #f3f4f6; color: #4b5563; }
      .badge-mit        { background: #dcfce7; color: #166534; }
      .badge-apache     { background: #fef3c7; color: #92400e; }
      .badge-isc        { background: #ccfbf1; color: #0f766e; }
      .badge-gpl        { background: #fee2e2; color: #991b1b; }
      .badge-epl        { background: #ede9fe; color: #5b21b6; }
      .badge-acm        { background: #f0f9ff; color: #0369a1; }
      .badge-nyt        { background: #fafafa; color: #374151; border: 1px solid #e5e7eb; }
      .badge-mpl        { background: #fff7ed; color: #9a3412; }
    `}</style>
    <div className="cr-container">
      <div className="cr-header">
        <h1>Credits &amp; Acknowledgments</h1>
        <div className="cr-subtitle">Technologies and data sources powering NewsChart</div>
      </div>

      <table className="cr-table">
        <thead>
          <tr>
            <th scope="col" className="icon-col"><span className="visually-hidden">Icon</span></th>
            <th scope="col" style={{ width: '25%' }}>Person / Project / Service</th>
            <th scope="col" style={{ width: '50%' }}>Purpose</th>
            <th scope="col" style={{ width: '25%' }}>License</th>
          </tr>
        </thead>
        <tbody>
          <tr><th scope="rowgroup" colSpan={4} className="sec-hdr">NewsChart Codebase<a href="https://github.com/rssrn/newschart" target="_blank" rel="noopener noreferrer" className="sec-hdr-link">↗ github.com/rssrn/newschart</a></th></tr>
          <tr>
            <td className="icon-col"></td>
            <td><a href="https://www.linkedin.com/in/rarnold/" target="_blank" rel="noopener noreferrer">Ross Arnold</a></td>
            <td>Project Owner / Lead Developer / Backend Developer</td>
            <td></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="anthropic.com" alt="" /></td>
            <td><a href="https://claude.ai/" target="_blank" rel="noopener noreferrer">Anthropic - Claude AI</a></td>
            <td>AI Coding Assistant / Frontend Developer</td>
            <td><LicenseBadge variant="commercial" label="Commercial Service" /></td>
          </tr>
        </tbody>
        <tbody>
          <tr><th scope="rowgroup" colSpan={4} className="sec-hdr">Data Sources</th></tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="gemini.google.com" alt="" /></td>
            <td><a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer">Google Gemini API</a></td>
            <td>AI model used to source and summarise news stories, and to summarise NYT stories per country</td>
            <td><LicenseBadge variant="commercial" label="Commercial Service" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="perplexity.ai" alt="" /></td>
            <td><a href="https://www.perplexity.ai/" target="_blank" rel="noopener noreferrer">Perplexity Sonar</a></td>
            <td>AI model used to source and summarise current news stories</td>
            <td><LicenseBadge variant="commercial" label="Commercial Service" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="openai.com" alt="" /></td>
            <td><a href="https://openai.com/chatgpt" target="_blank" rel="noopener noreferrer">OpenAI ChatGPT</a></td>
            <td>AI model used to source and summarise current news stories</td>
            <td><LicenseBadge variant="commercial" label="Commercial Service" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="openrouter.ai" alt="" /></td>
            <td><a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer">OpenRouter</a></td>
            <td>API gateway used to route requests to Perplexity Sonar and OpenAI ChatGPT models</td>
            <td><LicenseBadge variant="commercial" label="Commercial Service" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="nytimes.com" alt="" /></td>
            <td><a href="https://rss.nytimes.com/" target="_blank" rel="noopener noreferrer">New York Times RSS</a></td>
            <td>World news RSS feed; used to provide a non-AI-sourced, editorially curated news source for comparison</td>
            <td><LicenseBadge variant="nyt" label="NYT Terms of Service" href="https://thenewyorktimeshelpcenter.helpjuice.com/115002797688-Policies/115014893428-Terms-of-Service/" /></td>
          </tr>
        </tbody>
        <tbody>
          <tr><th scope="rowgroup" colSpan={4} className="sec-hdr">Security</th></tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="owasp.org" alt="" /></td>
            <td><a href="https://owasp.org/www-project-dependency-check/" target="_blank" rel="noopener noreferrer">OWASP Dependency-Check</a></td>
            <td>Maven plugin that scans Java dependencies for known CVEs; runs as a dedicated GitHub Actions workflow</td>
            <td><LicenseBadge variant="apache" label="Apache 2.0" href="https://www.apache.org/licenses/LICENSE-2.0" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="npmjs.com" alt="" /></td>
            <td><a href="https://docs.npmjs.com/cli/commands/npm-audit" target="_blank" rel="noopener noreferrer">npm audit</a></td>
            <td>Built-in npm command that checks frontend dependencies against the npm advisory database; runs locally in the pre-push hook and in the Frontend CI GitHub Actions workflow on every push</td>
            <td><LicenseBadge variant="mit" label="MIT" href="https://opensource.org/licenses/MIT" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="github.com" alt="" /></td>
            <td><a href="https://docs.github.com/en/code-security/dependabot" target="_blank" rel="noopener noreferrer">GitHub Dependabot</a></td>
            <td>Automated dependency update PRs for Maven, npm, and GitHub Actions packages; configured for weekly scans</td>
            <td><LicenseBadge variant="commercial" label="Commercial Service" /></td>
          </tr>
        </tbody>
        <tbody>
          <tr><th scope="rowgroup" colSpan={4} className="sec-hdr">Frontend Libraries</th></tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="react.dev" alt="" /></td>
            <td><a href="https://github.com/facebook/react" target="_blank" rel="noopener noreferrer">React 18</a></td>
            <td>UI component library and rendering framework</td>
            <td><LicenseBadge variant="mit" label="MIT" href="https://opensource.org/licenses/MIT" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="typescriptlang.org" alt="" /></td>
            <td><a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer">TypeScript</a></td>
            <td>Typed superset of JavaScript for the frontend codebase</td>
            <td><LicenseBadge variant="apache" label="Apache 2.0" href="https://opensource.org/licenses/Apache-2.0" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="vitejs.dev" alt="" /></td>
            <td><a href="https://vitejs.dev/" target="_blank" rel="noopener noreferrer">Vite</a></td>
            <td>Frontend build tool and dev server</td>
            <td><LicenseBadge variant="mit" label="MIT" href="https://opensource.org/licenses/MIT" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="github.com" alt="" /></td>
            <td><a href="https://github.com/zcreativelabs/react-simple-maps" target="_blank" rel="noopener noreferrer">react-simple-maps</a></td>
            <td>SVG world map component with geography rendering</td>
            <td><LicenseBadge variant="mit" label="MIT" href="https://opensource.org/licenses/MIT" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="d3js.org" alt="" /></td>
            <td><a href="https://github.com/d3/d3-geo" target="_blank" rel="noopener noreferrer">d3-geo</a></td>
            <td>Geographic projections (Mercator, Natural Earth)</td>
            <td><LicenseBadge variant="isc" label="ISC" href="https://opensource.org/licenses/ISC" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="github.com" alt="" /></td>
            <td><a href="https://github.com/topojson/world-atlas" target="_blank" rel="noopener noreferrer">world-atlas</a></td>
            <td>Pre-built TopoJSON world map geometry used for country rendering</td>
            <td><LicenseBadge variant="isc" label="ISC" href="https://opensource.org/licenses/ISC" /></td>
          </tr>
        </tbody>
        <tbody>
          <tr><th scope="rowgroup" colSpan={4} className="sec-hdr">Backend Framework &amp; Libraries</th></tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="openjdk.org" alt="" /></td>
            <td><a href="https://openjdk.org/projects/jdk/21/" target="_blank" rel="noopener noreferrer">Java 21 (OpenJDK)</a></td>
            <td>JVM runtime; LTS release with records, pattern matching, and virtual threads</td>
            <td><LicenseBadge variant="gpl" label="GPL v2 + CPE" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="spring.io" alt="" /></td>
            <td><a href="https://spring.io/projects/spring-boot" target="_blank" rel="noopener noreferrer">Spring Boot 4</a></td>
            <td>Java application framework; REST API, scheduling, dependency injection</td>
            <td><LicenseBadge variant="apache" label="Apache 2.0" href="https://www.apache.org/licenses/LICENSE-2.0" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="maven.apache.org" alt="" /></td>
            <td><a href="https://maven.apache.org/" target="_blank" rel="noopener noreferrer">Apache Maven</a></td>
            <td>Build tool and dependency management for the backend</td>
            <td><LicenseBadge variant="apache" label="Apache 2.0" href="https://www.apache.org/licenses/LICENSE-2.0" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="spring.io" alt="" /></td>
            <td><a href="https://spring.io/projects/spring-ai" target="_blank" rel="noopener noreferrer">Spring AI</a></td>
            <td>AI model integration layer used to call the Google Gemini API</td>
            <td><LicenseBadge variant="apache" label="Apache 2.0" href="https://www.apache.org/licenses/LICENSE-2.0" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="spring.io" alt="" /></td>
            <td><a href="https://spring.io/projects/spring-data-mongodb" target="_blank" rel="noopener noreferrer">Spring Data MongoDB</a></td>
            <td>MongoDB object mapping and repository abstraction</td>
            <td><LicenseBadge variant="apache" label="Apache 2.0" href="https://www.apache.org/licenses/LICENSE-2.0" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="spring.io" alt="" /></td>
            <td><a href="https://spring.io/projects/spring-framework" target="_blank" rel="noopener noreferrer">Spring WebFlux</a></td>
            <td>Reactive HTTP client for non-blocking outbound API calls</td>
            <td><LicenseBadge variant="apache" label="Apache 2.0" href="https://www.apache.org/licenses/LICENSE-2.0" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="sourceforge.net" alt="" /></td>
            <td><a href="https://opencsv.sourceforge.net/" target="_blank" rel="noopener noreferrer">opencsv</a></td>
            <td>CSV parsing for country / ISO code lookup data</td>
            <td><LicenseBadge variant="apache" label="Apache 2.0" href="https://www.apache.org/licenses/LICENSE-2.0" /></td>
          </tr>
        </tbody>
        <tbody>
          <tr><th scope="rowgroup" colSpan={4} className="sec-hdr">Database &amp; Cloud Services</th></tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="mongodb.com" alt="" /></td>
            <td><a href="https://www.mongodb.com/atlas" target="_blank" rel="noopener noreferrer">MongoDB Atlas</a></td>
            <td>Managed cloud MongoDB cluster for storing news callout documents</td>
            <td><LicenseBadge variant="commercial" label="Commercial Service" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="github.com" alt="" /></td>
            <td><a href="https://github.com/features/actions" target="_blank" rel="noopener noreferrer">GitHub Actions</a></td>
            <td>CI/CD platform for automated testing and deployment workflows</td>
            <td><LicenseBadge variant="commercial" label="Commercial Service" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="tailscale.com" alt="" /></td>
            <td><a href="https://tailscale.com/" target="_blank" rel="noopener noreferrer">Tailscale</a></td>
            <td>Zero-config VPN; GitHub Actions deploys to the production server over Tailscale</td>
            <td><LicenseBadge variant="commercial" label="Commercial Service" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="umami.is" alt="" /></td>
            <td><a href="https://umami.is/" target="_blank" rel="noopener noreferrer">Umami</a></td>
            <td>Privacy-friendly, cookie-free web analytics</td>
            <td><LicenseBadge variant="commercial" label="Commercial Service" /></td>
          </tr>
        </tbody>
        <tbody>
          <tr><th scope="rowgroup" colSpan={4} className="sec-hdr">Academic References</th></tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="dl.acm.org" alt="" /></td>
            <td><a href="https://doi.org/10.1145/212332.212334" target="_blank" rel="noopener noreferrer">Christensen, Marks &amp; Shieber (1995)</a></td>
            <td>
              <em>An Empirical Study of Algorithms for Point-Feature Label Placement</em> — the candidate-enumeration and penalty-scoring approach underpinning the NewsChart callout layout algorithm
            </td>
            <td><LicenseBadge variant="acm" label="ACM" /></td>
          </tr>
        </tbody>
        <tbody>
          <tr><th scope="rowgroup" colSpan={4} className="sec-hdr">Development &amp; Testing</th></tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="junit.org" alt="" /></td>
            <td><a href="https://junit.org/junit5/" target="_blank" rel="noopener noreferrer">JUnit 5</a></td>
            <td>Backend unit and integration test framework</td>
            <td><LicenseBadge variant="epl" label="EPL 2.0" href="https://opensource.org/licenses/EPL-2.0" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="testcontainers.com" alt="" /></td>
            <td><a href="https://github.com/testcontainers/testcontainers-java" target="_blank" rel="noopener noreferrer">Testcontainers</a></td>
            <td>Spins up a real MongoDB container for integration tests</td>
            <td><LicenseBadge variant="mit" label="MIT" href="https://opensource.org/licenses/MIT" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="testing-library.com" alt="" /></td>
            <td><a href="https://github.com/testing-library/react-testing-library" target="_blank" rel="noopener noreferrer">React Testing Library</a></td>
            <td>Frontend unit and integration testing utilities</td>
            <td><LicenseBadge variant="mit" label="MIT" href="https://opensource.org/licenses/MIT" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="vitest.dev" alt="" /></td>
            <td><a href="https://vitest.dev/" target="_blank" rel="noopener noreferrer">Vitest</a></td>
            <td>Frontend unit test runner, used with React Testing Library</td>
            <td><LicenseBadge variant="mit" label="MIT" href="https://opensource.org/licenses/MIT" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="playwright.dev" alt="" /></td>
            <td><a href="https://playwright.dev/" target="_blank" rel="noopener noreferrer">Playwright</a></td>
            <td>End-to-end browser testing: layout screenshot tests and WCAG accessibility audits</td>
            <td><LicenseBadge variant="apache" label="Apache 2.0" href="https://www.apache.org/licenses/LICENSE-2.0" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="eslint.org" alt="" /></td>
            <td><a href="https://eslint.org/" target="_blank" rel="noopener noreferrer">ESLint</a></td>
            <td>JavaScript/TypeScript linter with react-hooks and typescript-eslint plugins</td>
            <td><LicenseBadge variant="mit" label="MIT" href="https://opensource.org/licenses/MIT" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="deque.com" alt="" /></td>
            <td><a href="https://github.com/dequelabs/axe-core" target="_blank" rel="noopener noreferrer">axe-core / @axe-core/playwright</a></td>
            <td>Accessibility testing engine; runs WCAG 2.1 AA audits in Playwright end-to-end tests</td>
            <td><LicenseBadge variant="mpl" label="MPL 2.0" href="https://opensource.org/licenses/MPL-2.0" /></td>
          </tr>
          <tr>
            <td className="icon-col"><FaviconImg domain="github.com" alt="" /></td>
            <td><a href="https://github.com/nicholasbailey/vitest-axe" target="_blank" rel="noopener noreferrer">vitest-axe</a></td>
            <td>Vitest matchers for axe-core component-level accessibility testing</td>
            <td><LicenseBadge variant="mit" label="MIT" href="https://opensource.org/licenses/MIT" /></td>
          </tr>
        </tbody>
      </table>

    </div>
  </StaticPageShell>
);

const FaviconImg = ({ domain, alt }: { domain: string; alt: string }): React.ReactElement => (
  <img
    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
    className="favicon-img"
    alt={alt}
    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
  />
);

type LicenseVariant = 'commercial' | 'mit' | 'apache' | 'isc' | 'gpl' | 'epl' | 'acm' | 'nyt' | 'mpl';

/** @author Claude Sonnet 4.6 Anthropic */
const LicenseBadge = ({ variant, label, href }: { variant: LicenseVariant; label: string; href?: string }): React.ReactElement => {
  const inner = href
    ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 'inherit' }}>{label}</a>
    : label;
  return <span className={`license-badge badge-${variant}`}>{inner}</span>;
};

export default Credits;
