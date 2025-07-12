const ToolHelpers = require('../utils/tool-helpers');
const Validator = require('../../utils/validation');

const toolDefinition = {
  name: 'set_node_shape',
  description: 'Change the shape type of an existing node in a flowchart',
  inputSchema: {
    type: 'object',
    properties: {
      flowchartId: {
        type: 'string',
        description: 'ID of the flowchart containing the node',
      },
      nodeId: {
        type: 'string',
        description: 'ID of the node to change the shape of',
      },
      shapeType: {
        type: 'string',
        enum: ['rectangle', 'oval', 'diamond'],
        description: 'New shape type for the node',
      },
    },
    required: ['flowchartId', 'nodeId', 'shapeType'],
  },
};

async function handler(args, flowcharts) {
  const { flowchartId, nodeId, shapeType } = args;
  
  const validatedNodeId = Validator.validateId(nodeId, 'nodeId');
  const validatedShapeType = Validator.validateShapeType(shapeType);
  
  const flowchart = ToolHelpers.getFlowchart(flowcharts, flowchartId);
  const node = ToolHelpers.getNode(flowchart, validatedNodeId);
  
  node.setShapeType(validatedShapeType);
  
  return ToolHelpers.createSuccessResponse(`Node ${validatedNodeId} shape changed to ${validatedShapeType}`);
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};