# Knutpunkt - Kanban Task Board

A full-stack Kanban board application for task management with file-based persistence.

## Overview

Knutpunkt is a Kanban board system consisting of three main components:

- **Frontend**: React-based browser application with drag-and-drop interface (ShadCN UI)
- **Backend**: Kotlin/Ktor REST API server
- **Storage**: File-based persistence using Markdown files with YAML front matter

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
├── README.md                # This file
├── CLAUDE.md                # Detailed development specifications
├── api/
│   └── openapi.yaml         # OpenAPI 3.0 API specification
├── frontend/                # React frontend (to be implemented)
├── backend/                 # Kotlin/Ktor backend (to be implemented)
└── tasks/                   # Task storage (Markdown files)
    ├── planned/
    ├── ongoing/
    └── done/
```

## API Specification

The API contract is defined in `api/openapi.yaml` using OpenAPI 3.0.

**Base URL**: `http://localhost:8080/api/v1`

**Endpoints**:
- `GET /tasks` - List all tasks (with filtering)
- `GET /tasks/{id}` - Get a specific task
- `POST /tasks` - Create a new task
- `PUT /tasks/{id}` - Update a task
- `DELETE /tasks/{id}` - Delete a task
- `PATCH /tasks/{id}/status` - Update task status

View the full specification in [api/openapi.yaml](api/openapi.yaml).

## Development Approach

This project follows **API-first development**:

1. Define the API contract (OpenAPI specification) ✓
2. Implement the backend according to the spec
3. Implement the frontend using the spec for type generation

## Getting Started

Detailed development instructions, coding guidelines, and component specifications can be found in [CLAUDE.md](CLAUDE.md).

### Prerequisites

- **Frontend**: Node.js 18+, npm
- **Backend**: Java 17+, Kotlin 1.9+, Gradle 8+

### Quick Start

*(To be added as components are implemented)*

## Documentation

- [CLAUDE.md](CLAUDE.md) - Comprehensive development guide
- [api/openapi.yaml](api/openapi.yaml) - API specification

## License

*(To be determined)*
