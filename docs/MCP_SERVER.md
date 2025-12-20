# Knutpunkt MCP Server

## Overview

The Knutpunkt MCP (Model Context Protocol) server enables AI assistants like Claude Code to interact with the Knutpunkt Kanban board through a standardized interface. It provides tools for creating, reading, updating, and managing tasks directly from your AI assistant.

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that enables AI assistants to securely connect to external data sources and tools. The Knutpunkt MCP server implements this protocol to expose the Knutpunkt API as a set of callable tools.

## Features

The MCP server provides the following capabilities:

- **Task Management**: Create, read, update, and delete tasks
- **Task Workflow**: Claim tasks (move to ongoing) and mark them as finished
- **Organization**: Assign tasks, add/remove categories
- **Filtering**: List tasks by status, assignee, category, or priority
- **Real-time Integration**: Works with the running Knutpunkt backend

## Installation

### Prerequisites

- Node.js 18+
- A running Knutpunkt backend server
- Claude Code (or another MCP-compatible AI assistant)

### Build the MCP Server

```bash
cd mcp-server
npm install
npm run build
```

This compiles the TypeScript source to JavaScript in the `build/` directory.

## Configuration

### Claude Code Setup

Add the Knutpunkt MCP server to your Claude Code settings file.

**Location**: `~/.config/claude-code/settings.json`

```json
{
  "mcpServers": {
    "knutpunkt": {
      "command": "node",
      "args": [
        "/absolute/path/to/knutpunkt/mcp-server/build/index.js"
      ],
      "env": {
        "KNUTPUNKT_API_URL": "http://localhost:8080/api/v1"
      }
    }
  }
}
```

Replace `/absolute/path/to/knutpunkt` with the actual path to your Knutpunkt installation.

### Environment Variables

- `KNUTPUNKT_API_URL` - Base URL for the Knutpunkt API (default: `http://localhost:8080/api/v1`)

### Verify Installation

After configuring, restart Claude Code. The MCP server tools should be available. You can verify by asking Claude:

```
Do you have access to the Knutpunkt task board?
```

If configured correctly, Claude will confirm access to the following tools:
- list_tasks
- get_task
- create_task
- update_task
- delete_task
- claim_task
- finish_task
- assign_task
- add_category
- remove_category

## Available Tools

### list_tasks

List and filter tasks on the Kanban board.

**Parameters**:
- `status` (optional): Filter by status (`planned`, `ongoing`, `done`)
- `assignee` (optional): Filter by assignee name
- `category` (optional): Filter by category tag
- `priority` (optional): Filter by priority (`low`, `medium`, `high`)

**Example**:
```
Show me all ongoing tasks
List high priority tasks
What tasks are assigned to Claude Code?
```

### get_task

Retrieve detailed information about a specific task.

**Parameters**:
- `taskId` (required): The UUID of the task

**Example**:
```
Show me task #5
Read task abc123-def456-...
```

### create_task

Create a new task on the Kanban board.

**Parameters**:
- `title` (required): Task title (1-200 characters)
- `description` (required): Task description in Markdown format
- `status` (optional): Initial status (default: `planned`)
- `assignees` (optional): Array of assignee names
- `categories` (optional): Array of category tags
- `priority` (optional): Priority level (default: `medium`)
- `order` (optional): Position within column (default: 1)

**Example**:
```
Create a task to implement user authentication
Add a high priority bug fix task for the login page
```

### update_task

Update an existing task's properties.

**Parameters**:
- `taskId` (required): The UUID of the task
- `title` (required): Updated title
- `description` (required): Updated description
- `status` (optional): Updated status
- `assignees` (optional): Updated assignee list
- `categories` (optional): Updated category list
- `priority` (optional): Updated priority
- `order` (optional): Updated position

**Example**:
```
Update task #3 to high priority
Change the description of task abc123...
```

### delete_task

Delete a task from the board.

**Parameters**:
- `taskId` (required): The UUID of the task

**Example**:
```
Delete task #7
Remove task abc123...
```

### claim_task

Claim a planned task and move it to ongoing status. Automatically adds the agent as an assignee.

