const config = {
  server: {
    name: 'flowchart-pptx-server',
    version: '1.0.0',
    description: 'MCP server for generating PowerPoint flowcharts',
  },
  
  capabilities: {
    tools: {
      create_flowchart: {
        description: 'Create flowcharts with nodes and connections',
        maxNodes: 50,
        supportedNodeTypes: ['start', 'process', 'decision', 'end'],
      },
      generate_pptx: {
        description: 'Generate PowerPoint presentations from flowcharts',
        supportedFormats: ['pptx'],
        maxSlides: 10,
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
    slide: {
      width: 1000,
      height: 700,
      margin: 50,
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
    defaultPath: '/Users/mickeydang/Projects/flowy/output',
    filenamePrefix: 'flowchart_',
    timestampFormat: 'YYYY-MM-DD_HH-mm-ss',
  },
  
  validation: {
    maxTextLength: 100,
    maxConnectionsPerNode: 10,
    requireStartNode: true,
    requireEndNode: false,
  },
};

module.exports = config;