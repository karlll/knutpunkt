# Knutpunkt - Kanban Task Board Project

## Project Overview

A full-stack Kanban board application for task management with three components:

1. **Frontend** - Browser-based Kanban board visualization
2. **API Specification** - OpenAPI contract between frontend and backend
3. **Backend** - REST API server with file-based persistence

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    Frontend     │  HTTP   │     Backend     │  I/O    │   File System   │
│  React + Vite   │◄───────►│  Kotlin + Ktor  │◄───────►│   tasks/*.md    │
│    ShadCN UI    │   JSON  │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Project Structure

```
knutpunkt/
├── CLAUDE.md                    # This file
├── api/
│   └── openapi.yaml             # OpenAPI 3.0 specification
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── components.json          # ShadCN configuration
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ui/              # ShadCN components
│   │   │   └── kanban/          # Kanban-specific components
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   └── api.ts           # API client (generated)
│   │   └── types/
│   │       └── task.ts
│   └── index.html
├── backend/
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── gradle.properties
│   └── src/
│       └── main/
│           └── kotlin/
│               └── com/ninjacontrol/knutpunkt/
│                   ├── Application.kt
│                   ├── routes/
│                   │   └── TaskRoutes.kt
│                   ├── models/
│                   │   └── Task.kt
│                   ├── services/
│                   │   └── TaskService.kt
│                   └── plugins/
│                       ├── Routing.kt
│                       ├── Serialization.kt
│                       └── CORS.kt
└── tasks/                       # Task storage (file-based database)
    ├── planned/
    │   └── example-task.md
    ├── ongoing/
    │   └── another-task.md
    └── done/
        └── completed-task.md
```

---

## Component Specifications

### 1. Task File Format

Tasks are stored as Markdown files with YAML front matter.

**File naming convention:** `<slug>.md` where slug is a URL-safe, lowercase, hyphenated version of the task name.

**File structure:**
```markdown
---
id: "uuid-v4-string"
title: "Human readable task title"
createdAt: "2025-01-15T10:30:00Z"
updatedAt: "2025-01-15T14:22:00Z"
assignees:
  - "alice"
  - "bob"
categories:
  - "feature"
  - "frontend"
---

## Description

Task description goes here in Markdown format.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Notes

Any additional notes...
```

**Status determination:** The task's status is determined by its directory location:
- `tasks/planned/` → Status: `planned`
- `tasks/ongoing/` → Status: `ongoing`
- `tasks/done/` → Status: `done`

---

### 2. API Specification (OpenAPI)

Location: `api/openapi.yaml`

**Base URL:** `http://localhost:8080/api/v1`

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks` | List all tasks (optional query params for filtering) |
| GET | `/tasks/{id}` | Get a specific task by ID |
| POST | `/tasks` | Create a new task |
| PUT | `/tasks/{id}` | Update a task (including status changes) |
| DELETE | `/tasks/{id}` | Delete a task |
| PATCH | `/tasks/{id}/status` | Move task to different status/column |

**Task JSON Schema:**
```json
{
  "id": "string (UUID)",
  "title": "string",
  "description": "string (Markdown)",
  "status": "planned | ongoing | done",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)",
  "assignees": ["string"],
  "categories": ["string"],
  "priority": "low | medium | high"
}
```

**Query Parameters for GET /tasks:**
- `status` - Filter by status
- `assignee` - Filter by assignee
- `category` - Filter by category
- `priority` - Filter by priority

---

### 3. Frontend Specification

**Technology Stack:**
- TypeScript 5.x
- Vite (latest)
- React 19.x
- ShadCN UI components
- Tailwind CSS
- TanStack Query (React Query) for data fetching
- Vitest for testing
- MSW for API mocking during development
- StoryBook for component development

**Key Components:**

```
src/components/
├── ui/                          # ShadCN base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   └── ...
└── kanban/
    ├── KanbanBoard.tsx          # Main board container
    ├── KanbanColumn.tsx         # Individual column (planned/ongoing/done)
    ├── TaskCard.tsx             # Draggable task card
    ├── TaskDialog.tsx           # Create/Edit task dialog
    ├── TaskFilters.tsx          # Filter controls
    └── AssigneeBadge.tsx        # Assignee display component
```

**State Management:**
- Use TanStack Query for server state
- Use React Context or Zustand for UI state (drag operations, dialogs)

**Drag and Drop:**
- Implement using `@dnd-kit/core` and `@dnd-kit/sortable`
- When a task is dropped in a different column, call PATCH `/tasks/{id}/status`

**ShadCN Kanban Reference:**
- Reference implementation: https://www.shadcn.io/components/data/kanban
- Adapt the component structure to work with our API

---

### 4. Backend Specification

Tech Stack:

     - Kotlin 2.0.21 + Gradle (Kotlin DSL)
     - Ktor 3.0.3 (Netty server, JSON serialization, CORS, SSE, status pages, call logging)
     - kotlinx.serialization for JSON
     - kaml 0.55.0 for YAML front matter parsing
     - commonmark 0.21.0 for Markdown
     - JUnit 5 for testing
     - Java 17 toolchain

Main Components:

     - Application.kt - Entry point, Netty embedded server on port 8080
     - models/Models.kt - Data models: Task, TaskCreate, TaskUpdate, TaskStatus/Priority enums
     - services/TaskService.kt - Core logic: file I/O, YAML parsing, CRUD operations, optional in-memory cache
     - services/StateService.kt - Task number generation
     - services/FileWatchService.kt - File system monitoring for external changes
     - routes/TaskRoutes.kt - REST endpoints under /api/v1
     - plugins/ - CORS, routing, serialization, error handling, static content (SPA)
     - utils/ - MarkdownParser (YAML frontmatter), SlugGenerator (filename generation)

   API Endpoints: /api/v1/tasks (GET/POST), /api/v1/tasks/{id} (GET/PUT/DELETE), /api/v1/tasks/{id}/status (PATCH), /api/v1/tasks/{id}/order (PATCH)

   Storage: File-based in tasks/{planned,ongoing,done}/*.md with YAML frontmatter + Markdown body

   Commands:

     - Build: ./gradlew build
     - Run dev: ./gradlew run
     - Test: ./gradlew test
     - Fat JAR: ./gradlew shadowJar
     - Custom tasks dir: pass as CLI arg or set TASKS_DIRECTORY env var

Key Features: In-memory caching (optional), file watching, order management, slug-based filenames, comprehensive error handling (404/400/409/500)

---

## Development Guidelines

### General Practices

- Write clean, maintainable code
- Write tests for critical functionality
- Use the directory `<project-root>/notes` for development notes and ideas
- Divide work into small, manageable tasks that are can be committed to git independently

### Code Style

**TypeScript/React:**
- Use functional components with hooks
- Prefer named exports
- Use TypeScript strict mode
- Follow React Query patterns for data fetching
- Use Tailwind CSS for styling (via ShadCN)

**Kotlin:**
- Follow Kotlin coding conventions
- Use data classes for models
- Use sealed classes for result types
- Prefer immutability
- Use coroutines for async operations

### Git Workflow

- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Keep commits atomic and focused
- Write meaningful commit messages

### Testing

**Frontend:**
- Unit tests with Vitest
- Component tests with Testing Library
- E2E tests with Playwright (optional)

**Backend:**
- Unit tests for TaskService
- Integration tests for API routes
- Use Ktor's test framework

---

## Development Commands

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Initialize ShadCN
npx shadcn-ui@latest init

# Add ShadCN components
npx shadcn-ui@latest add button card dialog input badge

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Backend

```bash
cd backend

# Build
./gradlew build

# Run development server
./gradlew run

# Run tests
./gradlew test

# Create fat JAR
./gradlew shadowJar
```

---

## API-First Development

1. **Start with the OpenAPI spec** - Define all endpoints, request/response schemas
2. **Generate types** - Use openapi-typescript for frontend types
3. **Implement backend** - Follow the spec exactly
4. **Implement frontend** - Use generated types for type safety

---

## Environment Configuration

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### Backend (application.conf or environment variables)
```
TASKS_DIRECTORY=../tasks
SERVER_PORT=8080
```

---

## Common Tasks

### Adding a new field to tasks

1. Update the OpenAPI spec (`api/openapi.yaml`)
2. Update the TypeScript types (`frontend/src/types/task.ts`)
3. Update the Kotlin data class (`backend/src/main/kotlin/.../models/Task.kt`)
4. Update the YAML front matter parsing in TaskService
5. Update the UI components as needed
6. Update tests

### Changing the task file structure

1. Update the file format documentation in this file
2. Update the TaskService parsing/writing logic
3. Write a migration script if needed for existing tasks

---

## Troubleshooting

### CORS Issues
Ensure the backend CORS plugin allows the frontend origin:
```kotlin
install(CORS) {
    allowHost("localhost:5173")  // Vite dev server
    allowHeader(HttpHeaders.ContentType)
    allowMethod(HttpMethod.Put)
    allowMethod(HttpMethod.Delete)
    allowMethod(HttpMethod.Patch)
}
```

### File Permission Issues
Ensure the backend process has read/write permissions to the `tasks/` directory.

### Hot Reload
- Frontend: Vite provides HMR out of the box
- Backend: Use `./gradlew run --continuous` or the Ktor development mode

---

## References

- [ShadCN Kanban Component](https://www.shadcn.io/components/data/kanban)
- [Ktor Documentation](https://ktor.io/docs/)
- [TanStack Query](https://tanstack.com/query/latest)
- [dnd-kit](https://dndkit.com/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
