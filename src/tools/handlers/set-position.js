const ToolHelpers = require('../utils/tool-helpers');
const Validator = require('../../utils/validation');
const { ValidationError } = require('../../utils/errors');

const toolDefinition = {
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
};

async function handler(args, flowcharts) {
  const { flowchartId, elementId, elementType, x, y } = args;
  
  // Validate input parameters
  const validatedElementId = Validator.validateId(elementId, 'elementId');
  const validatedX = Validator.validatePositionCoordinate(x, 'x');
  const validatedY = Validator.validatePositionCoordinate(y, 'y');
  
  // Validate element type
  if (!elementType || !['node', 'connector'].includes(elementType)) {
    throw new ValidationError('elementType', elementType, 'must be either "node" or "connector"');
  }
  
  const flowchart = ToolHelpers.getFlowchart(flowcharts, flowchartId);
  
  // Validate coordinates are within flowchart bounds
  ToolHelpers.validateCoordinateBounds(flowchart, validatedX, validatedY);
  
  if (elementType === 'node') {
    // Handle node positioning
    const node = ToolHelpers.getNode(flowchart, validatedElementId);
    
    // Update node position
    node.setPosition(validatedX, validatedY);
    
    return ToolHelpers.createSuccessResponse(
      `Node "${validatedElementId}" positioned at (${validatedX}, ${validatedY})`
    );
    
  } else if (elementType === 'connector') {
    // Handle connector positioning
    const connection = ToolHelpers.getConnection(flowchart, validatedElementId);
    
    // For connectors, we'll set a control point or waypoint
    // Initialize pathPoints if it doesn't exist
    if (!connection.pathPoints) {
      connection.pathPoints = [];
    }
    
    // Add or update a waypoint at the specified position
    connection.pathPoints.push({ x: validatedX, y: validatedY });
    
    return ToolHelpers.createSuccessResponse(
      `Connector "${validatedElementId}" updated with waypoint at (${validatedX}, ${validatedY})`
    );
  }
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};