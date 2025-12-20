# Changelog

All notable changes to Knutpunkt will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.0] - 2025-12-20

### Added
- Initial Kanban board with drag-and-drop task management
- File-based task storage with Markdown files and YAML frontmatter
- REST API with full CRUD operations for tasks
- Real-time updates via Server-Sent Events (SSE)
  - Task-level events (semantic operations)
  - File-level events (filesystem changes)
- React frontend with ShadCN UI components
- Task filtering by status, assignee, category, and priority
- Task ordering within columns
- Backend terminal support (optional)
- Settings API endpoint
- Version API endpoint at `/api/v1/version` with build metadata
- GitHub Actions CI/CD workflows for testing and releases
- Automated release preparation script (`scripts/release.sh`)
- Dynamic version extraction in Makefile and start.sh
- Comprehensive OpenAPI specification
- Full test coverage for frontend and backend

### Technical Details
- Backend: Kotlin + Ktor 3.0.3 with Netty
- Frontend: React 19 + Vite + TypeScript
- UI: ShadCN components with Tailwind CSS
- State management: TanStack Query + Zustand
- Build: Gradle with shadow JAR packaging
- JAR manifest includes build metadata (version, timestamp, git commit)
- Deployment: Single JAR with embedded static frontend

[Unreleased]: https://github.com/karlll/knutpunkt/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/karlll/knutpunkt/releases/tag/v0.9.0
