/**
 * HTTP Server - Standalone HTTP API mode
 * 
 * This HTTP server exposes the MCP tools via REST API endpoints with
 * API key authentication. Use this for remote access or when you want
 * to provide HTTP API access to the flowchart tools.
 * 
 * Usage: node src/http-server.js
 * Mode: HTTP (REST API with authentication)
 * Port: 3000
 */

const express = require('express');
const ApiKeyAuth = require('./auth/api-key-auth');
const flowchartTools = require('./tools/flowchart-tools');

const app = express();
const PORT = 3000;

// JSON body parsing middleware
app.use(express.json());

// API key authentication middleware
function authenticateApiKey(req, res, next) {
  // Extract API key from X-API-Key header or apiKey query parameter
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  // Validate the API key
  const validation = ApiKeyAuth.validateApiKey(apiKey);
  
  if (!validation.valid) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: validation.error
    });
  }
  
  // API key is valid, proceed to next middleware
  next();
}

// POST /mcp/tools/:toolName endpoint
app.post('/mcp/tools/:toolName', authenticateApiKey, async (req, res) => {
  try {
    const { toolName } = req.params;
    const args = req.body;
    
    // Call the flowchart tool with the provided arguments
    const result = await flowchartTools.callTool(toolName, args);
    
    // Return successful JSON response
    res.json({
      success: true,
      tool: toolName,
      result: result
    });
    
  } catch (error) {
    console.error('Tool execution error:', error);
    
    // Return 500 error response
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      tool: req.params.toolName
    });
  }
});

// Health check endpoint (no authentication required)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler for unknown endpoints
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
  console.log(`Access the API at: http://localhost:${PORT}/mcp/tools/:toolName`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;