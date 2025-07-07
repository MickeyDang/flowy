const LayoutEngine = require('../layout-engine');
const ToolHelpers = require('../utils/tool-helpers');
const Validator = require('../../utils/validation');

const toolDefinition = {
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
};

async function handler(args, flowcharts) {
  const { flowchartId, algorithm } = args;
  
  const validatedAlgorithm = Validator.validateAlgorithm(algorithm);
  const flowchart = ToolHelpers.getFlowchart(flowcharts, flowchartId);
  
  if (validatedAlgorithm === 'hierarchical') {
    const layout = LayoutEngine.calculateLayout(flowchart);
    flowchart.setLayout(layout);
  }
  
  return ToolHelpers.createSuccessResponse(
    `Layout applied to flowchart ${flowchartId} using ${validatedAlgorithm} algorithm`
  );
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};