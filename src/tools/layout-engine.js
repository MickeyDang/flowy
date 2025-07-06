const Positioning = require('../utils/positioning');

//TODO: I think we need to rethink layout engine to let Claude have more granular control over rectangle positioning 
// rather than just using the hierarchical layout.
class LayoutEngine {
  static calculateLayout(flowchart) {
    const { FileGenerationError } = require('../utils/errors');
    
    try {
      if (!flowchart || !flowchart.nodes) {
        throw new FileGenerationError('Invalid flowchart object provided for layout calculation');
      }
      
      if (flowchart.nodes.size === 0) {
        return {
          nodes: new Map(),
          connections: [],
        };
      }
      
      Positioning.hierarchicalLayout(flowchart);
      
      const layout = {
        nodes: new Map(),
        connections: [],
      };
      
      flowchart.nodes.forEach((node, nodeId) => {
        if (node && typeof node.x === 'number' && typeof node.y === 'number') {
          layout.nodes.set(nodeId, {
            x: node.x,
            y: node.y,
            width: node.width || 1,
            height: node.height || 0.5,
          });
        }
      });
      
      layout.connections = this.calculateConnectionPaths(flowchart.connections || [], flowchart.nodes);
      
      return layout;
    } catch (error) {
      throw new FileGenerationError(`Failed to calculate layout: ${error.message}`, error);
    }
  }
  
  static calculateConnectionPaths(connections, nodesMap) {
    return connections.map(conn => {
      const sourceNode = nodesMap.get(conn.sourceId);
      const targetNode = nodesMap.get(conn.targetId);
      
      if (!sourceNode || !targetNode) {
        return null;
      }
      
      const connectionPoints = Positioning.calculateConnectionPoints(sourceNode, targetNode);
      
      return {
        sourceId: conn.sourceId,
        targetId: conn.targetId,
        label: conn.label,
        path: connectionPoints,
      };
    }).filter(conn => conn !== null);
  }
}

module.exports = LayoutEngine;