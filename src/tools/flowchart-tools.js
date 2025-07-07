const { v4: uuidv4 } = require('uuid');
const Flowchart = require('../models/flowchart');
const LayoutEngine = require('./layout-engine');
const FlowchartPDFGenerator = require('../utils/pdf-generator');
const { FlowchartSVGGenerator } = require('../utils/svg-generator');
const Validator = require('../utils/validation');
const { 
  FlowchartNotFoundError, 
  NodeNotFoundError, 
  FileGenerationError, 
  ValidationError,
  ConnectionNotFoundError 
} = require('../utils/errors');

//TODO: There is still some wonky issue with export_svg where the layout is getting cut off. Need to fix.
//TODO: Also need to fix the weird non-blocking errors that pop up when the svg tool is called in my Claude app window.
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
        width: {
          type: 'number',
          description: 'Optional width of the PowerPoint canvas in inches (default: 10)',
          minimum: 1,
          maximum: 50,
        },
        height: {
          type: 'number',
          description: 'Optional height of the PowerPoint canvas in inches (default: 7.5)',
          minimum: 1,
          maximum: 50,
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
  {
    name: 'export_svg',
    description: 'Export a flowchart as an SVG for inline display',
    inputSchema: {
      type: 'object',
      properties: {
        flowchartId: {
          type: 'string',
          description: 'ID of the flowchart to export',
        },
        filename: {
          type: 'string',
          description: 'Output filename for SVG (without extension)',
        },
        width: {
          type: 'number',
          description: 'Optional width for the SVG in pixels (default: 400)',
          minimum: 200,
          maximum: 1200,
        },
        height: {
          type: 'number',
          description: 'Optional height for the SVG in pixels (default: 600)',
          minimum: 200,
          maximum: 1200,
        },
      },
      required: ['flowchartId', 'filename'],
    },
  },
  {
    name: 'set_position',
    description: 'Set the position of a flowchart element (node or connector) to specific x,y coordinates',
    inputSchema: {
      type: 'object',
      properties: {
        flowchartId: {
          type: 'string',
          description: 'ID of the flowchart containing the element',
        },
        elementId: {
          type: 'string',
          description: 'ID of the element to position (node ID or connection ID)',
        },
        elementType: {
          type: 'string',
          enum: ['node', 'connector'],
          description: 'Type of element to position',
        },
        x: {
          type: 'number',
          description: 'X coordinate position in inches',
        },
        y: {
          type: 'number',
          description: 'Y coordinate position in inches',
        },
      },
      required: ['flowchartId', 'elementId', 'elementType', 'x', 'y'],
    },
  },
  {
    name: 'resize_node',
    description: 'Resize a flowchart node to specific width and height dimensions',
    inputSchema: {
      type: 'object',
      properties: {
        flowchartId: {
          type: 'string',
          description: 'ID of the flowchart containing the node',
        },
        nodeId: {
          type: 'string',
          description: 'ID of the node to resize',
        },
        width: {
          type: 'number',
          description: 'New width of the node in inches',
          minimum: 0.1,
          maximum: 20,
        },
        height: {
          type: 'number',
          description: 'New height of the node in inches',
          minimum: 0.1,
          maximum: 15,
        },
      },
      required: ['flowchartId', 'nodeId', 'width', 'height'],
    },
  },
];

const flowcharts = new Map();

