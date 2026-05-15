# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.12.0] - 2026-05-15

Coverage Map interactivity: country hover, drill-down modal, and UI polish.

### Added
- **Country hover** in Coverage Map mode (desktop only) — border highlight and tooltip showing flag, country name, and story count
- **Country drill-down modal** (desktop only) — click any country in Coverage Map mode to open a paginated list of stories for that country and source (`/api/news/calloutsForSourceAndCountry` endpoint)
- Coverage Map status pill now shows the total story count across all countries, with dividers between sections

### Changed
- Natural Earth is now the default map projection
- View mode toggle labels updated to **Day View** / **Coverage Map**

### Fixed
- Focus outline removed on map country click
- Mobile status pill: date hidden in Coverage Map mode; always shows two elements (source + count)

### CI
- Deploy rollback step skipped if the backup step never ran (prevents spurious failure when deploy aborts before touching production)

## [0.11.1] - 2026-05-14

Fix heatmap not loading on page reload when Story Counts mode was saved in localStorage.

### Fixed
- Heatmap stats are now fetched on mount when `viewMode` is restored as `'heatmap'` from localStorage; previously the map rendered blank with no choropleth colouring

## [0.11.0] - 2026-05-14

Story Counts heatmap debut: inferno colour scale, legend pill, normalised scale, and cache fixes.

### Changed
- **Story Counts** (formerly Heatmap) mode renamed; mode toggle labels updated to "Daily" / "Story Counts"
- Heatmap colour scale replaced with inferno-inspired multi-stop RGB gradient (dark red → vivid orange) with sqrt scaling so low-count countries are visually distinct from the background
- Colour scale normalised across all sources so the same colour represents the same count globally
- Low-count countries are static; mid/high-count countries show a two-tier subtle pulse animation

### Added
- Legend pill overlay (same position as date timeline) showing source name, date range, and a dynamic gradient bar reflecting the colour range in use

### Fixed
- Backend `calloutsForDay` no longer caches empty results, preventing cache poisoning when data hasn't loaded yet
- Frontend no longer caches empty callout responses from the API

## [0.10.2] - 2026-05-14

Fix heatmap stats aggregation StackOverflowError.

### Fixed
- `findStatsFromAllCallouts` MongoDB aggregation used malformed `{$count}` expression in `$project` stage, causing a `StackOverflowError` on every call to `/api/news/statsAllCallouts`

### Tests
- Added integration tests for `calloutStatsAllCallouts` including a regression test that reproduces the aggregation bug
- Suppressed `BasicFetchSchedulerService` startup in all `@SpringBootTest` classes to prevent costly AI pipeline calls during test runs

## [0.10.1] - 2026-05-13

Hotfix: hide heatmap toggle until backend aggregation bug is resolved.

### Fixed
- Day View / Heatmap radio buttons temporarily hidden; view mode hardcoded to Day View to prevent 500 error and blank-screen crash on heatmap selection

## [0.10.0] - 2026-05-13

Heatmap view mode.

### Added
- **Heatmap view mode** — Day View / Heatmap radio toggle above the source selector (desktop + mobile). Heatmap colours countries by story count using a cool-blue → orange HSL scale with glow; date timeline and callout boxes are hidden in this mode. View mode persisted in `localStorage`.
- `/api/news/statsAllCallouts` endpoint returning per-country story counts across all stored callouts
- Vite, Vitest, and ESLint credited on the Credits page

## [0.9.3] - 2026-05-12

Brand badge, layout spacing, and Gemini model fix.

### Added
- NewsChart brand badge on the map (top-left corner)

### Changed
- Minimum callout distance increased 80→95 for better visual breathing room
- Footer links reordered to: How it works · Credits · GitHub

### Fixed
- Gemini news source switched back to `gemini-2.5-flash` (with search grounding) after `gemini-2.5-flash-lite` lost grounding support
- `scoreOriginProximity` no longer penalises a callout's own origin point

## [0.9.2] - 2026-05-12

Layout algorithm refinement and pipeline robustness.

### Changed
- Callout layout algorithm now uses a 16-way direction grid (was 8), letting connectors
  thread between neighbouring boxes; connector-through-box penalty raised 300→700 so it
  ranks above a crossing. Clears the live Gemini fixtures that previously failed
- Deploy workflow sped up: merged Maven invocations and faster smoke-test polling

