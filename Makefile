.PHONY: help build clean run test dist install-deps version

# Extract version from build.gradle.kts
VERSION := $(shell grep '^version = ' backend/build.gradle.kts | sed 's/version = "\(.*\)"/\1/')

# Default target
help:
	@echo "Knutpunkt - Kanban Task Board"
	@echo ""
	@echo "Available targets:"
	@echo "  make build        - Build frontend and backend, create JAR"
	@echo "  make dist         - Build and copy JAR to ./build directory"
	@echo "  make run          - Run the application (port 8080)"
	@echo "  make clean        - Clean all build artifacts"
	@echo "  make test         - Run all tests"
	@echo "  make install-deps - Install frontend dependencies"
	@echo "  make version      - Show current version"
	@echo ""

# Build the project (frontend + backend JAR)
build:
	@echo "Building Knutpunkt v$(VERSION)..."
	cd backend && ./gradlew clean shadowJar --no-daemon

# Build and copy to project root build directory
dist: build
	@echo "Creating distribution (version $(VERSION))..."
	@mkdir -p build
	@cp backend/build/libs/knutpunkt-$(VERSION)-all.jar build/knutpunkt-$(VERSION).jar
	@echo "✓ JAR copied to: ./build/knutpunkt-$(VERSION).jar"
	@ls -lh build/

# Run the application
run:
	@echo "Starting Knutpunkt on http://localhost:8080"
	cd backend && ./gradlew run --no-daemon

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf build
	@rm -rf frontend/dist
	@rm -rf frontend/node_modules/.vite
	cd backend && ./gradlew clean --no-daemon
	@echo "✓ Cleaned"

# Run tests
test:
	@echo "Running frontend tests..."
	cd frontend && npm test
	@echo "Running backend tests..."
	cd backend && ./gradlew test --no-daemon

# Install frontend dependencies
install-deps:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✓ Dependencies installed"

# Show current version
version:
	@echo "$(VERSION)"
