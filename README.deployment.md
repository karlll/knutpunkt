# Knutpunkt Deployment Guide

Single-JAR deployment with embedded frontend and backend.

## Quick Start

### Build
```bash
make dist
```

This will:
1. Build the frontend (React/Vite)
2. Copy frontend assets to backend resources
3. Build backend with all dependencies (fat JAR)
4. Copy JAR to `./build/knutpunkt-1.0.0.jar`

### Run
```bash
./start.sh
```

The application will be available at: **http://localhost:8080**

- Frontend: served at `/`
- API: available at `/api/v1`

## Requirements

- Java 17+
- Node.js (for building frontend)
- Make

## Available Make Targets

- `make help` - Show available commands
- `make build` - Build frontend and backend
- `make dist` - Build and copy JAR to ./build/
- `make run` - Run with Gradle (development mode)
- `make clean` - Remove all build artifacts
- `make test` - Run all tests
- `make install-deps` - Install frontend dependencies

## Manual Deployment

The JAR file in `./build/knutpunkt-1.0.0.jar` is completely self-contained:

```bash
java -jar build/knutpunkt-1.0.0.jar
```

## Architecture

- **Port**: 8080
- **Frontend**: Static files served from classpath
- **Backend**: Ktor REST API
- **Storage**: File-based (markdown files with YAML front matter)

## Task Storage

Tasks are stored in the `./tasks/` directory by default.

The directory structure:
- `tasks/planned/` - Planned tasks
- `tasks/ongoing/` - Tasks in progress  
- `tasks/done/` - Completed tasks

### Configuring Tasks Directory

The tasks directory can be configured in three ways (in order of precedence):

**1. Command-line argument (highest priority):**
```bash
./start.sh /path/to/tasks
```

or directly with JAR:
```bash
java -jar build/knutpunkt-1.0.0.jar /path/to/tasks
```

**2. Environment variable:**
```bash
TASKS_DIRECTORY=/path/to/tasks ./start.sh
```

or
```bash
export TASKS_DIRECTORY=/path/to/tasks
./start.sh
```

**3. Default (./tasks):**
```bash
./start.sh
```

**Precedence example:**
```bash
# Command-line argument wins over environment variable
TASKS_DIRECTORY=/ignored ./start.sh /winner
# Uses: /winner
```

Make sure the tasks directory exists and is writable when running the application.
