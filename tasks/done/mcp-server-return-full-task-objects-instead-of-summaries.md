---
id: "2377d6d9-bdb5-421b-87aa-442b15f30388"
number: 25
title: "MCP Server: Return full task objects instead of summaries"
createdAt: "2025-12-08T20:35:11.769674Z"
updatedAt: "2025-12-15T19:15:17.688319Z"
assignees:
- "Claude Code"
categories:
- "bug"
- "mcp-server"
priority: "high"
order: 9
---

# MCP Server: Return full task objects instead of summaries

## Overview
The MCP server's `list_tasks` tool currently returns task summaries (number, title, status) instead of full task objects with IDs. This causes issues when tools like `get_task` need to retrieve a specific task by its ID, as the ID is not available from the list response.

## Problem
When a user asks to "read task 11", the workflow is:
1. `list_tasks` is called to find task #11
2. Response contains: `{number: 11, title: "...", status: "..."}`  (no ID!)
3. `get_task` needs to be called with a taskId, but we don't have it
4. Currently, the code tries to use a placeholder ID which fails

## Solution 2: Return Full Task Objects from list_tasks

Modify the MCP server to return complete task objects from `list_tasks`, matching the backend API structure:

### Backend Changes
**File:** `mcp-server/src/index.ts`

In the `list_tasks` handler, change the response mapping from:
```typescript
tasks: tasks.map(t => ({
  number: t.number,
  title: t.title,
  status: t.status
}))
```

To return full task objects:
```typescript
tasks: tasks  // Return complete task objects with all fields
```

This aligns with the backend API `/api/v1/tasks` which returns:
```json
{
  "id": "uuid",
  "number": 11,
  "title": "Task title",
  "description": "...",
  "status": "planned",
  "priority": "medium",
  "assignees": [],
  "categories": [],
  "order": 1,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Benefits
- Tools can access task IDs directly from list results
- No need to maintain a separate lookup mechanism
- Simpler, more straightforward implementation
- Consistent with backend API structure
- Enables richer filtering and sorting on the client side

### Acceptance Criteria
- [ ] `list_tasks` returns complete task objects with all fields (id, number, title, description, status, priority, assignees, categories, order, timestamps)
- [ ] `get_task` can be called with IDs obtained from `list_tasks` response
- [ ] Existing filtering (status, assignee, category, priority) continues to work
- [ ] Test the workflow: list tasks → find task by number → get task by ID

## Files to Modify
- `mcp-server/src/index.ts` - Update list_tasks handler response mapping
- `mcp-server/src/types.ts` - Ensure Task type includes all fields (if needed)

## Notes
This is the simpler solution compared to maintaining a number-to-ID lookup cache. It provides all task data upfront, which is useful for MCP clients that may want to display or filter tasks based on various attributes.