#!/bin/bash

# Knutpunkt Startup Script
# Runs the application JAR file
#
# Usage:
#   ./start.sh <tasks-directory> [options]
#
# Examples:
#   ./start.sh ./tasks                          # Use default settings
#   ./start.sh /path/to/tasks --port=9090       # Custom port
#   ./start.sh ./tasks --terminal=true          # Enable terminal
#   ./start.sh ./tasks --config=./app.conf      # External config file
#
# Options (passed through to the application):
#   --port=<int>               Server port [default: 8080]
#   --host=<text>              Server host [default: 0.0.0.0]
#   --title=<text>             Application title [default: Knutpunkt]
#   --cache=<true|false>       Enable task caching [default: true]
#   --terminal=<true|false>    Enable PTY terminal support [default: false]
#   --terminal-timeout=<int>   Terminal idle timeout in minutes [default: 30]
#   --terminal-buffer=<int>    Terminal output buffer size [default: 100]
#   --sse-keepalive=<int>      SSE heartbeat interval in seconds [default: 15]
#   --config=<path>            External application.conf file
#   -h, --help                 Show help and exit
#
# Environment variables (logging only):
#   APP_LOG_LEVEL      Application log level (DEBUG, INFO, WARN, ERROR) [default: DEBUG]
#   KTOR_LOG_LEVEL     Ktor framework log level [default: INFO]
#   LOG_LEVEL          Root log level [default: INFO]
#
# Examples with logging:
#   APP_LOG_LEVEL=INFO ./start.sh ./tasks              # Only INFO and above
#   APP_LOG_LEVEL=DEBUG ./start.sh ./tasks             # Show all debug logs

set -e

# Auto-detect version from build.gradle.kts or use VERSION env var
if [ -z "$VERSION" ]; then
    VERSION=$(grep '^version = ' backend/build.gradle.kts 2>/dev/null | sed 's/version = "\(.*\)"/\1/' || echo "1.0.0")
fi

JAR_FILE="build/knutpunkt-${VERSION}.jar"

# Check if specific version JAR exists, otherwise try to find any JAR
if [ ! -f "$JAR_FILE" ]; then
    echo "Warning: Expected JAR not found at $JAR_FILE"
    echo "Searching for alternative JAR files..."

    # Find the most recent JAR file
    FOUND_JAR=$(ls -t build/knutpunkt-*.jar 2>/dev/null | head -1 || echo "")

    if [ -n "$FOUND_JAR" ] && [ -f "$FOUND_JAR" ]; then
        JAR_FILE="$FOUND_JAR"
        DETECTED_VERSION=$(basename "$JAR_FILE" | sed 's/knutpunkt-\(.*\)\.jar/\1/')
        echo "Found: $JAR_FILE (version $DETECTED_VERSION)"
        VERSION="$DETECTED_VERSION"
    else
        echo "Error: No JAR file found in ./build directory"
        echo ""
        echo "Please build the application first:"
        echo "  make dist"
        echo ""
        exit 1
    fi
fi

echo "Starting Knutpunkt v$VERSION..."
echo "JAR: $JAR_FILE"
echo "Log level: ${APP_LOG_LEVEL:-DEBUG} (set APP_LOG_LEVEL to change)"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Pass all arguments directly to the application
java -jar "$JAR_FILE" "$@"