**Parameters**:
- `taskId` (required): The UUID of the task
- `agentName` (required): Name of the agent claiming the task (e.g., "Claude Code")

**Example**:
```
Claim task #5 and start working on it
I'll take task #3
```

### finish_task

Mark an ongoing task as done.

**Parameters**:
- `taskId` (required): The UUID of the task

**Example**:
```
Mark task #5 as done
Finish task abc123...
Complete this task
```

### assign_task

Add an assignee to a task.

**Parameters**:
- `taskId` (required): The UUID of the task
- `assignee` (required): Name of the assignee to add

**Example**:
```
Assign task #3 to Alice
Add Bob to task abc123...
```

### add_category

Add a category tag to a task.

**Parameters**:
- `taskId` (required): The UUID of the task
- `category` (required): Category tag to add

**Example**:
```
Tag task #5 with "backend"
Add "bug" category to task abc123...
```

### remove_category

Remove a category tag from a task.

**Parameters**:
- `taskId` (required): The UUID of the task
- `category` (required): Category tag to remove

**Example**:
```
Remove "frontend" tag from task #3
Untag "feature" from task abc123...
```

## Usage Examples

### Listing Tasks

**List all planned tasks**:
```
User: What tasks are in the backlog?
Claude: [Calls list_tasks with status="planned"]
```

**Filter by assignee**:
```
User: Show me all tasks assigned to Claude Code
Claude: [Calls list_tasks with assignee="Claude Code"]
```

**Filter by priority**:
```
User: What are the high priority tasks?
Claude: [Calls list_tasks with priority="high"]
```

**Multiple filters**:
```
User: Show ongoing tasks that are high priority
Claude: [Calls list_tasks with status="ongoing", priority="high"]
```

### Creating Tasks

**Basic task creation**:
```
User: Create a task to implement user authentication

Claude: [Calls create_task with:
  title: "Implement user authentication"
  description: "## Overview
Add user authentication system to the application.

## Requirements
- Create authentication middleware
- Add login/logout endpoints
- Implement session management

## Acceptance Criteria
- [ ] Users can log in with credentials
- [ ] Sessions persist across requests
- [ ] Logout clears session data"
]
```

**Task with metadata**:
```
User: Create a high priority bug fix for the login page and assign it to me

Claude: [Calls create_task with:
  title: "Fix login page bug"
  description: "..."
  priority: "high"
  assignees: ["user"]
  categories: ["bug", "frontend"]
]
```

### Claiming and Working on Tasks

**Claim a task**:
```
User: I'll start working on task #5

Claude: [Steps:
1. Calls list_tasks to find task #5
2. Gets the task ID
3. Calls claim_task with taskId and agentName="Claude Code"
Result: Task moves from "planned" to "ongoing", Claude Code added as assignee]
```

**Complete workflow**:
```
User: Show me planned tasks, I want to pick one

Claude: [Calls list_tasks with status="planned"]
Here are the planned tasks:
#5 - Implement search feature
#7 - Fix mobile layout
#8 - Add dark mode toggle

User: I'll take #5

Claude: [Calls claim_task for task #5]
✓ Task claimed! You're now working on "Implement search feature"

[Time passes, work is done]

User: I finished the search feature

Claude: [Calls finish_task for task #5]
✓ Task #5 marked as done!
```

### Advanced Workflows

**Triage and organize**:
```
User: List all tasks without assignees

Claude: [Calls list_tasks, filters results for empty assignees]
Found 3 unassigned tasks:
#12 - Update documentation
#14 - Refactor API client
#15 - Add unit tests

User: Assign #12 to Alice and tag it as "documentation"

Claude: [Calls:
1. assign_task with taskId=#12, assignee="Alice"
2. add_category with taskId=#12, category="documentation"
]
✓ Task #12 assigned to Alice and tagged with "documentation"
```

**Bulk operations**:
```
User: Create three tasks for the authentication feature:
1. Design the auth flow
2. Implement the backend
3. Add frontend login form

Claude: [Calls create_task three times, one for each task]
✓ Created task #20 - Design authentication flow
✓ Created task #21 - Implement authentication backend
✓ Created task #22 - Add frontend login form
```

