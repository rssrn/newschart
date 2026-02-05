# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NewsChart displays top world news stories on an interactive world map. It's a full-stack application with a Java Spring Boot backend and React frontend.

**At the start of a new session**, propose starting the backend and frontend services if they're not already running.

## Build & Run Commands

### Backend (Spring Boot)
```bash
# Build and run
./mvnw spring-boot:run

# Run tests (uses Testcontainers for MongoDB)
./mvnw test

# Run a single test class
./mvnw test -Dtest=ClassName

# Run a single test method
./mvnw test -Dtest=ClassName#methodName

# OWASP dependency vulnerability check
./mvnw org.owasp:dependency-check-maven:check
```

### Frontend (React)
```bash
cd frontend

# Install dependencies
npm install

# Start development server (proxies to localhost:8080)
npm start

# Run tests
npm test

# Run tests once (non-interactive)
CI=true npm test

# Production build
npm run build
```

### Screenshot Tests (Playwright)
```bash
cd tools
npm install
node screenshot-tests.js  # Requires both backend and frontend running
```

## Architecture

### Backend Structure
The backend uses a pipeline-based architecture for processing news:

1. **Controllers** (`controller/`) - REST API at `/api/news`
   - `GET /api/news/calloutsForDay/{date}` - Get news callouts for a specific date
   - `GET /api/news/sampleCallouts` - Get sample callout data

2. **Pipeline Processing** (`pipeline/`) - Modular news processing
   - `BasePipelineOrchestrator` - Abstract base for pipeline execution
   - `NYTPipelineOrchestrator` - Processes New York Times RSS feeds
   - `GeminiNewsPipelineOrchestrator` - Processes AI-generated news summaries
   - `PipelineStep` interface - Each step implements `execute(PipelineContext)`

3. **Schedulers** (`scheduler/`) - Background task scheduling
   - Triggers pipeline runs on configured intervals

4. **AI Integration** (`ai/`) - Google Gemini API
   - `GeminiGatewayService` - Summarizes news into structured story outlines

5. **Repositories** - MongoDB data access
   - `callout_repository/` - Story callouts with geographic data
   - `news_repository/` - Raw RSS feed storage
   - `news_highlights_repository/` - Processed highlights

### Frontend Structure
React SPA using react-simple-maps for world map visualization:

- **MapChart** - Main map component using Mercator projection
- **StoryCalloutList** - Renders callout boxes with connectors to country points

**Layout Algorithms** (`utils/mapCalloutUtils.js`):
- `force` (default) - D3.js force simulation with collision detection
- `rails` - Places callouts on left/right edges based on hemisphere
- `compass` - Cardinal directions, starting NW and rotating clockwise
- `four-winds` - Assigns 4 extreme points to diagonal directions
- `exhaustive` - Generates candidate positions per callout and evaluates every combination to find the optimal layout (feasible because N≤4)

Select via URL parameter: `?layout=force|rails|compass|four-winds|exhaustive`

**Layout Algorithm Research & Plan:** See [callout layout research plan](file://.claude/plans/fancy-imagining-quasar.md) for analysis of PFLP (Point-Feature Label Placement) approaches and recommended next algorithm (exhaustive candidate enumeration).

**Layout Algorithm Success Criteria:**
1. Callout boxes must not overlap or touch each other
2. Callout boxes must maintain minimum spacing between them
3. Callout boxes must be entirely within the viewport (no clipping at edges)
4. Connectors must not cross each other
5. Connectors must not cross behind or in front of other callout boxes
6. Connectors should be reasonably short to maintain clear geographic association
7. Callouts should be positioned near their origin point when possible
8. Origin points (subject markers) must not be obscured by callout boxes

Test scenarios are defined in `CalloutController.sampleCallouts()` including clustered points (us-cluster, asian-cluster), wide spreads, and edge cases.

### Data Flow
1. Scheduler triggers pipeline orchestrator
2. Pipeline fetches from news sources (NYT RSS or Gemini AI)
3. News is parsed, summarized, and geo-tagged
4. Results stored in MongoDB as `StoryCallout` documents
5. Frontend fetches callouts via REST API
6. Map displays callouts positioned using selected layout algorithm

## Key Technologies
- **Backend**: Spring Boot 4.0.x, Java 21, MongoDB, WebFlux
- **Frontend**: React 18, react-simple-maps, d3-force
- **Testing**: Testcontainers (MongoDB), React Testing Library, Playwright
- **AI**: Google Gemini API (gemini-2.5-flash-lite model)

## Environment Variables
- `NVD_API_KEY` - For OWASP NVD vulnerability database
- `OSS_INDEX_USERNAME` / `OSS_INDEX_PASSWORD` - For OSS Index scanning
- Gemini API key configured in application properties
