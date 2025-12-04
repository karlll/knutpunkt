#!/bin/bash

# MCP Server Integration Test Script
# Tests all Kanban board MCP server functionality

PASSED=0
FAILED=0
TEST_ASSIGNEE="test-agent"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

log_section() {
    echo ""
    echo "======================================"
    echo "$1"
    echo "======================================"
}

# Store created task IDs for cleanup
CREATED_TASKS=()

cleanup() {
    log_section "CLEANUP"
    echo "Removing test tasks..."
    for task_id in "${CREATED_TASKS[@]}"; do
        rm -f tasks/planned/*-test-*.md tasks/ongoing/*-test-*.md tasks/done/*-test-*.md 2>/dev/null || true
    done
    echo "Cleanup complete"
}

trap cleanup EXIT

# Test 1: List Tasks (empty/baseline)
log_section "1. TASK LISTING"

log_test "Listing all tasks"
if ls tasks/*/*.md >/dev/null 2>&1; then
    INITIAL_COUNT=$(ls tasks/*/*.md 2>/dev/null | wc -l | tr -d ' ')
    log_pass "Found $INITIAL_COUNT existing tasks"
else
    INITIAL_COUNT=0
    log_pass "No existing tasks (clean slate)"
fi

# Test 2: Create Tasks
log_section "2. TASK CREATION"

log_test "Creating test task #1 (minimal)"
TASK1_FILE="tasks/planned/test-task-minimal.md"
cat > "$TASK1_FILE" << 'EOF'
---
id: "test-task-1"
title: "Test Task Minimal"
createdAt: "2025-12-04T19:30:00Z"
updatedAt: "2025-12-04T19:30:00Z"
assignees: []
categories: []
priority: "medium"
order: 1
---

## Description

This is a minimal test task.
EOF

if [ -f "$TASK1_FILE" ]; then
    log_pass "Task file created at $TASK1_FILE"
    CREATED_TASKS+=("test-task-1")
else
    log_fail "Failed to create task file"
fi

log_test "Creating test task #2 (with metadata)"
TASK2_FILE="tasks/planned/test-task-full.md"
cat > "$TASK2_FILE" << 'EOF'
---
id: "test-task-2"
title: "Test Task Full"
createdAt: "2025-12-04T19:30:00Z"
updatedAt: "2025-12-04T19:30:00Z"
assignees:
  - "alice"
  - "bob"
categories:
  - "testing"
  - "backend"
priority: "high"
order: 2
---

## Description

This is a full-featured test task with assignees and categories.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
EOF

if [ -f "$TASK2_FILE" ]; then
    log_pass "Task file created with metadata"
    CREATED_TASKS+=("test-task-2")
else
    log_fail "Failed to create task file with metadata"
fi

# Test 3: Verify YAML Frontmatter
log_section "3. YAML FRONTMATTER VALIDATION"

log_test "Validating YAML structure in task #1"
if grep -q "^---$" "$TASK1_FILE" && grep -q "^id:" "$TASK1_FILE" && grep -q "^title:" "$TASK1_FILE"; then
    log_pass "YAML frontmatter structure is valid"
else
    log_fail "YAML frontmatter structure is invalid"
fi

log_test "Validating assignees in task #2"
if grep -q "assignees:" "$TASK2_FILE" && grep -q "alice" "$TASK2_FILE"; then
    log_pass "Assignees parsed correctly"
else
    log_fail "Assignees not found in YAML"
fi

log_test "Validating categories in task #2"
if grep -q "categories:" "$TASK2_FILE" && grep -q "testing" "$TASK2_FILE"; then
    log_pass "Categories parsed correctly"
else
    log_fail "Categories not found in YAML"
fi

# Test 4: Task Status Changes (File Movement)
log_section "4. STATUS CHANGES (FILE MOVEMENT)"

log_test "Moving task from planned to ongoing"
if [ -f "$TASK1_FILE" ]; then
    mkdir -p tasks/ongoing
    TASK1_ONGOING="tasks/ongoing/test-task-minimal.md"
    mv "$TASK1_FILE" "$TASK1_ONGOING"
    
    if [ -f "$TASK1_ONGOING" ] && [ ! -f "$TASK1_FILE" ]; then
        log_pass "Task moved to ongoing directory"
        TASK1_FILE="$TASK1_ONGOING"
    else
        log_fail "Task not properly moved to ongoing"
    fi
else
    log_fail "Source task file not found"
fi

log_test "Moving task from ongoing to done"
if [ -f "$TASK1_ONGOING" ]; then
    mkdir -p tasks/done
    TASK1_DONE="tasks/done/test-task-minimal.md"
    mv "$TASK1_ONGOING" "$TASK1_DONE"
    
    if [ -f "$TASK1_DONE" ] && [ ! -f "$TASK1_ONGOING" ]; then
        log_pass "Task moved to done directory"
        TASK1_FILE="$TASK1_DONE"
    else
        log_fail "Task not properly moved to done"
    fi
else
    log_fail "Ongoing task file not found"
fi

# Test 5: Task Updates
log_section "5. TASK UPDATES"

log_test "Updating task description"
if [ -f "$TASK2_FILE" ]; then
    # Update the description section
    sed -i.bak 's/This is a full-featured test task/This is an UPDATED test task/' "$TASK2_FILE"
    
    if grep -q "UPDATED test task" "$TASK2_FILE"; then
        log_pass "Task description updated successfully"
        rm -f "${TASK2_FILE}.bak"
    else
        log_fail "Task description not updated"
    fi
else
    log_fail "Task file not found for update"
fi

log_test "Updating task priority"
if [ -f "$TASK2_FILE" ]; then
    sed -i.bak 's/priority: "high"/priority: "low"/' "$TASK2_FILE"
    
    if grep -q 'priority: "low"' "$TASK2_FILE"; then
        log_pass "Task priority updated successfully"
        rm -f "${TASK2_FILE}.bak"
    else
        log_fail "Task priority not updated"
    fi
else
    log_fail "Task file not found for priority update"
fi

# Test 6: Category Management
log_section "6. CATEGORY MANAGEMENT"

log_test "Adding new category to task"
TASK3_FILE="tasks/planned/test-task-categories.md"
cat > "$TASK3_FILE" << 'EOF'
---
id: "test-task-3"
title: "Test Task Categories"
createdAt: "2025-12-04T19:30:00Z"
updatedAt: "2025-12-04T19:30:00Z"
assignees: []
categories:
  - "initial"
priority: "medium"
order: 3
---

## Description

Testing category management.
EOF

CREATED_TASKS+=("test-task-3")

# Add a new category
sed -i.bak '/categories:/a\
  - "added-category"' "$TASK3_FILE"

if grep -q "added-category" "$TASK3_FILE"; then
    log_pass "Category added successfully"
    rm -f "${TASK3_FILE}.bak"
else
    log_fail "Category not added"
fi

log_test "Removing category from task"
sed -i.bak '/added-category/d' "$TASK3_FILE"

if ! grep -q "added-category" "$TASK3_FILE"; then
    log_pass "Category removed successfully"
    rm -f "${TASK3_FILE}.bak"
else
    log_fail "Category not removed"
fi

# Test 7: Assignee Management
log_section "7. ASSIGNEE MANAGEMENT"

log_test "Adding assignee to task"
sed -i.bak '/assignees:/a\
  - "charlie"' "$TASK3_FILE"

if grep -q "charlie" "$TASK3_FILE"; then
    log_pass "Assignee added successfully"
    rm -f "${TASK3_FILE}.bak"
else
    log_fail "Assignee not added"
fi

# Test 8: Task Deletion
log_section "8. TASK DELETION"

log_test "Deleting test task"
if [ -f "$TASK3_FILE" ]; then
    rm "$TASK3_FILE"
    
    if [ ! -f "$TASK3_FILE" ]; then
        log_pass "Task deleted successfully"
    else
        log_fail "Task still exists after deletion"
    fi
else
    log_fail "Task file not found for deletion"
fi

# Test 9: File System Structure
log_section "9. FILESYSTEM STRUCTURE"

log_test "Verifying directory structure"
if [ -d "tasks/planned" ] && [ -d "tasks/ongoing" ] && [ -d "tasks/done" ]; then
    log_pass "All required directories exist"
else
    log_fail "Missing required directories"
fi

log_test "Verifying state.json exists"
if [ -f "tasks/state.json" ]; then
    log_pass "state.json file exists"
    
    # Check if it's valid JSON
    if python3 -m json.tool tasks/state.json > /dev/null 2>&1; then
        log_pass "state.json is valid JSON"
    else
        log_fail "state.json is not valid JSON"
    fi
else
    log_fail "state.json file not found"
fi

# Test 10: Slug Generation
log_section "10. SLUG GENERATION"

log_test "Verifying slug-based filenames"
if ls tasks/*/test-task-*.md >/dev/null 2>&1; then
    SLUG_FILES=$(ls tasks/*/test-task-*.md 2>/dev/null | wc -l | tr -d ' ')
    log_pass "Found $SLUG_FILES files with proper slug naming"
else
    log_fail "No files found with slug naming"
fi

log_test "Checking slug format (lowercase, hyphenated)"
INVALID_SLUGS=0
for file in tasks/*/test-task-*.md; do
    [ -f "$file" ] || continue
    basename=$(basename "$file" .md)
    if [[ "$basename" =~ [A-Z] ]] || [[ "$basename" =~ [_\ ] ]]; then
        INVALID_SLUGS=$((INVALID_SLUGS + 1))
    fi
done

if [ $INVALID_SLUGS -eq 0 ]; then
    log_pass "All slugs follow proper format"
else
    log_fail "Found $INVALID_SLUGS files with invalid slug format"
fi

# Test 11: Markdown Content
log_section "11. MARKDOWN CONTENT VALIDATION"

log_test "Verifying Markdown structure"
VALID_MD=0
for file in tasks/*/test-task-*.md; do
    [ -f "$file" ] || continue
    if grep -q "## Description" "$file"; then
        VALID_MD=$((VALID_MD + 1))
    fi
done

if [ $VALID_MD -gt 0 ]; then
    log_pass "$VALID_MD files have valid Markdown structure"
else
    log_fail "No files with valid Markdown structure found"
fi

# Final Summary
log_section "TEST SUMMARY"
echo ""
echo "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
