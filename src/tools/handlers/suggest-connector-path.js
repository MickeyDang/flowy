const ToolHelpers = require('../utils/tool-helpers');
const PathRouting = require('../../utils/path-routing');

const toolDefinition = {
  name: 'suggest_connector_path',
  description: 'Generate aesthetically pleasing path points between two nodes with smart routing and obstacle avoidance',
  inputSchema: {
    type: 'object',
    properties: {
      flowchartId: {
        type: 'string',
        description: 'ID of the flowchart containing the nodes',
      },
      sourceNodeId: {
        type: 'string',
        description: 'ID of the source node',
      },
      targetNodeId: {
        type: 'string',
        description: 'ID of the target node',
      },
      routingStyle: {
        type: 'string',
        enum: ['straight', 'orthogonal', 'curved'],
        description: 'Routing style for the connector path',
        default: 'orthogonal'
      },
      options: {
        type: 'object',
        description: 'Optional routing configuration',
        properties: {
          avoidObstacles: {
            type: 'boolean',
            description: 'Whether to avoid other nodes when routing',
            default: true
          },
          curveRadius: {
            type: 'number',
            description: 'Radius for curved paths (in inches)',
            default: 0.2,
            minimum: 0.1,
            maximum: 1.0
          },
          minSegmentLength: {
            type: 'number',
            description: 'Minimum segment length for orthogonal paths (in inches)',
            default: 0.3,
            minimum: 0.1
          },
          padding: {
            type: 'number',
            description: 'Padding around obstacles for avoidance (in inches)',
            default: 0.1,
            minimum: 0.05,
            maximum: 0.5
          }
        },
        additionalProperties: false
      }
    },
    required: ['flowchartId', 'sourceNodeId', 'targetNodeId'],
  },
};

async function handler(args, flowcharts) {
  const { 
    flowchartId, 
    sourceNodeId, 
    targetNodeId, 
    routingStyle = 'orthogonal',
    options = {}
  } = args;
  
  // Validate inputs
  const flowchart = ToolHelpers.getFlowchart(flowcharts, flowchartId);
  const sourceNode = ToolHelpers.getNode(flowchart, sourceNodeId);
  const targetNode = ToolHelpers.getNode(flowchart, targetNodeId);
  
  // Validate routing style
  const validatedRoutingStyle = PathRouting.validateRoutingStyle(routingStyle);
  
  // Validate and set default options
  const routingOptions = {
    avoidObstacles: options.avoidObstacles !== false, // default true
    curveRadius: Math.max(0.1, Math.min(1.0, options.curveRadius || 0.2)),
    minSegmentLength: Math.max(0.1, options.minSegmentLength || 0.3),
    padding: Math.max(0.05, Math.min(0.5, options.padding || 0.1))
  };
  
  // Get all nodes for obstacle detection
  const allNodes = Array.from(flowchart.nodes.values());
  
  // Generate optimal path
  const pathResult = PathRouting.generatePath(
    sourceNode, 
    targetNode, 
    allNodes, 
    validatedRoutingStyle, 
    routingOptions
  );
  
  // Round coordinates to reasonable precision
  const roundedPathPoints = pathResult.pathPoints.map(point => ({
    x: Math.round(point.x * 1000) / 1000,
    y: Math.round(point.y * 1000) / 1000
  }));
  
  // Create comprehensive result
  const result = {
    pathPoints: roundedPathPoints,
    routingInfo: {
      style: pathResult.routingStyle,
      reasoning: pathResult.reasoning,
      startPoint: {
        x: Math.round(pathResult.startPoint.x * 1000) / 1000,
        y: Math.round(pathResult.startPoint.y * 1000) / 1000
      },
      endPoint: {
        x: Math.round(pathResult.endPoint.x * 1000) / 1000,
        y: Math.round(pathResult.endPoint.y * 1000) / 1000
      },
      obstaclesConsidered: allNodes.length - 2, // excluding source and target
      optionsUsed: routingOptions
    },
    usage: {
      description: 'Use these pathPoints with the set_connector_path tool',
      example: `set_connector_path(flowchartId: "${flowchartId}", connectionId: "your_connection_id", pathPoints: pathPoints)`
    }
  };
  
  // Return formatted response
  return {
    content: [
      {
        type: 'text',
        text: `Generated ${validatedRoutingStyle} path with ${roundedPathPoints.length} points.\n\nReasoning: ${pathResult.reasoning}\n\nPath points:\n${JSON.stringify(result, null, 2)}`,
      },
    ],
  };
}

module.exports = { 
  toolDefinition, 
  handler: ToolHelpers.wrapHandler(handler) 
};