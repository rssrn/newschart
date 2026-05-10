# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
