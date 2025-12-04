import { z } from 'zod';
import { apiClient } from '../api/client.js';

export const DeleteTaskSchema = z.object({
  taskId: z.string().describe('The ID of the task to delete'),
});

export type DeleteTaskArgs = z.infer<typeof DeleteTaskSchema>;

export const deleteTaskTool = {
  name: 'delete_task',
  description: `This tool handles user requests related to removing or deleting tasks.

Use this tool whenever the user asks to:
- "delete task #5"
- "remove task 3"
- "delete this task"
- "get rid of task 7"
- "remove the task"

This tool is responsible for permanently deleting tasks from the Kanban board. This action cannot be undone.

Example:
User: "Delete task 9"
Assistant: (calls delete_task with taskId=<id-of-task-9>)`,
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'The ID of the task to delete',
      },
    },
    required: ['taskId'],
  },
};

export async function handleDeleteTask(args: DeleteTaskArgs) {
  try {
    // Get task details before deletion for confirmation message
    const task = await apiClient.getTask(args.taskId);
    
    await apiClient.deleteTask(args.taskId);

    return {
      content: [
        {
          type: 'text',
          text: `✓ Task deleted successfully!\n\n` +
                `Deleted: #${task.number} - ${task.title}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
