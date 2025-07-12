const ToolHelpers = require('../utils/tool-helpers');

const toolDefinition = {
  name: 'remove_connection',
  description: 'Remove a specific connection from a flowchart by connection ID',
  inputSchema: {
    type: 'object',
    properties: {
      flowchartId: {
        type: 'string',
        description: 'ID of the flowchart to remove the connection from',
      },
      connectionId: {
        type: 'string',
        description: 'ID of the connection to remove',
      },
    },
    required: ['flowchartId', 'connectionId'],
  },
};

async function handler(args, flowcharts) {
  const { flowchartId, connectionId } = args;
  
  const flowchart = ToolHelpers.getFlowchart(flowcharts, flowchartId);
  ToolHelpers.getConnection(flowchart, connectionId); // Validate connection exists
  
  flowchart.removeConnectionById(connectionId);
  
  return ToolHelpers.createSuccessResponse(
    `Connection ${connectionId} removed successfully.`
  );
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};