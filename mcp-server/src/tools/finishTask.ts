import { z } from 'zod';
import { apiClient } from '../api/client.js';

export const FinishTaskSchema = z.object({
  taskId: z.string().describe('The ID of the task to finish'),
});

export type FinishTaskArgs = z.infer<typeof FinishTaskSchema>;

export const finishTaskTool = {
  name: 'finish_task',
  description: `This tool handles user requests related to completing or finishing tasks.

Use this tool whenever the user asks to:
- "finish task #5"
- "mark task 3 as done"
- "complete task 7"
- "task 2 is finished"
- "mark this as complete"
- "close task #9"
- "done with task 4"

This tool is responsible for moving a task to 'done' status, marking it as completed.

Example:
User: "Mark task 5 as done"
Assistant: (calls finish_task with taskId=<id-of-task-5>)

User: "I finished task #3"
Assistant: (calls finish_task)`,
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
