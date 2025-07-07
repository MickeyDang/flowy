const ToolHelpers = require('../utils/tool-helpers');
const Validator = require('../../utils/validation');

const toolDefinition = {
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
};

async function handler(args, flowcharts) {
  const { flowchartId, sourceNodeId, targetNodeId, label = '' } = args;
  
  const validatedLabel = label ? Validator.validateText(label, 'connection label') : '';
  
  const flowchart = ToolHelpers.getFlowchart(flowcharts, flowchartId);
  const { validatedSourceId, validatedTargetId } = ToolHelpers.validateNodePair(
    flowchart, sourceNodeId, targetNodeId
  );
  
  const connectionId = flowchart.addConnection(validatedSourceId, validatedTargetId, validatedLabel);
  
  return ToolHelpers.createSuccessResponse(`Connection added with ID: ${connectionId}`);
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};