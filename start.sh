#!/bin/bash

# Knutpunkt Startup Script
# Runs the application JAR file
#
# Usage:
#   ./start.sh [tasks-directory]
#
# Examples:
#   ./start.sh                    # Use ./tasks (default)
#   ./start.sh /path/to/tasks     # Use custom path
#
# Environment Variables:
#   TASKS_DIRECTORY    - Custom tasks directory path
#   APP_LOG_LEVEL      - Application log level (DEBUG, INFO, WARN, ERROR) [default: DEBUG]
#   KTOR_LOG_LEVEL     - Ktor framework log level [default: INFO]
#   LOG_LEVEL          - Root log level [default: INFO]
#
# Examples with logging:
#   APP_LOG_LEVEL=INFO ./start.sh              # Only INFO and above
#   APP_LOG_LEVEL=DEBUG ./start.sh             # Show all debug logs
#   KTOR_LOG_LEVEL=DEBUG ./start.sh            # Debug Ktor framework too

set -e

JAR_FILE="build/knutpunkt-1.0.0.jar"
PORT=8080
TASKS_ARG="${1:-}"
TASKS_DIR="${TASKS_ARG:-${TASKS_DIRECTORY:-./tasks}}"

# Check if JAR exists
if [ ! -f "$JAR_FILE" ]; then
    echo "Error: JAR file not found at $JAR_FILE"
    echo ""
    echo "Please build the application first:"
    echo "  make dist"
    echo ""
    exit 1
fi

# Display startup information
echo "Starting Knutpunkt..."
echo "JAR: $JAR_FILE"
echo "Port: $PORT"
echo "Tasks directory: $TASKS_DIR"
echo "Log level: ${APP_LOG_LEVEL:-DEBUG} (set APP_LOG_LEVEL to change)"
echo "URL: http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run the JAR with tasks directory as argument if provided
if [ -n "$TASKS_ARG" ]; then
    java -jar "$JAR_FILE" "$TASKS_ARG"
else
    java -jar "$JAR_FILE"
fi
