import { z } from 'zod';
import { apiClient } from '../api/client.js';

export const ClaimTaskSchema = z.object({
  taskId: z.string().describe('The ID of the task to claim'),
  agentName: z.string().describe('Name of the agent claiming the task'),
});

export type ClaimTaskArgs = z.infer<typeof ClaimTaskSchema>;

export const claimTaskTool = {
  name: 'claim_task',
  description: `This tool handles user requests related to claiming or starting work on tasks.

Use this tool whenever the user asks to:
- "claim task #3"
- "start working on task 5"
- "I'll take task 7"
- "assign task 2 to me and start it"
- "begin work on this task"
- "start task #4"

This tool is responsible for claiming a planned task, assigning it to an agent, and moving it to 'ongoing' status. Only planned tasks can be claimed.

Example:
User: "Start working on task 5"
Assistant: (calls claim_task with taskId and agentName)

User: "I'll take task #3"
Assistant: (calls claim_task)`,
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'The ID of the task to claim',
      },
      agentName: {
        type: 'string',
        description: 'Name of the agent claiming the task. It should be the name of the agent invoking this tool (i.e. Claude Code, GitHub Copilot, etc), and not the user talking to the agent.',
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
