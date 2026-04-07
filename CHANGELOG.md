# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
