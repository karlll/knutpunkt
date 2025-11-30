#!/bin/bash

# Knutpunkt Startup Script
# Runs the application JAR file

set -e

JAR_FILE="build/knutpunkt-1.0.0.jar"
PORT=8080
TASKS_DIR="${TASKS_DIRECTORY:-./tasks}"

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
echo "URL: http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run the JAR
java -jar "$JAR_FILE"
