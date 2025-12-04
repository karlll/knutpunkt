import { z } from 'zod';
import { apiClient } from '../api/client.js';

export const UpdateTaskSchema = z.object({
  taskId: z.string().describe('The ID of the task to update'),
  title: z.string().min(1).max(200).describe('Human-readable task title'),
  description: z.string().describe('Task description in Markdown format'),
  status: z.enum(['planned', 'ongoing', 'done']).optional().describe('Task status'),
  assignees: z.array(z.string()).optional().describe('List of assignee names'),
  categories: z.array(z.string()).optional().describe('List of category tags'),
  priority: z.enum(['low', 'medium', 'high']).optional().describe('Task priority'),
  order: z.number().int().min(1).optional().describe('Position within the column'),
});

export type UpdateTaskArgs = z.infer<typeof UpdateTaskSchema>;

export const updateTaskTool = {
  name: 'update_task',
  description: `This tool handles user requests related to modifying or updating existing task details.

Use this tool whenever the user asks to:
- "update task #3"
- "modify task 5"
- "change the description of task 7"
- "edit task #2"
- "update the priority/status/assignees"
- "change task details"

This tool is responsible for performing full updates to task properties including title, description, status, priority, assignees, categories, and order.

Example:
User: "Update task 4 to high priority"
Assistant: (calls get_task first to retrieve current values, then calls update_task with priority='high')

User: "Change the title of task #3"
Assistant: (calls update_task with new title)`,
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'The ID of the task to update',
      },
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
        description: 'Task status',
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
        description: 'Task priority',
      },
      order: {
        type: 'number',
        description: 'Position within the column',
      },
    },
    required: ['taskId', 'title', 'description'],
  },
};

export async function handleUpdateTask(args: UpdateTaskArgs) {
  try {
    const task = await apiClient.updateTask(args.taskId, {
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
          text: `✓ Task updated successfully!\n\n` +
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
          text: `Error updating task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
