import { z } from 'zod';
import { apiClient } from '../api/client.js';

export const GetTaskSchema = z.object({
  taskId: z.string().describe('The ID of the task to retrieve'),
});

export type GetTaskArgs = z.infer<typeof GetTaskSchema>;

export const getTaskTool = {
  name: 'get_task',
  description: `This tool handles user requests related to reading, viewing, or inspecting a specific task.

Use this tool whenever the user asks to:
- "read task #3" / "read task 3"
- "show task 5"
- "open task #12"
- "get details for task 7"
- "what does task 4 say?"
- "show me the description of task 9"
- "read task X and propose a solution"
- "analyze task #6"

This tool is responsible for retrieving detailed information about a single task by its ID or number. The task information returned is the authoritative source of truth. When the user wants to know anything about a specific task, always call this tool first.

If the user wants to read a task and then take actions based on its content (e.g., propose a solution, make changes), call this tool first, then reason about the returned content.

Example:
User: "Show me task #5"
Assistant: (calls get_task with taskId=<id-of-task-5>)

User: "Read task 3 and suggest improvements"
Assistant: (calls get_task with taskId=<id-of-task-3>, then analyzes the content)`,
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'The ID of the task to retrieve',
      },
    },
    required: ['taskId'],
  },
};

export async function handleGetTask(args: GetTaskArgs) {
  try {
    const task = await apiClient.getTask(args.taskId);

    return {
      content: [
        {
          type: 'text',
          text: `#${task.number} - ${task.title}\n\n` +
                `ID: ${task.id}\n` +
                `Status: ${task.status}\n` +
                `Priority: ${task.priority}\n` +
                `Order: ${task.order}\n` +
                `Created: ${task.createdAt}\n` +
                `Updated: ${task.updatedAt}\n` +
                `Assignees: ${task.assignees.length > 0 ? task.assignees.join(', ') : 'None'}\n` +
                `Categories: ${task.categories.length > 0 ? task.categories.join(', ') : 'None'}\n\n` +
                `## Description\n\n${task.description}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
