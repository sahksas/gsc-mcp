import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { GoogleAuth } from './auth.js';
import { SearchConsoleClient } from './searchConsoleClient.js';
import { ToolHandlers } from './handlers/toolHandlers.js';
import { TOOL_DEFINITIONS } from './config/toolDefinitions.js';
import { CONSTANTS } from './constants.js';

export class SearchConsoleServer {
  private server: Server;
  private auth: GoogleAuth | null = null;
  private searchConsoleClient: SearchConsoleClient | null = null;
  private toolHandlers: ToolHandlers | null = null;

  constructor() {
    this.server = new Server(
      {
        name: CONSTANTS.SERVER.NAME,
        version: CONSTANTS.SERVER.VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupRequestHandlers();
  }

  private setupRequestHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: TOOL_DEFINITIONS };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.toolHandlers) {
        throw new McpError(
          ErrorCode.InternalError,
          CONSTANTS.MESSAGES.ERROR.CLIENT_NOT_INITIALIZED
        );
      }
      const { name, arguments: args } = request.params;
      return await this.toolHandlers.handleToolCall(name, args);
    });
  }

  private async initialize(): Promise<void> {
    try {
      console.error('Initializing Google Authentication...');
      this.auth = new GoogleAuth();
      await this.auth.initialize();
      
      console.error('Creating Search Console client...');
      this.searchConsoleClient = new SearchConsoleClient(this.auth);
      this.toolHandlers = new ToolHandlers(this.searchConsoleClient);
      
      console.error('Initialization complete');
    } catch (error) {
      console.error('Failed to initialize:', error);
      throw error;
    }
  }

  async run(): Promise<void> {
    try {
      await this.initialize();
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Google Search Console MCP server is running');
    } catch (error) {
      console.error('Fatal server error:', error);
      process.exit(1);
    }
  }
}