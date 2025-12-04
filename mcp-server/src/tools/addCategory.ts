import { z } from 'zod';
import { apiClient } from '../api/client.js';

export const AddCategorySchema = z.object({
  taskId: z.string().describe('The ID of the task'),
  category: z.string().describe('Category tag to add'),
});

export type AddCategoryArgs = z.infer<typeof AddCategorySchema>;

export const addCategoryTool = {
  name: 'add_category',
  description: `This tool handles user requests related to adding tags or categories to tasks.

Use this tool whenever the user asks to:
- "tag task #3 with 'backend'"
- "add category 'feature' to task 5"
- "categorize task 7 as 'bug'"
- "label this task with X"
- "add the tag Y"

This tool is responsible for adding a category tag to a task. If the category already exists on the task, this is a no-op.

Example:
User: "Tag task 3 with 'frontend'"
Assistant: (calls add_category with taskId and category='frontend')`,
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'The ID of the task',
      },
      category: {
        type: 'string',
        description: 'Category tag to add',
      },
    },
    required: ['taskId', 'category'],
  },
};

export async function handleAddCategory(args: AddCategoryArgs) {
  try {
    const task = await apiClient.getTask(args.taskId);

    // Check if category already exists
    if (task.categories.includes(args.category)) {
      return {
        content: [
          {
            type: 'text',
            text: `Task #${task.number} "${task.title}" already has category "${args.category}".`,
          },
        ],
      };
    }

    // Add category
    const updatedTask = await apiClient.updateTask(args.taskId, {
      title: task.title,
      description: task.description,
      status: task.status,
      assignees: task.assignees,
      categories: [...task.categories, args.category],
      priority: task.priority,
      order: task.order,
    });

    return {
      content: [
        {
          type: 'text',
          text: `✓ Category added successfully!\n\n` +
                `#${updatedTask.number} - ${updatedTask.title}\n` +
                `Categories: ${updatedTask.categories.join(', ')}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error adding category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
