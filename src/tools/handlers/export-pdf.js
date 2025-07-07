const FlowchartPDFGenerator = require('../../utils/pdf-generator');
const ToolHelpers = require('../utils/tool-helpers');
const Validator = require('../../utils/validation');

const toolDefinition = {
  name: 'export_pdf',
  description: 'Export a flowchart as a PDF document for download',
  inputSchema: {
    type: 'object',
    properties: {
      flowchartId: {
        type: 'string',
        description: 'ID of the flowchart to export',
      },
      filename: {
        type: 'string',
        description: 'Output filename for PDF (without extension)',
      },
    },
    required: ['flowchartId', 'filename'],
  },
};

async function handler(args, flowcharts) {
  const { flowchartId, filename } = args;
  
  const validatedFilename = Validator.validateFilename(filename);
  const flowchart = ToolHelpers.getFlowchart(flowcharts, flowchartId);
  
  const generator = new FlowchartPDFGenerator();
  const result = await generator.generatePDF(flowchart, validatedFilename);
  
  // Convert buffer to base64 for Claude
  const base64Data = result.buffer.toString('base64');
  const dataUri = `data:application/pdf;base64,${base64Data}`;
  
  return {
    content: [
      {
        type: 'text',
        text: `PDF generated successfully: **${result.filename}**\n\n[📄 Download PDF](${dataUri})\n\n*Click the link above to download your flowchart PDF directly in your browser.*\n\nAlternatively, here's the base64 data if you need it:\n\`\`\`\n${base64Data}\n\`\`\``
      }
    ],
  };
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};