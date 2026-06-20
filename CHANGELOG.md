# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.21.0] - 2026-06-20

Claude and Grok in the frontend; consensus view polish and deploy infrastructure.

### Added
- **Claude and Grok sources in frontend** — Anthropic Claude and xAI Grok now appear as source badges and highlights in the consensus view
- **Maintenance page on 502/503** — users see a friendly maintenance page during backend restarts rather than a raw error
- **Single-source chip skips event inspector** — clicking a single-source consensus chip goes directly to the story detail modal

### Fixed
- **Story detail meta label contrast** — improved contrast to meet WCAG AA
- **Event inspector source labels** — short names used (e.g. "Gemini", "Claude", "NYT") instead of full names
- **MongoDB database name** — corrected to `newschart-prod` in production

### CI
- Switched deploy from JAR + systemd to Docker Compose on Hetzner via Tailscale
- Added `skip_build` input to deploy workflow for manual redeploys without rebuild

## [0.20.1] - 2026-06-19

Docker image and local compose setup.

### Added
- **Dockerfile** — multi-stage build bundling frontend into Spring Boot JAR
- **GitHub Actions docker-publish workflow** — publishes to `ghcr.io` on version tags
- **docker-compose `app` profile** — `docker compose --profile app up` runs the full stack locally

### Fixed
- **SPA routing** — `PathResourceResolver` fallback serves `index.html` for non-API routes when running from JAR
- **`SourceBadge` unknown-source guard** — renders empty rather than crashing on unrecognised source values

## [0.20.0] - 2026-06-19

Claude and Grok news sources enabled (backend only); consensus display hardened against unknown sources.

### Added
- **Claude and Grok news sources** — backend now ingests from Claude (Anthropic) and Grok (xAI) in addition to existing sources; no frontend changes required

### Fixed
- **Consensus display: unknown-source guard** — `pickDisplayCallout` prefers known sources over unknown in its fallback; `SOURCE_META` accesses in `StoryCalloutList` aria labels use optional chaining to avoid runtime errors when a new source arrives before a frontend release

### Security
- `undici` updated to address a vulnerability flagged by npm audit

## [0.19.0] - 2026-06-18

