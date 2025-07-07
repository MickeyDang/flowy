class Positioning {
  static hierarchicalLayout(flowchart) {
    const nodes = Array.from(flowchart.nodes.values());
    const connections = flowchart.connections;
    
    if (nodes.length === 0) {
      return;
    }
    
    const rootNodes = this.findRootNodes(nodes, connections);
    const levels = this.assignLevels(rootNodes, nodes, connections);
    
    this.positionNodes(nodes, levels, flowchart.slideWidth, flowchart.slideHeight);
  }
  
  static findRootNodes(nodes, connections) {
    const hasIncoming = new Set();
    connections.forEach(conn => {
      hasIncoming.add(conn.targetId);
    });
    
    return nodes.filter(node => !hasIncoming.has(node.id));
  }
  
  static assignLevels(rootNodes, nodes, connections) {
    const levels = new Map();
    const incomingCounts = new Map();
    const processedCounts = new Map();
    
    // Initialize all nodes
    nodes.forEach(node => {
      incomingCounts.set(node.id, 0);
      processedCounts.set(node.id, 0);
    });
    
    // Count incoming connections for each node
    connections.forEach(conn => {
      const targetId = conn.targetId;
      incomingCounts.set(targetId, incomingCounts.get(targetId) + 1);
    });
    
    // Initialize root nodes
    rootNodes.forEach(node => {
      levels.set(node.id, 0);
    });
    
    // Process nodes level by level using topological sort approach
    let changed = true;
    while (changed) {
      changed = false;
      
      nodes.forEach(node => {
        const nodeId = node.id;
        
        // Skip if already processed
        if (levels.has(nodeId)) {
          // Check if we can update level based on incoming connections
          const incomingConnections = connections.filter(conn => conn.targetId === nodeId);
          let maxSourceLevel = -1;
          let allSourcesProcessed = true;
          
          incomingConnections.forEach(conn => {
            if (levels.has(conn.sourceId)) {
              maxSourceLevel = Math.max(maxSourceLevel, levels.get(conn.sourceId));
            } else {
              allSourcesProcessed = false;
            }
          });
          
          if (allSourcesProcessed && maxSourceLevel >= 0) {
            const newLevel = maxSourceLevel + 1;
            if (levels.get(nodeId) < newLevel) {
              levels.set(nodeId, newLevel);
              changed = true;
            }
          }
        } else {
          // Process node if all its sources have been processed
          const incomingConnections = connections.filter(conn => conn.targetId === nodeId);
          
          if (incomingConnections.length === 0) {
            // This is a root node
            levels.set(nodeId, 0);
            changed = true;
          } else {
            let maxSourceLevel = -1;
            let allSourcesProcessed = true;
            
            incomingConnections.forEach(conn => {
              if (levels.has(conn.sourceId)) {
                maxSourceLevel = Math.max(maxSourceLevel, levels.get(conn.sourceId));
              } else {
                allSourcesProcessed = false;
              }
            });
            
            if (allSourcesProcessed && maxSourceLevel >= 0) {
              levels.set(nodeId, maxSourceLevel + 1);
              changed = true;
            }
          }
        }
      });
    }
    
    return levels;
  }
  
  static positionNodes(nodes, levels, slideWidth, slideHeight) {
    const levelSpacing = 1.5;
    const margin = 0.5;
    
    const levelGroups = new Map();
    levels.forEach((level, nodeId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level).push(nodeId);
    });
    
    const startY = margin;
    
    levelGroups.forEach((nodeIds, level) => {
      const y = startY + (level * levelSpacing);
      
      const nodesInLevel = nodeIds.map(id => nodes.find(node => node.id === id));
      const totalWidth = nodesInLevel.reduce((sum, node) => sum + node.width, 0);
      const spacing = nodeIds.length > 1 ? (slideWidth - totalWidth - 2 * margin) / (nodeIds.length - 1) : 0;
      
      let currentX = margin;
      
      nodesInLevel.forEach((node, index) => {
        node.setPosition(currentX, y);
        currentX += node.width + spacing;
      });
    });
  }
  
  static calculateConnectionPoints(sourceNode, targetNode) {
    const sourceCenterX = sourceNode.x + sourceNode.width / 2;
    const sourceCenterY = sourceNode.y + sourceNode.height / 2;
    const targetCenterX = targetNode.x + targetNode.width / 2;
    const targetCenterY = targetNode.y + targetNode.height / 2;
    
    const dx = targetCenterX - sourceCenterX;
    const dy = targetCenterY - sourceCenterY;
    
    let startX, startY, endX, endY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        startX = sourceNode.x + sourceNode.width;
        startY = sourceCenterY;
        endX = targetNode.x;
        endY = targetCenterY;
      } else {
        startX = sourceNode.x;
        startY = sourceCenterY;
        endX = targetNode.x + targetNode.width;
        endY = targetCenterY;
      }
    } else {
      if (dy > 0) {
        startX = sourceCenterX;
        startY = sourceNode.y + sourceNode.height;
        endX = targetCenterX;
        endY = targetNode.y;
      } else {
        startX = sourceCenterX;
        startY = sourceNode.y;
        endX = targetCenterX;
        endY = targetNode.y + targetNode.height;
      }
    }
    
    return { startX, startY, endX, endY };
  }
  
  static calculateBoundingBox(nodes) {
    if (!nodes || nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });
    
    return { minX, minY, maxX, maxY };
  }
  
  static centerLayout(nodes, containerWidth, containerHeight) {
    const bbox = this.calculateBoundingBox(nodes);
    const layoutWidth = bbox.maxX - bbox.minX;
    const layoutHeight = bbox.maxY - bbox.minY;
    
    const offsetX = (containerWidth - layoutWidth) / 2 - bbox.minX;
    const offsetY = (containerHeight - layoutHeight) / 2 - bbox.minY;
    
    return nodes.map(node => ({
      ...node,
      x: node.x + offsetX,
      y: node.y + offsetY,
    }));
  }
  
  /**
   * Calculate bounding box for a path defined by points
   * @param {Array} pathPoints - Array of {x, y} points defining the path
   * @returns {Object} Bounding box with minX, minY, maxX, maxY
   */
  static calculateBoundingBoxForPath(pathPoints) {
    if (!pathPoints || pathPoints.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    pathPoints.forEach(point => {
      if (point && typeof point.x === 'number' && typeof point.y === 'number') {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
    });
    
    // If no valid points were found, return zero bounding box
    if (minX === Infinity) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    
    return { minX, minY, maxX, maxY };
  }
  
  /**
   * Check if two bounding boxes overlap
   * @param {Object} box1 - First bounding box {minX, minY, maxX, maxY}
   * @param {Object} box2 - Second bounding box {minX, minY, maxX, maxY}
   * @returns {boolean} True if boxes overlap
   */
  static checkOverlap(box1, box2) {
    if (!box1 || !box2) {
      return false;
    }
    
    // Check if boxes are separated (no overlap)
    if (box1.maxX < box2.minX ||  // box1 is to the left of box2
        box2.maxX < box1.minX ||  // box2 is to the left of box1
        box1.maxY < box2.minY ||  // box1 is above box2
        box2.maxY < box1.minY) {  // box2 is above box1
      return false;
    }
    
    return true;
  }
}

module.exports = Positioning;