const ToolHelpers = require('../utils/tool-helpers');

const toolDefinition = {
  name: 'remove_node',
  description: 'Remove a node from a flowchart and automatically clean up all connections involving that node',
  inputSchema: {
    type: 'object',
    properties: {
      flowchartId: {
        type: 'string',
        description: 'ID of the flowchart to remove the node from',
      },
      nodeId: {
        type: 'string',
        description: 'ID of the node to remove',
      },
    },
    required: ['flowchartId', 'nodeId'],
  },
};

async function handler(args, flowcharts) {
  const { flowchartId, nodeId } = args;
  
  const flowchart = ToolHelpers.getFlowchart(flowcharts, flowchartId);
  ToolHelpers.getNode(flowchart, nodeId); // Validate node exists
  
  const removedConnectionsCount = flowchart.removeNode(nodeId);
  
  return ToolHelpers.createSuccessResponse(
    `Node ${nodeId} removed successfully. Cleaned up ${removedConnectionsCount} connection(s).`
  );
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};