import { z } from 'zod';
import { apiClient } from '../api/client.js';

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200).describe('Human-readable task title'),
  description: z.string().describe('Task description in Markdown format'),
  status: z.enum(['planned', 'ongoing', 'done']).optional().describe('Task status (default: planned)'),
  assignees: z.array(z.string()).optional().describe('List of assignee names'),
  categories: z.array(z.string()).optional().describe('List of category tags'),
  priority: z.enum(['low', 'medium', 'high']).optional().describe('Task priority (default: medium)'),
  order: z.number().int().min(1).optional().describe('Position within the column (default: 1)'),
});

export type CreateTaskArgs = z.infer<typeof CreateTaskSchema>;

export const createTaskTool = {
  name: 'create_task',
  description: `This tool handles user requests related to creating or adding new tasks.

Use this tool whenever the user asks to:
- "create a task"
- "create a new task"
- "add a task"
- "make a task for X"
- "file a ticket"
- "create a work item"
- "I need a task for implementing Y"
- "add this to the backlog"

This tool is responsible for creating new tasks on the Kanban board with the specified details.

Example:
User: "Create a task to implement user authentication"
Assistant: (calls create_task with title and description)

User: "Add a high priority task for bug fixing"
Assistant: (calls create_task with priority='high')`,
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Human-readable task title (1-200 characters)',
      },
      description: {
        type: 'string',
        description: 'Task description in Markdown format',
      },
      status: {
        type: 'string',
        enum: ['planned', 'ongoing', 'done'],
        description: 'Task status (default: planned)',
      },
      assignees: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of assignee names',
      },
      categories: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of category tags',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Task priority (default: medium)',
      },
      order: {
        type: 'number',
        description: 'Position within the column (default: 1)',
      },
    },
    required: ['title', 'description'],
  },
};

export async function handleCreateTask(args: CreateTaskArgs) {
  try {
    const task = await apiClient.createTask({
      title: args.title,
      description: args.description,
      status: args.status,
      assignees: args.assignees,
      categories: args.categories,
      priority: args.priority,
      order: args.order,
    });

    return {
      content: [
        {
          type: 'text',
          text: `✓ Task created successfully!\n\n` +
                `#${task.number} - ${task.title}\n` +
                `ID: ${task.id}\n` +
                `Status: ${task.status}\n` +
                `Priority: ${task.priority}\n` +
                `Assignees: ${task.assignees.length > 0 ? task.assignees.join(', ') : 'None'}\n` +
                `Categories: ${task.categories.length > 0 ? task.categories.join(', ') : 'None'}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error creating task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
