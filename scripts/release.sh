#!/bin/bash
# Knutpunkt Release Preparation Script
# Prepares a new release by updating versions and CHANGELOG
#
# Usage: ./scripts/release.sh <version>
# Example: ./scripts/release.sh 1.2.0

set -e

NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
    echo "Usage: $0 <version>"
    echo ""
    echo "Example: $0 1.2.0"
    echo ""
    exit 1
fi

# Validate version format (basic semver check)
if ! echo "$NEW_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$'; then
    echo "Error: Invalid version format. Expected: MAJOR.MINOR.PATCH (e.g., 1.2.0 or 1.2.0-beta.1)"
    exit 1
fi

echo "========================================="
echo "Preparing release v$NEW_VERSION"
echo "========================================="
echo ""

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "Warning: Working directory is not clean."
    echo "Uncommitted changes:"
    git status --short
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 1. Update version in backend/build.gradle.kts
echo "Updating backend/build.gradle.kts..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/^version = \".*\"/version = \"$NEW_VERSION\"/" backend/build.gradle.kts
else
    # Linux
    sed -i "s/^version = \".*\"/version = \"$NEW_VERSION\"/" backend/build.gradle.kts
fi

# 2. Update version in frontend/package.json
echo "Updating frontend/package.json..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" frontend/package.json
else
    # Linux
    sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" frontend/package.json
fi

# 3. Update CHANGELOG.md (if it exists)
if [ -f CHANGELOG.md ]; then
    echo "Updating CHANGELOG.md..."
    DATE=$(date +%Y-%m-%d)

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/## \[Unreleased\]/## [Unreleased]\n\n## [$NEW_VERSION] - $DATE/" CHANGELOG.md
    else
        # Linux
        sed -i "s/## \[Unreleased\]/## [Unreleased]\\n\\n## [$NEW_VERSION] - $DATE/" CHANGELOG.md
    fi
fi

echo ""
echo "✓ Version updated to $NEW_VERSION"
echo ""
echo "Changes made:"
git diff backend/build.gradle.kts frontend/package.json CHANGELOG.md 2>/dev/null || true
echo ""
echo "========================================="
echo "Next steps:"
echo "========================================="
echo "1. Review the changes above"
echo "2. Edit CHANGELOG.md to add release notes under [$NEW_VERSION]"
echo "3. Commit the changes:"
echo "   git add backend/build.gradle.kts frontend/package.json CHANGELOG.md"
echo "   git commit -m 'chore: release v$NEW_VERSION'"
echo ""
echo "4. Create and push the tag:"
echo "   git tag -a v$NEW_VERSION -m 'Release v$NEW_VERSION'"
echo "   git push origin main"
echo "   git push origin v$NEW_VERSION"
echo ""
echo "5. GitHub Actions will automatically:"
echo "   - Run tests"
echo "   - Build the JAR"
echo "   - Create a GitHub Release"
echo "   - Upload knutpunkt-$NEW_VERSION.jar"
echo ""
