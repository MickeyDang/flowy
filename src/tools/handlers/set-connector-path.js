const ToolHelpers = require('../utils/tool-helpers');
const Validator = require('../../utils/validation');

const toolDefinition = {
  name: 'set_connector_path',
  description: 'Define custom bent/curved paths for connectors using custom geometry',
  inputSchema: {
    type: 'object',
    properties: {
      flowchartId: {
        type: 'string',
        description: 'ID of the flowchart containing the connection',
      },
      connectionId: {
        type: 'string',
        description: 'ID of the connection to set path for',
      },
      pathPoints: {
        type: 'array',
        description: 'Array of path points defining the connector path from source to target',
        items: {
          type: 'object',
          properties: {
            x: {
              type: 'number',
              description: 'X coordinate in slide inches',
            },
            y: {
              type: 'number',
              description: 'Y coordinate in slide inches',
            },
          },
          required: ['x', 'y'],
        },
        minItems: 2,
      },
    },
    required: ['flowchartId', 'connectionId', 'pathPoints'],
  },
};

function validatePathPoints(pathPoints) {
  if (!Array.isArray(pathPoints)) {
    throw new Error('pathPoints must be an array');
  }
  
  if (pathPoints.length < 2) {
    throw new Error('pathPoints must contain at least 2 points');
  }
  
  pathPoints.forEach((point, index) => {
    if (!point || typeof point !== 'object') {
      throw new Error(`pathPoints[${index}] must be an object`);
    }
    
    if (typeof point.x !== 'number' || !Number.isFinite(point.x)) {
      throw new Error(`pathPoints[${index}].x must be a finite number`);
    }
    
    if (typeof point.y !== 'number' || !Number.isFinite(point.y)) {
      throw new Error(`pathPoints[${index}].y must be a finite number`);
    }
  });
  
  return pathPoints;
}

async function handler(args, flowcharts) {
  const { flowchartId, connectionId, pathPoints } = args;
  
  const validatedConnectionId = Validator.validateId(connectionId, 'connectionId');
  const validatedPathPoints = validatePathPoints(pathPoints);
  
  const flowchart = ToolHelpers.getFlowchart(flowcharts, flowchartId);
  const connection = ToolHelpers.getConnection(flowchart, validatedConnectionId);
  
  // Validate path points are within flowchart bounds
  validatedPathPoints.forEach((point, index) => {
    try {
      ToolHelpers.validateCoordinateBounds(flowchart, point.x, point.y);
    } catch (error) {
      throw new Error(`pathPoints[${index}]: ${error.message}`);
    }
  });
  
  // Update the connection with custom path points
  connection.pathPoints = validatedPathPoints;
  
  return ToolHelpers.createSuccessResponse(
    `Custom path set for connection ${validatedConnectionId} with ${validatedPathPoints.length} points`
  );
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};