### Fixed
- Strip trailing markdown fences from LLM JSON responses (OpenRouter gateway)

## [0.9.1] - 2026-05-11

Analytics and layout algorithm test harness.

### Added
- Umami analytics tracking across the frontend: source/projection changes, date navigation
  (keyboard, slider, arrow, chip), callout clicks, modal close, nav link clicks,
  API load success/failure with duration, and error dismissal
- Umami credited in Credits page
- Automated test harness for the callout layout algorithm:
  - Vitest unit tests with an independent geometry evaluator (checks overlap, out-of-bounds,
    connector-cross, connector-through-box, origin-obscured)
  - 13 fixtures: 11 handcrafted (including edge cases) + 2 live captures from production
  - 9 viewport presets (desktop FHD, laptop, tablet, phone variants)
  - `scripts/run-layout-tests.mjs` CLI with filtering, JSON report, and Playwright screenshots
  - `scripts/export-callouts.mjs` helper to seed live fixtures from the API
  - `npm run test:layout` alias
- Layout test suite documented in README and Method page

## [0.9.0] - 2026-05-11

Method page and infrastructure hardening.

### Added
- "How it works" Method page explaining the NewsChart pipeline (AI, RSS, geo-tagging, layout algorithm)
- Footer link to the Method page
- CORS policy as a defence-in-depth layer

