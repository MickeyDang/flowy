const ToolHelpers = require('../utils/tool-helpers');
const Validator = require('../../utils/validation');

const toolDefinition = {
  name: 'add_node',
  description: 'Add a node to an existing flowchart',
  inputSchema: {
    type: 'object',
    properties: {
      flowchartId: {
        type: 'string',
        description: 'ID of the flowchart to add the node to',
      },
      text: {
        type: 'string',
        description: 'Text content of the node',
      },
      positionHint: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
        },
        description: 'Optional position hint for the node',
      },
      shapeType: {
        type: 'string',
        enum: ['rectangle', 'oval', 'diamond'],
        description: 'Shape type of the node (default: rectangle)',
      },
      primaryColor: {
        type: 'string',
        pattern: '^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$',
        description: 'Primary color for the node in hex format (#RGB or #RRGGBB, default: #0277BD)',
      },
    },
    required: ['flowchartId', 'text'],
  },
};

async function handler(args, flowcharts) {
  const { flowchartId, text, positionHint = { x: 0, y: 0 }, shapeType = 'rectangle', primaryColor = '#0277BD' } = args;
  
  const validatedText = Validator.validateText(text, 'node text');
  const validatedPosition = Validator.validatePositionHint(positionHint);
  const validatedShapeType = Validator.validateShapeType(shapeType);
  const validatedPrimaryColor = Validator.validateHexColor(primaryColor);
  
  const flowchart = ToolHelpers.getFlowchart(flowcharts, flowchartId);
  const nodeId = flowchart.addNode(validatedText, validatedPosition, validatedShapeType, validatedPrimaryColor);
  
  return ToolHelpers.createSuccessResponse(`Node added with ID: ${nodeId}`);
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};