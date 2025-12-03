# Knutpunkt MCP Server

MCP (Model Context Protocol) server for interacting with the Knutpunkt Kanban board API.

## Features

Provides three main tools for AI agents:

- **list_tasks** - List tasks from the kanban board (default: planned tasks)
- **claim_task** - Claim a planned task, assign to an agent, move to ongoing
- **finish_task** - Mark a task as done

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
export KNUTPUNKT_API_URL=http://localhost:8080/api/v1
```

Default: `http://localhost:8080/api/v1`

## Usage with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "knutpunkt": {
      "command": "node",
      "args": ["/absolute/path/to/knutpunkt/mcp-server/build/index.js"],
      "env": {
        "KNUTPUNKT_API_URL": "http://localhost:8080/api/v1"
      }
    }
  }
}
```

## Tools

### list_tasks

List tasks from the kanban board.

**Arguments:**
- `status` (optional): Filter by status (planned, ongoing, done) - default: planned
- `assignee` (optional): Filter by assignee name
- `category` (optional): Filter by category
- `priority` (optional): Filter by priority (low, medium, high)

**Example:**
```
List all planned tasks
```

### claim_task

Claim a planned task and assign it to an agent.

**Arguments:**
- `taskId` (required): The ID of the task to claim
- `agentName` (required): Name of the agent claiming the task

**What it does:**
- Verifies task is in "planned" status
- Adds agent to assignees list
- Moves task to "ongoing" status

**Example:**
```
Claim task abc-123 for agent "Claude"
```

### finish_task

Mark a task as done.

**Arguments:**
- `taskId` (required): The ID of the task to finish

**What it does:**
- Moves task to "done" status

**Example:**
```
Mark task abc-123 as finished
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
│       ├── claimTask.ts      # Claim task tool
│       └── finishTask.ts     # Finish task tool
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

Errors are returned with descriptive messages to help the AI agent understand what went wrong.
