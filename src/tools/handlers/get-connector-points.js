const ToolHelpers = require('../utils/tool-helpers');
const Validator = require('../../utils/validation');
const Positioning = require('../../utils/positioning');

const toolDefinition = {
  name: 'get_connector_points',
  description: 'Get the start and end coordinates of any connector/arrow',
  inputSchema: {
    type: 'object',
    properties: {
      flowchartId: {
        type: 'string',
        description: 'ID of the flowchart containing the connection',
      },
      connectionId: {
        type: 'string',
        description: 'ID of the connection to get points for',
      },
    },
    required: ['flowchartId', 'connectionId'],
  },
};

async function handler(args, flowcharts) {
  const { flowchartId, connectionId } = args;
  
  const validatedConnectionId = Validator.validateId(connectionId, 'connectionId');
  const flowchart = ToolHelpers.getFlowchart(flowcharts, flowchartId);
  const connection = ToolHelpers.getConnection(flowchart, validatedConnectionId);
  
  const sourceNode = ToolHelpers.getNode(flowchart, connection.sourceId);
  const targetNode = ToolHelpers.getNode(flowchart, connection.targetId);
  
  const connectionPoints = Positioning.calculateConnectionPoints(sourceNode, targetNode);
  
  const result = {
    sourceNodeId: connection.sourceId,
    targetNodeId: connection.targetId,
    startPoint: {
      x: connectionPoints.startX,
      y: connectionPoints.startY
    },
    endPoint: {
      x: connectionPoints.endX,
      y: connectionPoints.endY
    },
    label: connection.label || ''
  };
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};