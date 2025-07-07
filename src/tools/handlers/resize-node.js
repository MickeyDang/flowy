const ToolHelpers = require('../utils/tool-helpers');
const Validator = require('../../utils/validation');
const { ValidationError } = require('../../utils/errors');

const toolDefinition = {
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
};

async function handler(args, flowcharts) {
  const { flowchartId, nodeId, width, height } = args;
  
  // Validate input parameters
  const validatedWidth = Validator.validateDimension(width, 'width');
  const validatedHeight = Validator.validateDimension(height, 'height');
  
  // Additional bounds checking for node dimensions
  if (validatedWidth < 0.1 || validatedWidth > 20) {
    throw new ValidationError('width', validatedWidth, 'must be between 0.1 and 20 inches');
  }
  
  if (validatedHeight < 0.1 || validatedHeight > 15) {
    throw new ValidationError('height', validatedHeight, 'must be between 0.1 and 15 inches');
  }
  
  const flowchart = ToolHelpers.getFlowchart(flowcharts, flowchartId);
  const node = ToolHelpers.getNode(flowchart, nodeId);
  
  // Update node dimensions using the existing setSize method
  node.setSize(validatedWidth, validatedHeight);
  
  return ToolHelpers.createSuccessResponse(
    `Node "${nodeId}" resized to ${validatedWidth}" × ${validatedHeight}"`
  );
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};