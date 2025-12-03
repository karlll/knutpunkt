import { z } from 'zod';
import { apiClient } from '../api/client.js';

export const ClaimTaskSchema = z.object({
  taskId: z.string().describe('The ID of the task to claim'),
  agentName: z.string().describe('Name of the agent claiming the task'),
});

export type ClaimTaskArgs = z.infer<typeof ClaimTaskSchema>;

export const claimTaskTool = {
  name: 'claim_task',
  description: 'Claim a task from the planned column, assign it to an agent, and move it to ongoing status.',
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'The ID of the task to claim',
      },
      agentName: {
        type: 'string',
        description: 'Name of the agent claiming the task',
      },
    },
    required: ['taskId', 'agentName'],
  },
};

export async function handleClaimTask(args: ClaimTaskArgs) {
  try {
    // Get current task details
    const task = await apiClient.getTask(args.taskId);

    // Verify task is in planned status
    if (task.status !== 'planned') {
      return {
        content: [
          {
            type: 'text',
            text: `Cannot claim task #${task.number} "${task.title}": Task is already in "${task.status}" status. Only planned tasks can be claimed.`,
          },
        ],
        isError: true,
      };
    }

    // Check if agent is already assigned
    if (task.assignees.includes(args.agentName)) {
      return {
        content: [
          {
            type: 'text',
            text: `Task #${task.number} "${task.title}" is already assigned to ${args.agentName}.`,
          },
        ],
      };
    }

    // Update task: add assignee and move to ongoing
    const updatedTask = await apiClient.updateTask(args.taskId, {
      title: task.title,
      description: task.description,
      status: 'ongoing',
      assignees: [...task.assignees, args.agentName],
      categories: task.categories,
      priority: task.priority,
      order: task.order,
    });

    return {
      content: [
        {
          type: 'text',
          text: `✓ Task claimed successfully!\n\n` +
                `#${updatedTask.number} - ${updatedTask.title}\n` +
                `Status: ${task.status} → ${updatedTask.status}\n` +
                `Assignees: ${updatedTask.assignees.join(', ')}\n` +
                `Priority: ${updatedTask.priority}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error claiming task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