Consensus view polish — interaction refinements and visual consistency (#52 CP7).

### Added
- **Date in Event Inspector modal header** — the selected day is shown in the modal header alongside the story title
- **Date in brand badge** — the currently selected date is displayed in the header brand badge
- **Click affordance on callouts and chips** — cursor and hover styles make clickable elements discoverable; callout box render path unified

### Changed
- **Desktop source selector sections** — controls grouped into labelled sections (View / Highlight / Map) for clarity
- **Consensus view colour scheme** — reverted to blue, matching the by-source view for visual consistency
- **Chip colour tracks callout expand state** — chip accent colour updates when its associated callout is expanded
- **CSS colours abstracted to custom properties** — all colour values centralised in `:root` for maintainability

## [0.18.0] - 2026-06-17

Consensus view — see how multiple news sources cover the same story.

### Added
- **Consensus view** — new map mode showing stories reported across multiple sources; callouts display source badges (filled = present, grey = omitted) with a consensus score ranking (#52 CP2)
- **Tiered consensus layout** — single-source exclusives shown as chips to complement consensus callouts; single-story country markers treated as obstacles to prevent overlap (#52 CP3)
- **Brand icons in consensus callouts** — source letter badges replaced with recognisable brand icons (#52 CP4)
- **Event Inspector modal** — click a consensus callout or chip to see per-source headlines for that story (#52 CP5)
- **Consensus context banner** — highlight-active cue and high-divergence framing shown when a source highlight is active (#52 CP6)
- **Absent-source handling** — sources not present on the selected day show a disabled highlight radio with a date tooltip; highlight auto-resets (#52 CP6)
- **`BACKEND` env var** — override dev server proxy target for local development against the live backend

### Changed
- **Method page** — new consensus-view subsection explaining multi-source grouping and ranking
- **Country name shortening** — long country names (e.g. "Democratic Republic of the Congo") shortened in callout box titles and markers

### Fixed
- Lint errors (unused imports, effect setState, stale dependencies)

### Security
- `@babel/core` updated to 7.29.6+ to address GHSA-4x5r-pxfx-6jf8 (#56)
- OWASP dep-check fail threshold raised from 7 to 9

### CI / Test
- a11y suite always builds fresh (`reuseExistingServer=false`)
- a11y tests split: map tests always run; static-page tests only when relevant files change
- Pre-push hook optimised: `vitest --changed` and conditional a11y
- CI preflight waits for pending checks instead of failing immediately; excludes own check run

## [0.17.0] - 2026-06-16

Map engine replacement, heatmap resilience, performance improvements, and API groundwork for the consensus view.

### Added
- **Heatmap error state** — the heatmap view now surfaces an error message when the `statsAllCallouts` fetch fails, instead of silently showing an empty map (#51)
- **HeatmapCountryModal: error state and retry** — the modal shows an error with a retry button if its callout fetch fails (#49)
- **API: source-optional callouts** — `calloutsForDay` and `availableDays` now accept an optional `source` filter; omitting it returns data across all sources. Backwards-compatible with existing usage. Groundwork for consensus view (#52)
- **CI: daily release-due check** — automated daily workflow flags when unreleased changes have been pending too long
- **CI: gate preflight on deploy** — deploy workflow now validates CI status before proceeding

### Changed
- **Map engine: react-simple-maps → d3-geo + topojson-client** — replaces the react-simple-maps wrapper with direct use of d3-geo and topojson-client; removes one dependency layer and gives full control over projection and rendering
- **Bundled world topology** — `countries-110m.json` is now served locally, eliminating the jsDelivr CDN dependency (#53)
- **Resilience: story summary retries** — Gemini gateway and OpenRouter gateway both now retry on transient failure during story summarisation and callout fetch
- **Deploy workflow hardened** — step timeouts and backup verification added; smoke test expanded to verify the frontend response, not just one API endpoint
- **Method page** — NYT country selection logic described in detail; specific AI model version removed from docs
- **Credits page** — OpenRouter moved to the Backend section; Cloudflare added; license attributions corrected (npm audit → Artistic 2.0, NYT RSS link, ISC badge color)

### Performance
- **Map code splitting** — map bundle split into a separate chunk; CDN fonts preconnected; `font-display: optional` applied to reduce render-blocking
- **Lazy-loaded static pages** — Credits, Method, and Accessibility pages are now lazy-loaded; favicon reduced 257 KB → 15 KB

### Accessibility
- `<main>` landmark elements replace `<div>` wrappers across all pages

### Fixed
- Day-view country highlights no longer appear during heatmap error/loading state

### Security
- Micrometer version pinned to address CVE-2026-40983

### Build
- Vite 8.0.14 → 8.0.16, Vitest 4.1.7 → 4.1.8
- CI: link-check exclusions for vitest.dev and eslint.org (connection resets)
- CI: fall back to latest `v*` git tag when no GitHub Release exists

## [0.16.0] - 2026-06-05

Resilience improvements: Gemini retries with backoff, frontend auto-recovery on backend outage, and a new Grafana retry exhaustion panel.

### Added
- **Gemini API retries** — transient failures (network blips, brief service interruption) are retried at 30s and 90s before giving up
- **Frontend auto-recovery** — the app now recovers automatically when the backend becomes available after an error, without requiring a manual page reload
- **Grafana: retry exhaustion panel** — key-metrics dashboard now tracks when all Gemini retries are exhausted
- **CI: `workflow_dispatch` trigger** — backend and frontend CI workflows can now be triggered manually from the GitHub UI

### Changed
- Dependabot version update frequency reduced to monthly (less noise)
- Pre-push hook now gates on backend tests passing before allowing pushes
- lychee link-check CI: retries increased and wait-time added to reduce flaky failures

### Performance
- `logo192.png` replaced with `logo48.webp` — reduces image weight by 97% (22 KB → 0.7 KB) with negligible visual difference at 48×48

### Fixed
- Redirected links in Credits and Method pages updated
- CI test output noise cleaned up
- Broken test: `MeterRegistry` bean missing from test context

### Build
- `actions/cache` bumped from v4 to v5
- Vite 8.0.13 → 8.0.14, Vitest 4.1.6 → 4.1.7, ESLint 9.39.4 → 10.4.1, `typescript-eslint`, `@types/node`, `react`/`@types/react` dependency bumps

## [0.15.1] - 2026-05-22

CI link-checking, broken link fixes, and sitemap update.

### Added
- **Link-check CI** — post-deploy workflow scans the live site for broken links via lychee; weekly workflow scans frontend source files. Bot-blocking domains are excluded. Both run on `workflow_dispatch` for manual triggering. Lychee credited on the Credits page.

### Fixed
- Broken credits link in README now points to the live site
- vitest-axe GitHub link updated to current repo owner (chaance)

### Docs
- `/accessibility` added to sitemap

## [0.15.0] - 2026-05-21

Accessibility statement, shared header/footer on static pages, and observability improvements.

### Added
- **Accessibility statement page** (`/accessibility`) — WCAG commitment, what's been done, known limitations, and contact link
- **Shared header and footer** — `/accessibility`, `/credits`, and `/method` now share a consistent header (with nav links) and footer
- **Credits: Security section** — acknowledges OWASP dependency-check, npm audit, and Dependabot
- **Metrics dashboard** — error/warning log panels added to key metrics dashboard

### Fixed
- Contrast ratios on Accessibility page corrected to meet WCAG AA
- `<header>` replaced with `<div>` in static page content sections (a11y fix)
- Credits page now responsive on mobile
- Backend: paged callout response wrapped in `PageResponse` (fixes log warning)

### Build
- Autoprefixer added — CSS vendor prefixes are now generated automatically, which is more robust than relying on manual declaration ordering

### Tests
- Playwright axe coverage extended to static pages, modals, and mobile sheet; two WCAG violations fixed

## [0.14.3] - 2026-05-21

Mobile map rendering fix (production build).

### Fixed
- The 0.14.2 fix worked in dev but not in the production bundle: the CSS minifier dropped the unprefixed `backdrop-filter`, keeping only `-webkit-backdrop-filter`, which Android Chrome ignores — so the map corruption persisted on affected devices. Reordered all `backdrop-filter` declarations (prefixed first, standard last) so the minifier preserves both. Verified against the production build on-device.

## [0.14.2] - 2026-05-21

Mobile map rendering fix.

### Fixed
- Restore mobile map rendering on affected GPUs. The callout box's `backdrop-filter` was incidentally forcing the SVG `<foreignObject>` compositing path that some mobile GPUs require; its removal in 0.14.1 caused full-map rasterization corruption on those devices (e.g. Samsung/Android Chrome). Re-added the filter while keeping the opaque background, so the 0.14.1 connector bleed-through fix is preserved.

## [0.14.1] - 2026-05-19

Callout rendering fix.

### Fixed
- Callout boxes are now fully opaque, hiding connector-tail bleed-through behind the box

## [0.14.0] - 2026-05-19

Mobile completeness and backend cost fix.

### Added
- **Mobile Story List** — scrollable story list below the date strip in Day View; tap any story to open the detail modal
- **Mobile Coverage List** — top 20 countries by story count in Coverage Map view; tap to open the country drill-down modal as a bottom sheet
- **Contact footer link** — opens a modal with GitHub Issues (primary) and LinkedIn links on both desktop and mobile
- Mobile pill now shows story count and date range (mirrors desktop legend)

### Changed
- Mobile nav links moved to a fixed footer; controls bar simplified to source/view pill only

### Fixed
- Backend now skips re-fetching today's news if callouts already exist — prevents redundant AI API calls on app restart or redeployment

### CI
- OWASP NVD dependency-check data cached between runs (faster CI)
- OWASP scan rescheduled to Wednesday 02:00 UTC
- OSS Index migrated to Sonatype Guide API

### Security
- Tomcat bumped/pinned to patch CVE-2026-41293, CVE-2026-43512, CVE-2026-43515

## [0.13.0] - 2026-05-18

Mobile navigation redesign and SEO groundwork.

### Added
- **Mobile navigation**: brand moves to a top banner; hamburger in the banner opens the settings panel
- `robots.txt` and `sitemap.xml` for search engine indexing

### Changed
- UI strings centralised in `constants.ts` to prevent label drift between components

### Fixed
- Mobile status pill label corrected to "Coverage Map" (was "Story Counts")
- Heatmap legend pill now shows the short source name instead of the full name

### Build
- Vite upgraded to ^8, Vitest to ^4
- Dev dependency bumps: `@types/node`, `@vitejs/plugin-react-swc`, `@testing-library/react`, `eslint-plugin-react-refresh`

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
