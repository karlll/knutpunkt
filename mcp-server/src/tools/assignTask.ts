import { z } from 'zod';
import { apiClient } from '../api/client.js';

export const AssignTaskSchema = z.object({
  taskId: z.string().describe('The ID of the task to assign'),
  assignee: z.string().describe('Name of the assignee to add'),
});

export type AssignTaskArgs = z.infer<typeof AssignTaskSchema>;

export const assignTaskTool = {
  name: 'assign_task',
  description: `This tool handles user requests related to assigning tasks to people.

Use this tool whenever the user asks to:
- "assign task #3 to alice"
- "add bob as assignee to task 5"
- "assign this to me"
- "give task 7 to charlie"
- "add an assignee"

This tool is responsible for adding an assignee to a task's assignee list. If the assignee is already assigned, this is a no-op.

Example:
User: "Assign task 4 to alice"
Assistant: (calls assign_task with taskId and assignee='alice')`,
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'The ID of the task to assign',
      },
      assignee: {
        type: 'string',
        description: 'Name of the assignee to add',
      },
    },
    required: ['taskId', 'assignee'],
  },
};

export async function handleAssignTask(args: AssignTaskArgs) {
  try {
    const task = await apiClient.getTask(args.taskId);

    // Check if assignee is already assigned
    if (task.assignees.includes(args.assignee)) {
      return {
        content: [
          {
            type: 'text',
            text: `Task #${task.number} "${task.title}" is already assigned to ${args.assignee}.`,
          },
        ],
      };
    }

    // Add assignee
    const updatedTask = await apiClient.updateTask(args.taskId, {
      title: task.title,
      description: task.description,
      status: task.status,
      assignees: [...task.assignees, args.assignee],
      categories: task.categories,
      priority: task.priority,
      order: task.order,
    });

    return {
      content: [
        {
          type: 'text',
          text: `✓ Assignee added successfully!\n\n` +
                `#${updatedTask.number} - ${updatedTask.title}\n` +
                `Assignees: ${updatedTask.assignees.join(', ')}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error assigning task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
