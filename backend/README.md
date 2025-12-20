# Knutpunkt Backend

Ktor-based REST API for the Knutpunkt Kanban board application.

## Features

- File-based task persistence (Markdown files with YAML front matter)
- REST API endpoints matching OpenAPI specification
- CORS support for frontend integration
- Comprehensive error handling

## Project Structure

```
src/main/kotlin/com/ninjacontrol/knutpunkt/
├── Application.kt              # Main application entry point
├── models/
│   └── Models.kt               # Data models (Task, TaskCreate, etc.)
├── plugins/
│   ├── CORS.kt                 # CORS configuration
│   ├── Routing.kt              # Route configuration
│   ├── Serialization.kt        # JSON serialization
│   └── StatusPages.kt          # Error handling
├── routes/
│   └── TaskRoutes.kt          # Task API endpoints
├── services/
│   └── TaskService.kt          # Business logic for tasks
└── utils/
    ├── MarkdownParser.kt       # YAML front matter parsing
    └── SlugGenerator.kt        # URL-safe slug generation
```

## Building

```bash
./gradlew build
```

## Running

```bash
./gradlew run
```

Server will start on `http://127.0.0.1:8080`

## API Endpoints

All endpoints are prefixed with `/api/v1`:

- `GET /tasks` - List all tasks (with optional filtering)
- `POST /tasks` - Create a new task
- `GET /tasks/{id}` - Get a specific task
- `PUT /tasks/{id}` - Update a task
- `DELETE /tasks/{id}` - Delete a task
- `PATCH /tasks/{id}/status` - Update task status

## Testing

```bash
# List tasks
curl http://127.0.0.1:8080/api/v1/tasks

# Create a task
curl -X POST http://127.0.0.1:8080/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "My Task", "description": "Task description"}'

# Update task status
curl -X PATCH http://127.0.0.1:8080/api/v1/tasks/{id}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "ONGOING"}'
```

## Configuration

- Server port: 8080
- Tasks directory: `../tasks` (relative to backend directory)
- Base API path: `/api/v1`
