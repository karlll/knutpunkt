import { z } from 'zod';
import { apiClient } from '../api/client.js';

export const RemoveCategorySchema = z.object({
  taskId: z.string().describe('The ID of the task'),
  category: z.string().describe('Category tag to remove'),
});

export type RemoveCategoryArgs = z.infer<typeof RemoveCategorySchema>;

export const removeCategoryTool = {
  name: 'remove_category',
  description: `This tool handles user requests related to removing tags or categories from tasks.

Use this tool whenever the user asks to:
- "remove the 'bug' tag from task #3"
- "untag task 5"
- "remove category 'backend' from task 7"
- "delete the X label"

This tool is responsible for removing a category tag from a task. If the category doesn't exist on the task, this is a no-op.

Example:
User: "Remove 'backend' tag from task 4"
Assistant: (calls remove_category with taskId and category='backend')`,
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'The ID of the task',
      },
      category: {
        type: 'string',
        description: 'Category tag to remove',
      },
    },
    required: ['taskId', 'category'],
  },
};

export async function handleRemoveCategory(args: RemoveCategoryArgs) {
  try {
    const task = await apiClient.getTask(args.taskId);

    // Check if category exists
    if (!task.categories.includes(args.category)) {
      return {
        content: [
          {
            type: 'text',
            text: `Task #${task.number} "${task.title}" does not have category "${args.category}".`,
          },
        ],
      };
    }

    // Remove category
    const updatedTask = await apiClient.updateTask(args.taskId, {
      title: task.title,
      description: task.description,
      status: task.status,
      assignees: task.assignees,
      categories: task.categories.filter(c => c !== args.category),
      priority: task.priority,
      order: task.order,
    });

    return {
      content: [
        {
          type: 'text',
          text: `✓ Category removed successfully!\n\n` +
                `#${updatedTask.number} - ${updatedTask.title}\n` +
                `Categories: ${updatedTask.categories.length > 0 ? updatedTask.categories.join(', ') : 'None'}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error removing category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