### Changed
- Java package renamed to `uk.rossarnold.newschart` now that the project has its own domain ([newschart.rossarnold.uk](https://newschart.rossarnold.uk))
- Deploy host moved to a GitHub Actions secret
- Simplified JSON extraction from Gemini model responses

### Fixed
- Prometheus self-scrape port corrected to 9091

## [0.8.1] - 2026-05-10

CI hardening and Vite 8 compatibility fix.

### Fixed
- Pinned Vite back to ^7 — Vite 8 switched to rolldown, causing TS type incompatibility with Vitest 3 and breaking CI builds

### Changed
- Frontend CI now runs `tsc -b` (via `npm run build`) so type errors are caught before the deploy pipeline
- Frontend CI switched from `npm install` to `npm ci` to ensure version resolution matches the deploy pipeline exactly

## [0.8.0] - 2026-05-10

Mobile UX improvements and health monitoring.

### Added
- GitHub Actions health check workflow running every 4 hours

### Changed
- Callout boxes are now fully tappable/clickable (previously only the headline header triggered the detail overlay)
- Mobile layout: callout detail text hidden, headline and country name/flag enlarged for readability on small screens
- Mobile controls (settings toggle, GitHub/Credits links) relocated below the map into a dedicated bar, preventing overlap with callout boxes

## [0.7.1] - 2026-05-10

Dependency maintenance and CI hardening.

### Changed
- Vite upgraded from 7.3.3 to 8.0.11
- Spring AI BOM upgraded from 2.0.0-M5 to 2.0.0-M6
- eslint-plugin-react-hooks upgraded from 5.2.0 to 7.1.1
- jsdom upgraded from 25.0.1 to 29.1.1
- @types/node upgraded from 22.x to 25.6.2
- actions/upload-artifact upgraded from v4 to v7

### Fixed
- ESLint errors introduced by upgraded lint rules

## [0.7.0] - 2026-05-10

Security hardening, credits page polish, and CI improvements.

### Added
- Weekly OWASP dependency check CI workflow
- Post-deploy smoke test verifying DB connectivity; automatic jar rollback on failure
- Frontend rollback on deploy failure (alongside existing jar rollback)

### Changed
- Credits page: expanded entries, improved typography, licence badges, back link, accessibility fixes

### Fixed
- Netty upgraded to 4.2.13.Final to address CVE
- gRPC version override added for CVE-2026-33186

## [0.6.0] - 2026-05-08

Build tooling modernised, test coverage expanded, and monitoring improved.

### Added
- Dependabot configured for Maven, npm, and GitHub Actions dependency updates
- Apple touch icon and corrected PWA manifest icons
- Integration tests: CalloutService (Testcontainers), NytRssParserService, TopCountryHighlighter

### Changed
- Frontend build migrated from Create React App to Vite; test runner migrated from react-scripts to Vitest
- AI prompt updated to apply editorial judgment and actively counter regional or media bias
- Grafana dashboard: split AI metrics section by provider; fix avg/max latency display; add time-range labels to panel titles
- README fully rewritten with accurate architecture overview and tech stack
- Backend logging improved in NytRssParserService (no functional change)

### Fixed
- d3-color ReDoS vulnerability (CVE) resolved via dependency override
- Several low/moderate npm audit advisories resolved

## [0.5.1] - 2026-05-07

### Fixed
- **Backend**: LLM response parsing hardened by introducing a minimal `LlmCallout` DTO containing only the fields the model should populate. This prevents OpenRouter-backed models from setting fields outside their remit; also applied to the Gemini path as a precaution.

## [0.5.0] - 2026-05-07

Multiple new news sources, dark map theme, keyboard navigation, and layout improvements.

### Added
- Perplexity and OpenAI (via OpenRouter) as selectable news sources — both support native search, no RSS feed required
- Selected news source persisted across sessions via localStorage
- Keyboard navigation for timeline (left/right arrow keys); disabled when story detail overlay is open

### Changed
- News source order: Gemini → Perplexity → ChatGPT → NYT, with Gemini as default
- Removed Equal Earth projection, leaving only Mercator and Natural Earth
- Map restyled with dark theme and frosted-glass callout boxes
- Callout layout algorithm improved: fewer connector crossings, better angular spread
- NYT RSS service classes renamed for consistent prefix (backend)
- NYT RSS ingestion adds retries with backoff on failure (backend)
- Backend migrated to Spring Boot 4 `HttpExchange` API

## [0.4.0] - 2026-04-10

Time travel feature and UI refresh — users can now browse historical news days via a date slider (desktop) or chip strip (mobile), with a restyled map interface.

### Added
- Time travel date slider to browse historical news days (desktop + mobile)
- Available days API endpoint (`/api/news/availableDays`)
- NewsChart Key Metrics Grafana dashboard
- Frontend API response caching for faster source switching

### Changed
- UI restyled: sepia-toned callouts for historical dates, violet controls, blue map country highlights
- Removed equirectangular projection option (layout compatibility issues)
- Prometheus container moved to port 9091 to avoid default port conflict in Docker
- Datasource UIDs stripped from Grafana dashboards for prod portability

### Fixed
- Callout layout for tightly-clustered projections

## [0.3.0] - 2026-04-08

Observability and monitoring infrastructure added to the production stack.

### Added
- Spring Boot Actuator and Micrometer Prometheus registry for JVM metrics exposure
- Docker Compose monitoring profile with Prometheus, Grafana, and node-exporter (opt-in via `--profile monitoring`)
- Grafana dashboard provisioning: JVM Micrometer dashboard pre-wired with Prometheus datasource
- `grafana-watcher` sidecar for dashboard-as-code workflow — polls Grafana API and exports changes as JSON
- GitHub Actions workflow to push production-tagged Grafana dashboards to live server via Tailscale

### Changed
- Verbose log statements in Gemini and NYT RSS services downgraded from INFO to DEBUG
- CI workflows scoped to branch pushes only, preventing duplicate runs on tag pushes
- Improved README with project description and tech stack overview

## [0.2.0] - 2026-04-07

Internal deployment — running on production server (not yet publicly accessible) with daily automated news updates.

### Added
- Daily background scheduler for automatic news fetching
- Manual trigger option for deploy-to-live workflow

### Changed
- Jar version now set from git tag in deploy workflow
- MongoDB URI picked up automatically from environment variable

### Fixed
- Unused BOX_HEIGHT constant removed from layout utilities

## [0.1.0] - 2026-04-06

Initial release of NewsChart — an interactive world map that displays top news stories as geo-tagged callouts.

### Added
- Full-stack application with Java Spring Boot backend and React TypeScript frontend
- News ingestion pipeline processing New York Times RSS feeds
- AI-powered news summaries and geo-tagging via Google Gemini integration (Spring AI)
- Interactive world map using react-simple-maps with four selectable projections
- Exhaustive candidate enumeration layout algorithm for optimal callout placement (PFLP-based)
- Story detail overlay for expanded reading
- Country highlighting with flags on active news countries
- Multiple news source support (NYT RSS, Gemini AI-generated)
- MongoDB persistence with daily deduplication
- Background scheduler for automated news fetching
- Simple caching at service level
- Playwright screenshot test framework for layout validation
- GitHub Actions CI for backend and frontend
- Tag-triggered deploy-to-live workflow
- OWASP dependency vulnerability scanning
