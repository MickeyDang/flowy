const { FlowchartSVGGenerator } = require('../../utils/svg-generator');
const ToolHelpers = require('../utils/tool-helpers');
const Validator = require('../../utils/validation');

const toolDefinition = {
  name: 'export_svg',
  description: 'Export a flowchart as an SVG for inline display',
  inputSchema: {
    type: 'object',
    properties: {
      flowchartId: {
        type: 'string',
        description: 'ID of the flowchart to export',
      },
      filename: {
        type: 'string',
        description: 'Output filename for SVG (without extension)',
      },
      width: {
        type: 'number',
        description: 'Optional width for the SVG in pixels (default: 400)',
        minimum: 200,
        maximum: 1200,
      },
      height: {
        type: 'number',
        description: 'Optional height for the SVG in pixels (default: 600)',
        minimum: 200,
        maximum: 1200,
      },
    },
    required: ['flowchartId', 'filename'],
  },
};

async function handler(args, flowcharts) {
  const { flowchartId, filename, width = 400, height = 600 } = args;
  
  const validatedFilename = Validator.validateFilename(filename);
  
  // Validate width and height parameters
  const validatedWidth = typeof width === 'number' && width >= 200 && width <= 1200 ? width : 400;
  const validatedHeight = typeof height === 'number' && height >= 200 && height <= 1200 ? height : 600;
  
  const flowchart = ToolHelpers.getFlowchart(flowcharts, flowchartId);
  
  // Debug logging
  console.log('SVG Export - Flowchart data:', {
    id: flowchart.id,
    title: flowchart.title,
    nodesCount: flowchart.nodes ? flowchart.nodes.size : 0,
    connectionsCount: flowchart.connections ? flowchart.connections.length : 0,
    hasLayout: !!flowchart.layout,
    width: validatedWidth,
    height: validatedHeight
  });
  
  const generator = new FlowchartSVGGenerator();
  const svgContent = generator.generateSVG(flowchart, validatedWidth, validatedHeight);
  
  return {
    content: [
      {
        type: 'text',
        text: `SVG generated successfully: **${validatedFilename}.svg** (${validatedWidth}×${validatedHeight}px)\n\n${svgContent}`
      }
    ],
  };
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};