## Integration with Claude Code

### Natural Language Commands

Claude Code understands natural language requests. You don't need to know the exact tool names:

```
"Show me what needs to be done" → list_tasks
"Create a task for fixing the bug" → create_task
"I'll work on task #5" → claim_task
"Mark this task as complete" → finish_task
```

### Task Creation Best Practices

When creating tasks through Claude, provide clear context:

```
User: Create a task to add error handling to the API

Claude creates task with:
- Specific title
- Detailed description with requirements
- Acceptance criteria
- Code examples where relevant
```

See [TASK_WRITING_GUIDE.md](./TASK_WRITING_GUIDE.md) for comprehensive task writing guidelines.

### Workflow Suggestions

**Sprint planning**:
```
User: List all planned tasks and help me prioritize them

Claude:
[Lists tasks, discusses priorities, can update priorities and assignments]
```

**Daily standup**:
```
User: What tasks are currently ongoing?

Claude:
[Shows ongoing tasks with assignees and progress]
```

**Task review**:
```
User: Show me all done tasks from this week

Claude:
[Filters by status and date, presents completed work]
```

## Troubleshooting

### Connection Issues

**Error**: `Error listing tasks: connect ECONNREFUSED`

**Solution**: Ensure the Knutpunkt backend is running:
```bash
./start.sh
```

Verify the backend is accessible at `http://localhost:8080/api/v1/tasks`

### Configuration Issues

**Problem**: Claude doesn't recognize Knutpunkt tools

**Solutions**:
1. Verify MCP server path in settings is absolute
2. Check that the build directory exists: `mcp-server/build/index.js`
3. Restart Claude Code after configuration changes
4. Check Claude Code logs for MCP connection errors

### API URL Configuration

If your backend runs on a different port or host:

```json
{
  "mcpServers": {
    "knutpunkt": {
      "command": "node",
      "args": ["/path/to/mcp-server/build/index.js"],
      "env": {
        "KNUTPUNKT_API_URL": "http://localhost:3000/api/v1"
      }
    }
  }
}
```

### Permission Issues

**Error**: `EACCES: permission denied`

**Solution**: Ensure the MCP server files have execute permissions:
```bash
chmod +x mcp-server/build/index.js
```

### Task ID Resolution

When referencing tasks by number (e.g., "task #5"), Claude first queries the API to find the corresponding UUID. If multiple tasks exist with the same number (shouldn't happen), Claude uses the most recent one.

## Development

### Adding New Tools

To extend the MCP server with new tools:

1. Create a new file in `mcp-server/src/tools/yourTool.ts`
2. Define the Zod schema for parameters
3. Export the tool definition and handler function
4. Register the tool in `mcp-server/src/index.ts`
5. Rebuild: `npm run build`

Example structure:
```typescript
import { z } from 'zod';
import { apiClient } from '../api/client.js';

export const YourToolSchema = z.object({
  // parameter definitions
});

export const yourToolTool = {
  name: 'your_tool',
  description: 'Tool description for Claude',
  inputSchema: {
    type: 'object',
    properties: {
      // parameter schemas
    },
  },
};

export async function handleYourTool(args: YourToolArgs) {
  // implementation
}
```

### Testing

Test the MCP server manually:

```bash
cd mcp-server
npm run dev
```

The server communicates via stdio, so direct testing requires an MCP client. Use Claude Code or another MCP-compatible tool for testing.

### Debugging

Enable debug logging by checking stderr output. The MCP server logs errors and connection info to stderr:

```
knutpunkt-mcp-server v1.0.0 started
```

For API issues, check the Knutpunkt backend logs:
```bash
APP_LOG_LEVEL=DEBUG ./start.sh
```

## See Also

- [TASK_WRITING_GUIDE.md](./TASK_WRITING_GUIDE.md) - Guidelines for writing effective task descriptions
- [../api/openapi.yaml](../api/openapi.yaml) - Full API specification
- [MCP Specification](https://modelcontextprotocol.io) - Official MCP documentation
