# CLAUDE.md

## Project Overview

NewsChart displays top world news stories on an interactive world map. It's a full-stack application with a Java Spring Boot backend and React frontend.

**At the start of a new session**, propose starting the backend and frontend services if they're not already running.

## First-Time Setup

After cloning, run once to install git hooks:
```bash
./setup.sh
```

## Build & Run Commands

### Backend (Spring Boot)
```bash
./mvnw spring-boot:run
./mvnw test
./mvnw test -Dtest=ClassName#methodName
```

### Frontend (React)
```bash
npm start        # dev server, proxies to localhost:8080
BACKEND=https://newschart.rossarnold.uk npm start  # proxy to live backend instead
CI=true npm test
npm run build
```

## Architecture

### Backend Structure
The backend uses a pipeline-based architecture for processing news:

1. **Controllers** (`api/`) - REST API at `/api/news`: `calloutsForDay/{date}`, `availableDays`, `statsAllCallouts` (heatmap aggregation), `sampleCallouts`
2. **News ingestion** (`news/`) - RSS storage and processing: `source/` (NYT RSS), `highlights/` (processed highlights), `pipeline/` (modular pipeline with base + NYT, Gemini, and OpenRouter orchestrators)
3. **Callouts** (`callout/`) - Story callout domain: entity, repo, service
4. **Schedulers** (`scheduler/`) - Background task scheduling
5. **AI Integration** (`ai/`) - Google Gemini API via `GeminiGatewayService`
6. **Geo** (`geo/`) - Country entity and factory

### Frontend Structure
React SPA using d3-geo + topojson-client for world map visualization:

- **MapChart** - Main map component; drives two view modes: day view (Mercator projection with callouts) and heatmap (choropleth colouring by story count)
- **StoryCalloutList** - Renders callout boxes with connectors to country points

**Layout Algorithm** (`utils/mapCalloutUtils.ts`):
Exhaustive candidate enumeration - generates up to 96 candidate positions per callout (16 directions × 6 distances, filtered by bounds/origin-obscuring), evaluates every combination, and picks the lowest-penalty layout. Feasible because N≤4. Based on PFLP (Point-Feature Label Placement) literature.

**Layout Algorithm Success Criteria:** Callouts must not overlap or touch, must stay fully in-viewport, connectors must not cross each other or pass behind other callout boxes, minimize connector length and distance to origin, origin markers must not be obscured by callout boxes.

### Data Flow
**Day view:** Scheduler → pipeline orchestrator → news source (NYT RSS or Gemini AI) → parse/summarize/geo-tag → MongoDB `StoryCallout` → `calloutsForDay` API → frontend map layout.

**Heatmap view:** MongoDB aggregation → `statsAllCallouts` API → frontend choropleth (story count per country, inferno colour scale).

### Layout Algorithm Test Harness

Fixtures live in `frontend/src/__tests__/layout/fixtures/*.json`. Fixtures tagged `needs-fix` are skipped in CI (`layout.test.ts` uses `test.skip` for them).

**Run layout tests (no screenshots, fast):**
```bash
node scripts/run-layout-tests.mjs                        # all fixtures
node scripts/run-layout-tests.mjs --tag needs-fix        # only skipped/failing fixtures
node scripts/run-layout-tests.mjs --id <fixture-id>      # one fixture
```

**Run with screenshots** (builds frontend, spins up preview server automatically — no services needed):
```bash
node scripts/run-layout-tests.mjs --tag needs-fix --screenshots --failures-only
```
`--failures-only` limits screenshots to failing viewport/projection combos; output lands in `frontend/test-output/screenshots/`. Filter with `--viewport <name>` or `--projection mercator|natural-earth`.

**Add a new fixture:** drop a `.json` file in `frontend/src/__tests__/layout/fixtures/`. Tag it `needs-fix` if the algorithm currently fails it. The `TestMapPage` at `/__layout-test?case=<id>&strip=1&projection=<name>` renders any fixture in-browser without the backend.

## Key Technologies
- **Backend**: Spring Boot 4.0.x, Java 21, MongoDB, WebFlux
- **Frontend**: React 18, d3-geo, topojson-client
- **Testing**: Testcontainers (MongoDB), Vitest, React Testing Library, Playwright
- **AI**: Google Gemini API (gemini-2.5-flash-lite model)

## Environment Variables
- Gemini API key configured in application properties

## Analytics
- Umami tracking is wired via `track(eventName, properties)` in `frontend/src/utils/analytics.ts`
- **Proactively propose tracking** for any new or changed frontend interactions before committing — suggest event names and properties, confirm with user before adding

## Sitemap
- Sitemap lives at `frontend/public/sitemap.xml`
- **When a new page is added, remind the user to update the sitemap** before committing

## Accessibility Testing
- Playwright axe tests live in `frontend/src/__tests__/a11y/`: `map.a11y.spec.ts` (main map + modals), `static-pages.a11y.spec.ts` (/method and /credits)
- Component-level axe tests (vitest-axe) live alongside each component as `*.a11y.test.tsx`
- **Proactively propose updating accessibility tests** when new UI elements, pages, modals, or interactive states are introduced — suggest which test file needs a new test case and what state to exercise

## Dependency Management
- **Version selection**: When adding or migrating dependencies, verify the current stable latest version via `npm info <pkg> dist-tags` before selecting a version range. For major-version decisions (e.g. whether `^3` or `^4` is appropriate), also check peer dependency compatibility with other packages in the project via `npm info <pkg> peerDependencies`.

## Claude Assistance
- For the frontend it's likely Claude will be producing/updating code
- For the backend, Claude is likely to be giving review/advice only, so don't offer to make edits
- When completing work that satisfies an item in `MVP-GOLIVE.md`, proactively confirm with user if OK to check it off - and check it off (change `- [ ]` to `- [x]`) after user's testing/confirmation
- **Release commits**: When committing a CHANGELOG entry for a version release, use a descriptive message in the form `Release vX.Y.Z: <summary line from changelog>` (e.g. `Release v0.8.0: Mobile UX improvements and health monitoring`), not a generic `chore:` prefix
