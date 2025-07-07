class Positioning {
  // DEPRECATED: hierarchicalLayout is no longer used as Claude handles positioning manually
  // static hierarchicalLayout(flowchart) { ... }
  
  // DEPRECATED: findRootNodes is no longer used
  // static findRootNodes(nodes, connections) { ... }
  
  // DEPRECATED: assignLevels is no longer used
  // static assignLevels(rootNodes, nodes, connections) { ... }
  
  // DEPRECATED: positionNodes is no longer used
  // static positionNodes(nodes, levels, slideWidth, slideHeight) { ... }
  
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