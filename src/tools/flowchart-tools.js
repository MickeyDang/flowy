const { v4: uuidv4 } = require('uuid');
const Flowchart = require('../models/flowchart');
const LayoutEngine = require('./layout-engine');
const FlowchartPDFGenerator = require('../utils/pdf-generator');
const Validator = require('../utils/validation');
const { 
  FlowchartNotFoundError, 
  NodeNotFoundError, 
  FileGenerationError, 
  ValidationError 
} = require('../utils/errors');

const tools = [
  {
    name: 'create_flowchart',
    description: 'Create a new empty flowchart',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the flowchart',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'add_node',
    description: 'Add a node to an existing flowchart',
    inputSchema: {
      type: 'object',
      properties: {
        flowchartId: {
          type: 'string',
          description: 'ID of the flowchart to add the node to',
        },
        text: {
          type: 'string',
          description: 'Text content of the node',
        },
        positionHint: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
          },
          description: 'Optional position hint for the node',
        },
      },
      required: ['flowchartId', 'text'],
    },
  },
  {
    name: 'add_connection',
    description: 'Add a connection between two nodes in a flowchart',
    inputSchema: {
      type: 'object',
      properties: {
        flowchartId: {
          type: 'string',
          description: 'ID of the flowchart to add the connection to',
        },
        sourceNodeId: {
          type: 'string',
          description: 'ID of the source node',
        },
        targetNodeId: {
          type: 'string',
          description: 'ID of the target node',
        },
        label: {
          type: 'string',
          description: 'Optional label for the connection',
        },
      },
      required: ['flowchartId', 'sourceNodeId', 'targetNodeId'],
    },
  },
  {
    name: 'auto_layout',
    description: 'Apply automatic layout to a flowchart',
    inputSchema: {
      type: 'object',
      properties: {
        flowchartId: {
          type: 'string',
          description: 'ID of the flowchart to layout',
        },
        algorithm: {
          type: 'string',
          enum: ['hierarchical'],
          description: 'Layout algorithm to use',
        },
      },
      required: ['flowchartId', 'algorithm'],
    },
  },
  {
    name: 'export_pdf',
    description: 'Export a flowchart as a PDF document for download',
    inputSchema: {
      type: 'object',
      properties: {
        flowchartId: {
          type: 'string',
          description: 'ID of the flowchart to export',
        },
        filename: {
          type: 'string',
          description: 'Output filename for PDF (without extension)',
        },
      },
      required: ['flowchartId', 'filename'],
    },
  },
];

const flowcharts = new Map();

async function createFlowchart(args) {
  try {
    const { title } = args;
    const validatedTitle = Validator.validateText(title, 'flowchart title');
    
    const flowchartId = uuidv4();
    const flowchart = new Flowchart(flowchartId, validatedTitle);
    
    flowcharts.set(flowchartId, flowchart);
    
    return {
      content: [
        {
          type: 'text',
          text: `Flowchart created with ID: ${flowchartId}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error creating flowchart: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function addNode(args) {
  try {
    const { flowchartId, text, positionHint = { x: 0, y: 0 } } = args;
    
    const validatedFlowchartId = Validator.validateId(flowchartId, 'flowchartId');
    const validatedText = Validator.validateText(text, 'node text');
    const validatedPosition = Validator.validatePositionHint(positionHint);
    
    const flowchart = flowcharts.get(validatedFlowchartId);
    if (!flowchart) {
      throw new FlowchartNotFoundError(validatedFlowchartId);
    }
    
    const nodeId = flowchart.addNode(validatedText, validatedPosition);
    
    return {
      content: [
        {
          type: 'text',
          text: `Node added with ID: ${nodeId}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error adding node: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function addConnection(args) {
  try {
    const { flowchartId, sourceNodeId, targetNodeId, label = '' } = args;
    
    const validatedFlowchartId = Validator.validateId(flowchartId, 'flowchartId');
    const validatedSourceId = Validator.validateId(sourceNodeId, 'sourceNodeId');
    const validatedTargetId = Validator.validateId(targetNodeId, 'targetNodeId');
    const validatedLabel = label ? Validator.validateText(label, 'connection label') : '';
    
    const flowchart = flowcharts.get(validatedFlowchartId);
    if (!flowchart) {
      throw new FlowchartNotFoundError(validatedFlowchartId);
    }
    
    const sourceNode = flowchart.getNode(validatedSourceId);
    const targetNode = flowchart.getNode(validatedTargetId);
    
    if (!sourceNode) {
      throw new NodeNotFoundError(validatedSourceId);
    }
    
    if (!targetNode) {
      throw new NodeNotFoundError(validatedTargetId);
    }
    
    flowchart.addConnection(validatedSourceId, validatedTargetId, validatedLabel);
    
    return {
      content: [
        {
          type: 'text',
          text: `Connection added from ${validatedSourceId} to ${validatedTargetId}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error adding connection: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function autoLayout(args) {
  try {
    const { flowchartId, algorithm } = args;
    
    const validatedFlowchartId = Validator.validateId(flowchartId, 'flowchartId');
    const validatedAlgorithm = Validator.validateAlgorithm(algorithm);
    
    const flowchart = flowcharts.get(validatedFlowchartId);
    if (!flowchart) {
      throw new FlowchartNotFoundError(validatedFlowchartId);
    }
    
    if (validatedAlgorithm === 'hierarchical') {
      const layout = LayoutEngine.calculateLayout(flowchart);
      flowchart.setLayout(layout);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Layout applied to flowchart ${validatedFlowchartId} using ${validatedAlgorithm} algorithm`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error applying layout: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function exportPdf(args) {
  try {
    const { flowchartId, filename } = args;
    
    const validatedFlowchartId = Validator.validateId(flowchartId, 'flowchartId');
    const validatedFilename = Validator.validateFilename(filename);
    
    const flowchart = flowcharts.get(validatedFlowchartId);
    if (!flowchart) {
      throw new FlowchartNotFoundError(validatedFlowchartId);
    }
    
    const generator = new FlowchartPDFGenerator();
    const result = await generator.generatePDF(flowchart, validatedFilename);
    
    // Convert buffer to base64 for Claude
    const base64Data = result.buffer.toString('base64');
    const dataUri = `data:application/pdf;base64,${base64Data}`;
    
    return {
      content: [
        {
          type: 'text',
          text: `PDF generated successfully: **${result.filename}**\n\n[📄 Download PDF](${dataUri})\n\n*Click the link above to download your flowchart PDF directly in your browser.*\n\nAlternatively, here's the base64 data if you need it:\n\`\`\`\n${base64Data}\n\`\`\``
        }
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error exporting PDF: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

function getTools() {
  return tools;
}

async function callTool(name, args) {
  switch (name) {
    case 'create_flowchart':
      return await createFlowchart(args);
    case 'add_node':
      return await addNode(args);
    case 'add_connection':
      return await addConnection(args);
    case 'auto_layout':
      return await autoLayout(args);
    case 'export_pdf':
      return await exportPdf(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

module.exports = {
  getTools,
  callTool,
};