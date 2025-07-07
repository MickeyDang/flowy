const Validator = require('../../utils/validation');
const { 
  FlowchartNotFoundError, 
  NodeNotFoundError, 
  FileGenerationError, 
  ValidationError,
  ConnectionNotFoundError 
} = require('../../utils/errors');

/**
 * Shared utilities for flowchart tool handlers
 */
class ToolHelpers {
  /**
   * Get and validate flowchart existence
   * @param {Map} flowcharts - The flowcharts Map
   * @param {string} flowchartId - ID of the flowchart
   * @returns {Object} The flowchart object
   * @throws {FlowchartNotFoundError} If flowchart doesn't exist
   */
  static getFlowchart(flowcharts, flowchartId) {
    const validatedFlowchartId = Validator.validateId(flowchartId, 'flowchartId');
    const flowchart = flowcharts.get(validatedFlowchartId);
    
    if (!flowchart) {
      throw new FlowchartNotFoundError(validatedFlowchartId);
    }
    
    return flowchart;
  }
  
  /**
   * Get and validate node existence
   * @param {Object} flowchart - The flowchart object
   * @param {string} nodeId - ID of the node
   * @returns {Object} The node object
   * @throws {NodeNotFoundError} If node doesn't exist
   */
  static getNode(flowchart, nodeId) {
    const validatedNodeId = Validator.validateId(nodeId, 'nodeId');
    const node = flowchart.getNode(validatedNodeId);
    
    if (!node) {
      throw new NodeNotFoundError(validatedNodeId);
    }
    
    return node;
  }
  
  /**
   * Get and validate connection existence
   * @param {Object} flowchart - The flowchart object
   * @param {string} connectionId - ID of the connection
   * @returns {Object} The connection object
   * @throws {ConnectionNotFoundError} If connection doesn't exist
   */
  static getConnection(flowchart, connectionId) {
    const validatedConnectionId = Validator.validateId(connectionId, 'connectionId');
    const connection = flowchart.getConnection(validatedConnectionId);
    
    if (!connection) {
      throw new ConnectionNotFoundError(validatedConnectionId);
    }
    
    return connection;
  }
  
  /**
   * Validate that both source and target nodes exist
   * @param {Object} flowchart - The flowchart object
   * @param {string} sourceNodeId - ID of the source node
   * @param {string} targetNodeId - ID of the target node
   * @throws {NodeNotFoundError} If either node doesn't exist
   */
  static validateNodePair(flowchart, sourceNodeId, targetNodeId) {
    const validatedSourceId = Validator.validateId(sourceNodeId, 'sourceNodeId');
    const validatedTargetId = Validator.validateId(targetNodeId, 'targetNodeId');
    
    const sourceNode = flowchart.getNode(validatedSourceId);
    const targetNode = flowchart.getNode(validatedTargetId);
    
    if (!sourceNode) {
      throw new NodeNotFoundError(validatedSourceId);
    }
    
    if (!targetNode) {
      throw new NodeNotFoundError(validatedTargetId);
    }
    
    return { validatedSourceId, validatedTargetId, sourceNode, targetNode };
  }
  
  /**
   * Validate coordinates are within flowchart bounds
   * @param {Object} flowchart - The flowchart object
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @throws {ValidationError} If coordinates are out of bounds
   */
  static validateCoordinateBounds(flowchart, x, y) {
    if (x < 0 || x > flowchart.slideWidth) {
      throw new ValidationError('x', x, `must be between 0 and ${flowchart.slideWidth} inches`);
    }
    
    if (y < 0 || y > flowchart.slideHeight) {
      throw new ValidationError('y', y, `must be between 0 and ${flowchart.slideHeight} inches`);
    }
  }
  
  /**
   * Create a standard success response
   * @param {string} message - Success message
   * @returns {Object} MCP response object
   */
  static createSuccessResponse(message) {
    return {
      content: [
        {
          type: 'text',
          text: message,
        },
      ],
    };
  }
  
  /**
   * Create a standard error response
   * @param {Error} error - The error object
   * @returns {Object} MCP error response object
   */
  static createErrorResponse(error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
  
  /**
   * Wrap a handler function with standard error handling
   * @param {Function} handlerFn - The handler function to wrap
   * @returns {Function} Wrapped handler function
   */
  static wrapHandler(handlerFn) {
    return async function(args, flowcharts) {
      try {
        return await handlerFn(args, flowcharts);
      } catch (error) {
        return ToolHelpers.createErrorResponse(error);
      }
    };
  }
}

module.exports = ToolHelpers;