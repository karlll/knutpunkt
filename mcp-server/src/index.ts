#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { listTasksTool, handleListTasks, ListTasksSchema } from './tools/listTasks.js';
import { claimTaskTool, handleClaimTask, ClaimTaskSchema } from './tools/claimTask.js';
import { finishTaskTool, handleFinishTask, FinishTaskSchema } from './tools/finishTask.js';
import { getTaskTool, handleGetTask, GetTaskSchema } from './tools/getTask.js';
import { createTaskTool, handleCreateTask, CreateTaskSchema } from './tools/createTask.js';
import { updateTaskTool, handleUpdateTask, UpdateTaskSchema } from './tools/updateTask.js';
import { deleteTaskTool, handleDeleteTask, DeleteTaskSchema } from './tools/deleteTask.js';
import { assignTaskTool, handleAssignTask, AssignTaskSchema } from './tools/assignTask.js';
import { addCategoryTool, handleAddCategory, AddCategorySchema } from './tools/addCategory.js';
import { removeCategoryTool, handleRemoveCategory, RemoveCategorySchema } from './tools/removeCategory.js';

const SERVER_NAME = 'knutpunkt-mcp-server';
const SERVER_VERSION = '1.0.0';

class KnutpunktMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        listTasksTool,
        getTaskTool,
        createTaskTool,
        updateTaskTool,
        deleteTaskTool,
        claimTaskTool,
        finishTaskTool,
        assignTaskTool,
        addCategoryTool,
        removeCategoryTool,
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_tasks': {
            const validatedArgs = ListTasksSchema.parse(args);
            return await handleListTasks(validatedArgs);
          }

          case 'claim_task': {
            const validatedArgs = ClaimTaskSchema.parse(args);
            return await handleClaimTask(validatedArgs);
          }

          case 'finish_task': {
            const validatedArgs = FinishTaskSchema.parse(args);
            return await handleFinishTask(validatedArgs);
          }

          case 'get_task': {
            const validatedArgs = GetTaskSchema.parse(args);
            return await handleGetTask(validatedArgs);
          }

          case 'create_task': {
            const validatedArgs = CreateTaskSchema.parse(args);
            return await handleCreateTask(validatedArgs);
          }

          case 'update_task': {
            const validatedArgs = UpdateTaskSchema.parse(args);
            return await handleUpdateTask(validatedArgs);
          }

          case 'delete_task': {
            const validatedArgs = DeleteTaskSchema.parse(args);
            return await handleDeleteTask(validatedArgs);
          }

          case 'assign_task': {
            const validatedArgs = AssignTaskSchema.parse(args);
            return await handleAssignTask(validatedArgs);
          }

          case 'add_category': {
            const validatedArgs = AddCategorySchema.parse(args);
            return await handleAddCategory(validatedArgs);
          }

          case 'remove_category': {
            const validatedArgs = RemoveCategorySchema.parse(args);
            return await handleRemoveCategory(validatedArgs);
          }

          default:
            return {
              content: [
                {
                  type: 'text',
                  text: `Unknown tool: ${name}`,
                },
              ],
              isError: true,
            };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`${SERVER_NAME} v${SERVER_VERSION} started`);
  }
}

// Start the server
const server = new KnutpunktMCPServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
