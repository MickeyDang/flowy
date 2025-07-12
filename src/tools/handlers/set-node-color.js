const ToolHelpers = require('../utils/tool-helpers');
const Validator = require('../../utils/validation');

const toolDefinition = {
  name: 'set_node_color',
  description: 'Change the primary color of an existing node in a flowchart',
  inputSchema: {
    type: 'object',
    properties: {
      flowchartId: {
        type: 'string',
        description: 'ID of the flowchart containing the node',
      },
      nodeId: {
        type: 'string',
        description: 'ID of the node to change the color of',
      },
      primaryColor: {
        type: 'string',
        pattern: '^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$',
        description: 'Primary color for the node in hex format (#RGB or #RRGGBB)',
      },
    },
    required: ['flowchartId', 'nodeId', 'primaryColor'],
  },
};

async function handler(args, flowcharts) {
  const { flowchartId, nodeId, primaryColor } = args;
  
  const validatedNodeId = Validator.validateId(nodeId, 'nodeId');
  const validatedPrimaryColor = Validator.validateHexColor(primaryColor);
  
  const flowchart = ToolHelpers.getFlowchart(flowcharts, flowchartId);
  const node = ToolHelpers.getNode(flowchart, validatedNodeId);
  
  node.setPrimaryColor(validatedPrimaryColor);
  
  return ToolHelpers.createSuccessResponse(`Node ${validatedNodeId} primary color changed to ${validatedPrimaryColor}`);
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};