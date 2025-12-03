import { z } from 'zod';
import { apiClient } from '../api/client.js';

export const ListTasksSchema = z.object({
  status: z.enum(['planned', 'ongoing', 'done']).optional(),
  assignee: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export type ListTasksArgs = z.infer<typeof ListTasksSchema>;

export const listTasksTool = {
  name: 'list_tasks',
  description: 'List tasks from the Knutpunkt kanban board. Default: lists all planned tasks.',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['planned', 'ongoing', 'done'],
        description: 'Filter by task status (default: planned)',
      },
      assignee: {
        type: 'string',
        description: 'Filter by assignee name',
      },
      category: {
        type: 'string',
        description: 'Filter by category',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Filter by priority level',
      },
    },
  },
};

export async function handleListTasks(args: ListTasksArgs) {
  try {
    const params = {
      status: args.status || 'planned',
      assignee: args.assignee,
      category: args.category,
      priority: args.priority,
    };

    const tasks = await apiClient.listTasks(params);

    if (tasks.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No tasks found with the specified filters.`,
          },
        ],
      };
    }

    const taskList = tasks.map((task) => 
      `#${task.number} - ${task.title}\n` +
      `  ID: ${task.id}\n` +
      `  Status: ${task.status}\n` +
      `  Priority: ${task.priority}\n` +
      `  Assignees: ${task.assignees.length > 0 ? task.assignees.join(', ') : 'None'}\n` +
      `  Categories: ${task.categories.length > 0 ? task.categories.join(', ') : 'None'}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${tasks.length} task(s):\n\n${taskList}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error listing tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
