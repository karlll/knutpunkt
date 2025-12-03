import { z } from 'zod';
import { apiClient } from '../api/client.js';

export const FinishTaskSchema = z.object({
  taskId: z.string().describe('The ID of the task to finish'),
});

export type FinishTaskArgs = z.infer<typeof FinishTaskSchema>;

export const finishTaskTool = {
  name: 'finish_task',
  description: 'Mark a task as done by moving it to the done column.',
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'The ID of the task to mark as done',
      },
    },
    required: ['taskId'],
  },
};

export async function handleFinishTask(args: FinishTaskArgs) {
  try {
    // Get current task details
    const task = await apiClient.getTask(args.taskId);

    // Check if task is already done
    if (task.status === 'done') {
      return {
        content: [
          {
            type: 'text',
            text: `Task #${task.number} "${task.title}" is already marked as done.`,
          },
        ],
      };
    }

    // Update task status to done
    const updatedTask = await apiClient.updateTaskStatus(args.taskId, 'done');

    return {
      content: [
        {
          type: 'text',
          text: `✓ Task completed successfully!\n\n` +
                `#${updatedTask.number} - ${updatedTask.title}\n` +
                `Status: ${task.status} → ${updatedTask.status}\n` +
                `Assignees: ${updatedTask.assignees.length > 0 ? updatedTask.assignees.join(', ') : 'None'}\n` +
                `Priority: ${updatedTask.priority}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error finishing task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
