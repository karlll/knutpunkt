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
      tools: [listTasksTool, claimTaskTool, finishTaskTool],
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
