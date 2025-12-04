---
id: "2c71bef5-c99e-4d62-b5c1-85f0b8f80d3f"
number: 7
title: "Test the Kanban board"
createdAt: "2025-12-04T19:29:56.126076Z"
updatedAt: "2025-12-04T19:37:34.396037Z"
assignees:
- "GitHub Copilot"
categories:
- "testing"
- "mcp-server"
- "integration"
priority: "high"
order: 1
---

## Overview

Comprehensive testing of the Kanban board MCP server integration to ensure all functionality works correctly.

## Test Areas

### 1. Task Listing
- Verify `list_tasks` returns all tasks correctly
- Test filtering by status (planned, ongoing, done)
- Test filtering by assignee
- Test filtering by category
- Test filtering by priority
- Verify empty board returns appropriate response

### 2. Task Reading
- Test `get_task` retrieves correct task details
- Verify all fields are populated correctly (id, title, description, status, assignees, categories, priority)
- Test error handling for non-existent task IDs

### 3. Task Creation
- Test `create_task` with all required fields
- Test with optional fields (assignees, categories, priority)
- Verify task number generation is sequential
- Verify slug generation from title
- Verify file is created in correct directory (tasks/planned/)
- Test YAML frontmatter is properly formatted

### 4. Task Updates
- Test `update_task` for changing title, description
- Test updating assignees and categories
- Test updating priority
- Verify file is updated with correct YAML frontmatter
- Test concurrent updates handling

### 5. Task Status Changes
- Test moving tasks between columns (planned → ongoing → done)
- Verify files are moved to correct directories
- Test `claim_task` assigns task and moves to ongoing
- Test `finish_task` moves task to done

### 6. Task Assignment
- Test `assign_task` adds assignees correctly
- Test adding multiple assignees
- Verify duplicate assignees are handled properly

### 7. Category Management
- Test `add_category` adds categories correctly
- Test `remove_category` removes categories
- Verify duplicate categories are handled

### 8. Task Deletion
- Test `delete_task` removes task completely
- Verify file is deleted from filesystem
- Test error handling for non-existent tasks

### 9. File System Integration
- Verify task files match expected Markdown format
- Test YAML frontmatter parsing
- Verify slug-based filename generation
- Test FileWatchService detects external changes
- Verify state.json is updated correctly

### 10. Error Handling
- Test invalid task IDs
- Test malformed requests
- Test permission issues
- Test concurrent access scenarios

## Acceptance Criteria

- [ ] All MCP server endpoints respond correctly
- [ ] Tasks persist to filesystem in correct format
- [ ] File watching detects external changes
- [ ] Task numbering is consistent and sequential
- [ ] Error handling provides meaningful messages
- [ ] No data loss during operations