async function createFlowchart(args) {
  try {
    const { title, width = 10, height = 7.5 } = args;
    const validatedTitle = Validator.validateText(title, 'flowchart title');
    const validatedWidth = Validator.validateDimension(width, 'width');
    const validatedHeight = Validator.validateDimension(height, 'height');
    
    const flowchartId = uuidv4();
    const flowchart = new Flowchart(flowchartId, validatedTitle, validatedWidth, validatedHeight);
    
    flowcharts.set(flowchartId, flowchart);
    
    return {
      content: [
        {
          type: 'text',
          text: `Flowchart created with ID: ${flowchartId} (${validatedWidth}" × ${validatedHeight}")`,
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
    
    const connectionId = flowchart.addConnection(validatedSourceId, validatedTargetId, validatedLabel);
    
    return {
      content: [
        {
          type: 'text',
          text: `Connection added with ID: ${connectionId}`,
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

async function exportSvg(args) {
  try {
    const { flowchartId, filename, width = 400, height = 600 } = args;
    
    const validatedFlowchartId = Validator.validateId(flowchartId, 'flowchartId');
    const validatedFilename = Validator.validateFilename(filename);
    
    // Validate width and height parameters
    const validatedWidth = typeof width === 'number' && width >= 200 && width <= 1200 ? width : 400;
    const validatedHeight = typeof height === 'number' && height >= 200 && height <= 1200 ? height : 600;
    
    const flowchart = flowcharts.get(validatedFlowchartId);
    if (!flowchart) {
      throw new FlowchartNotFoundError(validatedFlowchartId);
    }
    
    // Debug logging
    console.log('SVG Export - Flowchart data:', {
      id: flowchart.id,
      title: flowchart.title,
      nodesCount: flowchart.nodes ? flowchart.nodes.size : 0,
      connectionsCount: flowchart.connections ? flowchart.connections.length : 0,
      hasLayout: !!flowchart.layout,
      width: validatedWidth,
      height: validatedHeight
    });
    
    const generator = new FlowchartSVGGenerator();
    const svgContent = generator.generateSVG(flowchart, validatedWidth, validatedHeight);
    
    return {
      content: [
        {
          type: 'text',
          text: `SVG generated successfully: **${validatedFilename}.svg** (${validatedWidth}×${validatedHeight}px)\n\n${svgContent}`
        }
      ],
    };
  } catch (error) {
    console.error('SVG Export Error:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error exporting SVG: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function setPosition(args) {
  try {
    const { flowchartId, elementId, elementType, x, y } = args;
    
    // Validate input parameters
    const validatedFlowchartId = Validator.validateId(flowchartId, 'flowchartId');
    const validatedElementId = Validator.validateId(elementId, 'elementId');
    const validatedX = Validator.validatePositionCoordinate(x, 'x');
    const validatedY = Validator.validatePositionCoordinate(y, 'y');
    
    // Validate element type
    if (!elementType || !['node', 'connector'].includes(elementType)) {
      throw new ValidationError('elementType', elementType, 'must be either "node" or "connector"');
    }
    
    const flowchart = flowcharts.get(validatedFlowchartId);
    if (!flowchart) {
      throw new FlowchartNotFoundError(validatedFlowchartId);
    }
    
    // Validate coordinates are within flowchart bounds
    if (validatedX < 0 || validatedX > flowchart.slideWidth) {
      throw new ValidationError('x', validatedX, `must be between 0 and ${flowchart.slideWidth} inches`);
    }
    
    if (validatedY < 0 || validatedY > flowchart.slideHeight) {
      throw new ValidationError('y', validatedY, `must be between 0 and ${flowchart.slideHeight} inches`);
    }
    
    let result;
    
    if (elementType === 'node') {
      // Handle node positioning
      const node = flowchart.getNode(validatedElementId);
      if (!node) {
        throw new NodeNotFoundError(validatedElementId);
      }
      
      // Update node position
      node.setPosition(validatedX, validatedY);
      
      result = {
        content: [
          {
            type: 'text',
            text: `Node "${validatedElementId}" positioned at (${validatedX}, ${validatedY})`,
          },
        ],
      };
      
    } else if (elementType === 'connector') {
      // Handle connector positioning
      const connection = flowchart.getConnection(validatedElementId);
      if (!connection) {
        throw new ConnectionNotFoundError(validatedElementId);
      }
      
      // For connectors, we'll set a control point or waypoint
      // Initialize pathPoints if it doesn't exist
      if (!connection.pathPoints) {
        connection.pathPoints = [];
      }
      
      // Add or update a waypoint at the specified position
      connection.pathPoints.push({ x: validatedX, y: validatedY });
      
      result = {
        content: [
          {
            type: 'text',
            text: `Connector "${validatedElementId}" updated with waypoint at (${validatedX}, ${validatedY})`,
          },
        ],
      };
    }
    
    return result;
    
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error setting position: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function resizeNode(args) {
  try {
    const { flowchartId, nodeId, width, height } = args;
    
    // Validate input parameters
    const validatedFlowchartId = Validator.validateId(flowchartId, 'flowchartId');
    const validatedNodeId = Validator.validateId(nodeId, 'nodeId');
    const validatedWidth = Validator.validateDimension(width, 'width');
    const validatedHeight = Validator.validateDimension(height, 'height');
    
    // Additional bounds checking for node dimensions
    if (validatedWidth < 0.1 || validatedWidth > 20) {
      throw new ValidationError('width', validatedWidth, 'must be between 0.1 and 20 inches');
    }
    
    if (validatedHeight < 0.1 || validatedHeight > 15) {
      throw new ValidationError('height', validatedHeight, 'must be between 0.1 and 15 inches');
    }
    
    const flowchart = flowcharts.get(validatedFlowchartId);
    if (!flowchart) {
      throw new FlowchartNotFoundError(validatedFlowchartId);
    }
    
    const node = flowchart.getNode(validatedNodeId);
    if (!node) {
      throw new NodeNotFoundError(validatedNodeId);
    }
    
    // Update node dimensions using the existing setSize method
    node.setSize(validatedWidth, validatedHeight);
    
    return {
      content: [
        {
          type: 'text',
          text: `Node "${validatedNodeId}" resized to ${validatedWidth}" × ${validatedHeight}"`,
        },
      ],
    };
    
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error resizing node: ${error.message}`,
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
    case 'export_svg':
      return await exportSvg(args);
    case 'set_position':
      return await setPosition(args);
    case 'resize_node':
      return await resizeNode(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

module.exports = {
  getTools,
  callTool,
};