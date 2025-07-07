const { v4: uuidv4 } = require('uuid');
const Flowchart = require('../../models/flowchart');
const ToolHelpers = require('../utils/tool-helpers');
const Validator = require('../../utils/validation');

const toolDefinition = {
  name: 'create_flowchart',
  description: 'Create a new empty flowchart',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title of the flowchart',
      },
      width: {
        type: 'number',
        description: 'Optional width of the PowerPoint canvas in inches (default: 10)',
        minimum: 1,
        maximum: 50,
      },
      height: {
        type: 'number',
        description: 'Optional height of the PowerPoint canvas in inches (default: 7.5)',
        minimum: 1,
        maximum: 50,
      },
    },
    required: ['title'],
  },
};

async function handler(args, flowcharts) {
  const { title, width = 10, height = 7.5 } = args;
  const validatedTitle = Validator.validateText(title, 'flowchart title');
  const validatedWidth = Validator.validateDimension(width, 'width');
  const validatedHeight = Validator.validateDimension(height, 'height');
  
  const flowchartId = uuidv4();
  const flowchart = new Flowchart(flowchartId, validatedTitle, validatedWidth, validatedHeight);
  
  flowcharts.set(flowchartId, flowchart);
  
  return ToolHelpers.createSuccessResponse(
    `Flowchart created with ID: ${flowchartId} (${validatedWidth}" × ${validatedHeight}")`
  );
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};