# Knutpunkt MCP Server

MCP (Model Context Protocol) server for interacting with the Knutpunkt Kanban board API.

## Features

Provides comprehensive tools for AI agents to manage Kanban tasks:

### Core Task Operations
- **list_tasks** - List and filter tasks by status, assignee, category, or priority
- **get_task** - Retrieve detailed information about a specific task
- **create_task** - Create new tasks with structured descriptions (includes task writing guidelines)
- **update_task** - Modify task details (title, description, priority, assignees, categories)
- **delete_task** - Remove tasks from the board

### Workflow Operations
- **claim_task** - Claim a planned task, assign to an agent, move to ongoing
- **finish_task** - Mark a task as done

### Task Metadata
- **assign_task** - Add assignees to a task
- **add_category** - Add category tags to a task
- **remove_category** - Remove category tags from a task

## Installation

```bash
cd mcp-server
npm install
```

## Building

```bash
npm run build
```

## Development

```bash
# Watch mode
npm run watch

# Run server
npm run dev
```

## Configuration

Set the backend API URL via environment variable:

```bash
export KNUTPUNKT_API_URL=http://127.0.0.1:8080/api/v1
```

Default: `http://127.0.0.1:8080/api/v1`

## Usage with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "knutpunkt": {
      "command": "node",
      "args": ["/absolute/path/to/knutpunkt/mcp-server/build/index.js"],
      "env": {
        "KNUTPUNKT_API_URL": "http://127.0.0.1:8080/api/v1"
      }
    }
  }
}
```

## Tools

### list_tasks

List and filter tasks from the kanban board.

**Arguments:**
- `status` (optional): Filter by status (planned, ongoing, done)
- `assignee` (optional): Filter by assignee name
- `category` (optional): Filter by category
- `priority` (optional): Filter by priority (low, medium, high)

**Example:**
```
List all ongoing tasks assigned to alice
List high priority planned tasks
```

### get_task

Retrieve detailed information about a specific task.

**Arguments:**
- `taskId` (required): The ID of the task to retrieve

**Returns:** Complete task details including title, description, status, assignees, categories, priority, and timestamps.

**Example:**
```
Show me task abc-123
Read task 5 and propose a solution
```

### create_task

Create a new task with structured description.

**Arguments:**
- `title` (required): Human-readable task title (1-200 characters)
- `description` (required): Task description in Markdown format
- `status` (optional): Task status (default: planned)
- `assignees` (optional): List of assignee names
- `categories` (optional): List of category tags
- `priority` (optional): Task priority (default: medium)
- `order` (optional): Position within the column (default: 1)

**Task Description Guidelines:**
The `description` parameter should follow this structure for best results:
- **## Overview** - 1-2 sentences explaining the goal
- **## Requirements** - Specific, actionable bullet points with file paths and function names
- **## Acceptance Criteria** - Testable checkboxes using `- [ ]` format
- **## Examples** - Code snippets showing expected inputs/outputs

**Example:**
```
Create a task to implement user authentication
Add a high priority task for bug fixing in the frontend
```

### update_task

Update an existing task's details.

**Arguments:**
- `taskId` (required): The ID of the task to update
- `title` (required): Updated task title
- `description` (required): Updated task description
- `status` (optional): Updated status
- `assignees` (optional): Updated list of assignees
- `categories` (optional): Updated list of categories
- `priority` (optional): Updated priority
- `order` (optional): Updated position

**Example:**
```
Update task abc-123 to high priority
Change the description of task 7
```

### delete_task

Delete a task from the board.

**Arguments:**
- `taskId` (required): The ID of the task to delete

**Example:**
```
Delete task abc-123
Remove task 9
```

### claim_task

Claim a planned task and assign it to an agent.

**Arguments:**
- `taskId` (required): The ID of the task to claim
- `agentName` (required): Name of the agent claiming the task (e.g., "Claude Code", "GitHub Copilot")

**What it does:**
- Verifies task is in "planned" status
- Adds agent to assignees list
- Moves task to "ongoing" status

**Example:**
```
Claim task abc-123
Start working on task 5
I'll take task #3
```

### finish_task

Mark a task as done.

**Arguments:**
- `taskId` (required): The ID of the task to finish

**What it does:**
- Moves task to "done" status

**Example:**
```
Mark task abc-123 as done
Finish task 5
Task 3 is complete
```

### assign_task

Add an assignee to a task.

**Arguments:**
- `taskId` (required): The ID of the task
- `assignee` (required): Name of the assignee to add

**Example:**
```
Assign task 4 to alice
Add bob as assignee to task 7
```

### add_category

Add a category tag to a task.

**Arguments:**
- `taskId` (required): The ID of the task
- `category` (required): Category tag to add

**Example:**
```
Tag task 3 with 'frontend'
Add category 'bug' to task 5
```

### remove_category

Remove a category tag from a task.

**Arguments:**
- `taskId` (required): The ID of the task
- `category` (required): Category tag to remove

**Example:**
```
Remove 'backend' tag from task 4
Delete the 'wip' category from task 7
```

## Architecture

```
mcp-server/
├── src/
│   ├── index.ts              # MCP server setup and handlers
│   ├── api/
│   │   └── client.ts         # HTTP client for Knutpunkt API
│   └── tools/
│       ├── listTasks.ts      # List tasks tool
│       ├── getTask.ts        # Get task details tool
│       ├── createTask.ts     # Create task tool (with writing guidelines)
│       ├── updateTask.ts     # Update task tool
│       ├── deleteTask.ts     # Delete task tool
│       ├── claimTask.ts      # Claim task tool
│       ├── finishTask.ts     # Finish task tool
│       ├── assignTask.ts     # Assign task tool
│       ├── addCategory.ts    # Add category tool
│       └── removeCategory.ts # Remove category tool
├── package.json
├── tsconfig.json
└── README.md
```

## Requirements

- Node.js 20+
- TypeScript 5.3+
- Running Knutpunkt backend (port 8080)

## Error Handling

All tools include comprehensive error handling:
- Network errors (connection refused, timeout)
- Invalid task IDs (404 errors)
- Invalid state transitions (e.g., claiming a non-planned task)
- Validation errors (missing required arguments)
- Duplicate operations (e.g., adding existing category)
- Constraint violations (e.g., empty title)

Errors are returned with descriptive messages to help the AI agent understand what went wrong.

## Task Writing Guidelines

When creating tasks via `create_task`, follow these best practices for effective task descriptions:

1. **Be explicit, not implicit** - Use absolute file paths, exact function names, specific error codes
2. **Structure your description** - Use ## Overview, ## Requirements, ## Acceptance Criteria, ## Examples
3. **Make it testable** - Acceptance criteria should be verifiable conditions using `- [ ]` checkboxes
4. **Include examples** - Show expected code snippets, API responses, or file structures
5. **Keep focused** - One main objective per task (split large tasks into smaller ones)

For complete guidelines, see: `notes/TASK_WRITING_GUIDE.md`

## Testing

The MCP server has been comprehensively tested. See `TEST_RESULTS.md` in the project root for:
- Integration test results covering all 10 tool categories
- YAML frontmatter validation
- File system operations (create, move, delete)
- API endpoint verification
- Slug generation and Markdown structure validation
