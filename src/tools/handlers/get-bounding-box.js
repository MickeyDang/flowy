const ToolHelpers = require('../utils/tool-helpers');
const Validator = require('../../utils/validation');

const toolDefinition = {
  name: 'get_bounding_box',
  description: 'Get bounding box coordinates for any flowchart element to enable overlap detection',
  inputSchema: {
    type: 'object',
    properties: {
      flowchartId: {
        type: 'string',
        description: 'ID of the flowchart containing the element',
      },
      elementId: {
        type: 'string',
        description: 'ID of the element to get bounding box for',
      },
      elementType: {
        type: 'string',
        enum: ['node', 'connector'],
        description: 'Type of element - either node or connector',
      },
    },
    required: ['flowchartId', 'elementId', 'elementType'],
  },
};

async function handler(args, flowcharts) {
  const { flowchartId, elementId, elementType } = args;
  
  const validatedElementId = Validator.validateId(elementId, 'elementId');
  const flowchart = ToolHelpers.getFlowchart(flowcharts, flowchartId);
  
  let boundingBox;
  
  if (elementType === 'node') {
    const node = ToolHelpers.getNode(flowchart, validatedElementId);
    
    const topLeft = { x: node.x, y: node.y };
    const bottomRight = { x: node.x + node.width, y: node.y + node.height };
    const center = { 
      x: node.x + (node.width / 2), 
      y: node.y + (node.height / 2) 
    };
    
    boundingBox = {
      topLeft,
      bottomRight,
      center,
      width: node.width,
      height: node.height
    };
  } else if (elementType === 'connector') {
    const connection = ToolHelpers.getConnection(flowchart, validatedElementId);
    
    const sourceNode = ToolHelpers.getNode(flowchart, connection.sourceId);
    const targetNode = ToolHelpers.getNode(flowchart, connection.targetId);
    
    let minX, maxX, minY, maxY;
    
    if (connection.pathPoints && connection.pathPoints.length > 0) {
      const allPoints = [
        { x: sourceNode.x + sourceNode.width / 2, y: sourceNode.y + sourceNode.height / 2 },
        ...connection.pathPoints,
        { x: targetNode.x + targetNode.width / 2, y: targetNode.y + targetNode.height / 2 }
      ];
      
      minX = Math.min(...allPoints.map(p => p.x));
      maxX = Math.max(...allPoints.map(p => p.x));
      minY = Math.min(...allPoints.map(p => p.y));
      maxY = Math.max(...allPoints.map(p => p.y));
    } else {
      const sourceCenter = { 
        x: sourceNode.x + sourceNode.width / 2, 
        y: sourceNode.y + sourceNode.height / 2 
      };
      const targetCenter = { 
        x: targetNode.x + targetNode.width / 2, 
        y: targetNode.y + targetNode.height / 2 
      };
      
      minX = Math.min(sourceCenter.x, targetCenter.x);
      maxX = Math.max(sourceCenter.x, targetCenter.x);
      minY = Math.min(sourceCenter.y, targetCenter.y);
      maxY = Math.max(sourceCenter.y, targetCenter.y);
    }
    
    const topLeft = { x: minX, y: minY };
    const bottomRight = { x: maxX, y: maxY };
    const center = { 
      x: minX + (maxX - minX) / 2, 
      y: minY + (maxY - minY) / 2 
    };
    
    boundingBox = {
      topLeft,
      bottomRight,
      center,
      width: maxX - minX,
      height: maxY - minY
    };
  } else {
    throw new Error(`Invalid element type: ${elementType}. Must be 'node' or 'connector'.`);
  }
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(boundingBox, null, 2),
      },
    ],
  };
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};