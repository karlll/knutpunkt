# Knutpunkt Backend

REST API server for the Knutpunkt Kanban board, built with Kotlin and Ktor.

## Tech Stack

- **Kotlin 2.0.21** with Java 17
- **Ktor 3.0.3** - Web framework
- **kotlinx.serialization** - JSON handling
- **kaml** - YAML parsing
- **Netty** - Embedded server

## Features

- File-based task storage (Markdown with YAML front matter)
- REST API conforming to OpenAPI specification
- Real-time updates via Server-Sent Events (SSE)
- File system monitoring for external changes
- Optional WebSocket-based terminal (PTY integration)
- In-memory caching with automatic invalidation

## Project Structure

```
src/main/kotlin/com/ninjacontrol/knutpunkt/
├── Application.kt              # Application entry point
├── models/                     # Data models
│   ├── Models.kt               # Task, TaskCreate, TaskUpdate
│   ├── Settings.kt             # Configuration models
│   └── Terminal.kt             # Terminal session models
├── plugins/                    # Ktor plugins
│   ├── CORS.kt                 # Cross-origin configuration
│   ├── FileWatch.kt            # File monitoring
│   ├── Routing.kt              # Route definitions
│   ├── SSE.kt                  # Server-Sent Events
│   ├── Serialization.kt        # JSON serialization
│   ├── StaticContent.kt        # Frontend serving
│   ├── StatusPages.kt          # Error handling
│   └── WebSockets.kt           # WebSocket support
├── routes/                     # API endpoints
│   ├── EventRoutes.kt          # SSE endpoints
│   ├── SettingsRoutes.kt       # Configuration API
│   ├── TaskRoutes.kt           # Task CRUD operations
│   ├── TerminalRoutes.kt       # Terminal WebSocket
│   └── VersionRoutes.kt        # Version information
├── services/                   # Business logic
│   ├── FileEventService.kt     # File-level event broadcasting
│   ├── FileWatchService.kt     # File system monitoring
│   ├── SettingsService.kt      # Configuration management
│   ├── StateService.kt         # Task numbering
│   ├── TaskEventService.kt     # Task-level event broadcasting
│   ├── TaskService.kt          # Task operations
│   └── TerminalService.kt      # PTY session management
└── utils/                      # Utilities
    ├── MarkdownParser.kt       # YAML front matter parsing
    └── SlugGenerator.kt        # URL-safe filename generation
```

## Building

```bash
./gradlew build
```

## Running

Development mode:
```bash
./gradlew run
```

Production (from project root):
```bash
make dist
./start.sh /path/to/tasks
```

Server starts on `http://127.0.0.1:8080`

## API Endpoints

All endpoints under `/api/v1`:

**Tasks:**
- `GET /tasks` - List tasks (supports filtering)
- `POST /tasks` - Create task
- `GET /tasks/{id}` - Get specific task
- `PUT /tasks/{id}` - Update task
- `DELETE /tasks/{id}` - Delete task
- `PATCH /tasks/{id}/order` - Update task order/status

**Events:**
- `GET /events/tasks` - Task event stream (SSE)
- `GET /events/files` - File event stream (SSE)

**Other:**
- `GET /settings` - Backend configuration
- `GET /version` - Version and build info
- `WS /terminal/session` - Terminal session (if enabled, WIP)

## Testing

```bash
# Run tests
./gradlew test

# List tasks
curl http://127.0.0.1:8080/api/v1/tasks

# Create task
curl -X POST http://127.0.0.1:8080/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"My Task","description":"Description","status":"planned"}'

# Subscribe to events
curl -N http://127.0.0.1:8080/api/v1/events/tasks
```

## Configuration

Environment variables:
- `TASKS_DIRECTORY` - Task storage location (default: `../tasks`)
- `APP_LOG_LEVEL` - Logging level (DEBUG, INFO, WARN, ERROR)
- `TERMINAL_ENABLED` - Enable terminal feature (default: false)

## Task File Format

Tasks are stored as Markdown files with YAML front matter:

```markdown
---
id: "uuid"
number: 1
title: "Task title"
status: "planned"
priority: "medium"
createdAt: "2025-12-20T10:00:00Z"
updatedAt: "2025-12-20T10:00:00Z"
assignees: []
categories: []
order: 1
---

# Task Title

Task description in Markdown format.
```

Files are organized by status: `tasks/planned/`, `tasks/ongoing/`, `tasks/done/`
