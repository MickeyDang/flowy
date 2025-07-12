/**
 * MCP HTTP Client - Bridge between Claude Desktop and HTTP Server
 * 
 * This MCP client acts as a bridge between Claude Desktop (via stdio)
 * and the HTTP server. It translates MCP protocol calls to HTTP API calls.
 * 
 * Usage: node src/mcp-http-client.js
 * Mode: stdio → HTTP bridge
 * 
 * Environment Variables:
 * - FLOWY_API_KEY: API key for HTTP server authentication
 * - FLOWY_HTTP_SERVER_URL: HTTP server URL (default: http://localhost:3000)
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const flowchartTools = require('./tools/flowchart-tools');
require('dotenv').config();

class FlowyHttpClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    
    // Use built-in fetch for HTTP requests (Node.js 18+)
    this.fetch = global.fetch || require('node-fetch');
  }
  
  async callTool(toolName, args) {
    try {
      const url = `${this.baseUrl}/mcp/tools/${toolName}`;
      
      const response = await this.fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(args)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data.result;
      
    } catch (error) {
      console.error('HTTP client error:', error);
      throw error;
    }
  }
}

// Initialize HTTP client from environment variables
const HTTP_SERVER_URL = process.env.FLOWY_HTTP_SERVER_URL || 'http://localhost:3000';
const API_KEY = process.env.FLOWY_API_KEY;

if (!API_KEY) {
  console.error('Error: FLOWY_API_KEY environment variable is required');
  process.exit(1);
}

const httpClient = new FlowyHttpClient(HTTP_SERVER_URL, API_KEY);

// Create MCP server
const server = new Server({
  name: 'flowchart-http-client',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Handle ListToolsRequest - return existing tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  try {
    return {
      tools: flowchartTools.getTools(),
    };
  } catch (error) {
    console.error('Error listing tools:', error);
    throw error;
  }
});

// Handle CallToolRequest - bridge to HTTP server
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    console.error(`Calling tool ${name} via HTTP...`);
    
    // Call tool via HTTP client
    const result = await httpClient.callTool(name, args);
    
    console.error(`Tool ${name} completed successfully`);
    return result;
    
  } catch (error) {
    console.error(`Tool ${name} failed:`, error.message);
    
    // Convert to MCP error format
    return {
      content: [
        {
          type: 'text',
          text: `Error calling tool ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Main function to start the MCP server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Flowchart HTTP MCP client running on stdio');
    console.error(`Connected to HTTP server: ${HTTP_SERVER_URL}`);
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  FlowyHttpClient,
  server,
  main
};