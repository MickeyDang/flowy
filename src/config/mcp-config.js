const config = {
  server: {
    name: 'flowchart-pdf-server',
    version: '1.0.0',
    description: 'MCP server for generating PDF flowcharts',
  },
  
  capabilities: {
    tools: {
      create_flowchart: {
        description: 'Create flowcharts with nodes and connections',
        maxNodes: 50,
        supportedNodeTypes: ['start', 'process', 'decision', 'end'],
      },
      generate_pdf: {
        description: 'Generate PDF documents from flowcharts',
        supportedFormats: ['pdf'],
        maxPages: 10,
      },
    },
  },
  
  layout: {
    defaultSpacing: {
      horizontal: 150,
      vertical: 200,
    },
    nodeSize: {
      start: { width: 120, height: 80 },
      process: { width: 160, height: 80 },
      decision: { width: 140, height: 100 },
      end: { width: 120, height: 80 },
    },
    page: {
      width: 210, // A4 width in mm
      height: 297, // A4 height in mm
      margin: 20, // margin in mm
    },
  },
  
  styling: {
    colors: {
      start: '#4CAF50',
      process: '#2196F3',
      decision: '#FF9800',
      end: '#F44336',
      connection: '#666666',
    },
    fonts: {
      default: 'Arial',
      title: 'Arial',
      node: 'Arial',
    },
    sizes: {
      title: 24,
      node: 12,
      connection: 10,
    },
  },
  
  output: {
    format: 'pdf',
    encoding: 'base64',
    delivery: 'inline', // Delivered directly to chat
  },
  
  validation: {
    maxTextLength: 100,
    maxConnectionsPerNode: 10,
    requireStartNode: true,
    requireEndNode: false,
  },
};

module.exports = config;