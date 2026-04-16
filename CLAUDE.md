# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NewsChart displays top world news stories on an interactive world map. It's a full-stack application with a Java Spring Boot backend and React frontend.

**At the start of a new session**, propose starting the backend and frontend services if they're not already running.

## Build & Run Commands

### Backend (Spring Boot)
```bash
./mvnw spring-boot:run
./mvnw test
./mvnw test -Dtest=ClassName#methodName
```

### Frontend (React)
```bash
npm install
npm start        # dev server, proxies to localhost:8080
CI=true npm test
npm run build
```

## Architecture

### Backend Structure
The backend uses a pipeline-based architecture for processing news:

1. **Controllers** (`api/`) - REST API at `/api/news`
2. **News ingestion** (`news/`) - RSS storage and processing: `source/` (NYT RSS), `highlights/` (processed highlights), `pipeline/` (modular pipeline with `BasePipelineOrchestrator`, `NYTPipelineOrchestrator`, `GeminiNewsPipelineOrchestrator`)
3. **Callouts** (`callout/`) - Story callout domain: entity, repo, service
4. **Schedulers** (`scheduler/`) - Background task scheduling
5. **AI Integration** (`ai/`) - Google Gemini API via `GeminiGatewayService`
6. **Geo** (`geo/`) - Country entity and factory

### Frontend Structure
React SPA using react-simple-maps for world map visualization:

- **MapChart** - Main map component using Mercator projection
- **StoryCalloutList** - Renders callout boxes with connectors to country points

**Layout Algorithm** (`utils/mapCalloutUtils.ts`):
Exhaustive candidate enumeration - generates ~20-30 candidate positions per callout (8 directions × 5 distances, filtered by bounds/origin-obscuring), evaluates every combination, and picks the lowest-penalty layout. Feasible because N≤4. Based on PFLP (Point-Feature Label Placement) literature.

**Layout Algorithm Success Criteria:** Callouts must not overlap or touch, must stay fully in-viewport, connectors must not cross each other or pass behind other callout boxes, minimize connector length and distance to origin, origin markers must not be obscured by callout boxes.

Test scenarios are defined in `CalloutController.sampleCallouts()` including clustered points (us-cluster, asian-cluster), wide spreads, and edge cases.

### Data Flow
Scheduler → pipeline orchestrator → news source (NYT RSS or Gemini AI) → parse/summarize/geo-tag → MongoDB `StoryCallout` → REST API → frontend map layout.

## Key Technologies
- **Backend**: Spring Boot 4.0.x, Java 21, MongoDB, WebFlux
- **Frontend**: React 18, react-simple-maps
- **Testing**: Testcontainers (MongoDB), React Testing Library, Playwright
- **AI**: Google Gemini API (gemini-2.5-flash-lite model)

## Environment Variables
- `NVD_API_KEY` - For OWASP NVD vulnerability database
- `OSS_INDEX_USERNAME` / `OSS_INDEX_PASSWORD` - For OSS Index scanning
- Gemini API key configured in application properties

## Claude Assistance
- For the frontend it's likely Claude will be producing/updating code
- For the backend, Claude is likely to be giving review/advice only, so don't offer to make edits
- When completing work that satisfies an item in `MVP-GOLIVE.md`, proactively confirm with user if OK to check it off - and check it off (change `- [ ]` to `- [x]`) after user's testing/confirmation
