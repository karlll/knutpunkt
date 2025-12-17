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
#   CONFIG_FILE        - Path to external application.conf
#   TASKS_DIRECTORY    - Custom tasks directory path
#   PORT               - Server port [default: 8080]
#   HOST               - Server host [default: 0.0.0.0]
#   ENABLE_CACHE       - Enable task caching [default: true]
#   APP_LOG_LEVEL      - Application log level (DEBUG, INFO, WARN, ERROR) [default: DEBUG]
#   KTOR_LOG_LEVEL     - Ktor framework log level [default: INFO]
#   LOG_LEVEL          - Root log level [default: INFO]
#
# Examples with logging:
#   APP_LOG_LEVEL=INFO ./start.sh              # Only INFO and above
#   APP_LOG_LEVEL=DEBUG ./start.sh             # Show all debug logs
#   KTOR_LOG_LEVEL=DEBUG ./start.sh            # Debug Ktor framework too
#
# Examples with external config:
#   CONFIG_FILE=/path/to/app.conf ./start.sh   # Use external config file

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

# Build JVM options
JVM_OPTS=""

# Add external config file if provided
if [ -n "${CONFIG_FILE:-}" ]; then
    if [ ! -f "$CONFIG_FILE" ]; then
        echo "Error: Config file not found: $CONFIG_FILE"
        exit 1
    fi
    JVM_OPTS="$JVM_OPTS -Dconfig.file=$CONFIG_FILE"
    echo "External config: $CONFIG_FILE"
fi

# Display startup information
echo "Starting Knutpunkt..."
echo "JAR: $JAR_FILE"
echo "Port: ${PORT:-8080} (set PORT to change)"
echo "Tasks directory: $TASKS_DIR"
echo "Log level: ${APP_LOG_LEVEL:-DEBUG} (set APP_LOG_LEVEL to change)"
echo "URL: http://localhost:${PORT:-8080}"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run the JAR with tasks directory as argument if provided
if [ -n "$TASKS_ARG" ]; then
    java $JVM_OPTS -jar "$JAR_FILE" "$TASKS_ARG"
else
    java $JVM_OPTS -jar "$JAR_FILE"
fi
