const Positioning = require('./positioning');

/**
 * Path routing algorithms for generating aesthetically pleasing connector paths
 */
class PathRouting {
  
  /**
   * Generate optimal path points between two nodes based on routing style
   * @param {Object} sourceNode - Source node with position and dimensions
   * @param {Object} targetNode - Target node with position and dimensions
   * @param {Array} allNodes - All nodes in flowchart for obstacle detection
   * @param {string} routingStyle - 'straight', 'orthogonal', or 'curved'
   * @param {Object} options - Additional routing options
   * @returns {Object} Result with pathPoints array and reasoning
   */
  static generatePath(sourceNode, targetNode, allNodes = [], routingStyle = 'orthogonal', options = {}) {
    const {
      avoidObstacles = true,
      curveRadius = 0.2,
      minSegmentLength = 0.3,
      padding = 0.1
    } = options;

    // Validate and normalize routing style
    const validatedRoutingStyle = this.validateRoutingStyle(routingStyle);

    // Get connection points using existing logic
    const connectionPoints = Positioning.calculateConnectionPoints(sourceNode, targetNode);
    const startPoint = { x: connectionPoints.startX, y: connectionPoints.startY };
    const endPoint = { x: connectionPoints.endX, y: connectionPoints.endY };

    let pathPoints;
    let reasoning;

    // Filter out source and target nodes from obstacles
    const obstacles = allNodes.filter(node => 
      node.id !== sourceNode.id && node.id !== targetNode.id
    );

    switch (validatedRoutingStyle) {
      case 'straight':
        const straightResult = this.generateStraightPath(startPoint, endPoint, obstacles, { avoidObstacles, padding });
        pathPoints = straightResult.pathPoints;
        reasoning = straightResult.reasoning;
        break;
        
      case 'curved':
        const curvedResult = this.generateCurvedPath(startPoint, endPoint, obstacles, { 
          avoidObstacles, 
          curveRadius, 
          padding 
        });
        pathPoints = curvedResult.pathPoints;
        reasoning = curvedResult.reasoning;
        break;
        
      case 'orthogonal':
      default:
        const orthogonalResult = this.generateOrthogonalPath(startPoint, endPoint, obstacles, { 
          avoidObstacles, 
          minSegmentLength, 
          padding 
        });
        pathPoints = orthogonalResult.pathPoints;
        reasoning = orthogonalResult.reasoning;
        break;
    }

    return {
      pathPoints,
      reasoning,
      routingStyle: validatedRoutingStyle,
      startPoint,
      endPoint
    };
  }

  /**
   * Generate straight line path with optional obstacle avoidance
   */
  static generateStraightPath(startPoint, endPoint, obstacles, options) {
    const { avoidObstacles, padding } = options;
    
    let pathPoints = [startPoint, endPoint];
    let reasoning = 'Direct straight line path';

    if (avoidObstacles && obstacles.length > 0) {
      const directPath = [startPoint, endPoint];
      const hasObstacle = this.checkPathObstacles(directPath, obstacles, padding);
      
      if (hasObstacle) {
        // Try simple detour around obstacles
        const detourPath = this.findSimpleDetour(startPoint, endPoint, obstacles, padding);
        if (detourPath) {
          pathPoints = detourPath;
          reasoning = 'Straight path with obstacle avoidance detour';
        } else {
          reasoning = 'Direct straight line path (obstacle avoidance failed)';
        }
      }
    }

    return { pathPoints, reasoning };
  }

  /**
   * Generate orthogonal (L-shaped or multi-segment) path
   */
  static generateOrthogonalPath(startPoint, endPoint, obstacles, options) {
    const { avoidObstacles, minSegmentLength, padding } = options;
    
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    
    // Determine if we should go horizontal-first or vertical-first
    const horizontalFirst = Math.abs(dx) > Math.abs(dy);
    
    let pathPoints;
    let reasoning;

    if (horizontalFirst) {
      // Try horizontal-first path
      const midPoint = { x: endPoint.x, y: startPoint.y };
      pathPoints = [startPoint, midPoint, endPoint];
      reasoning = 'Orthogonal path (horizontal then vertical)';
      
      // Check for obstacles if avoidance is enabled
      if (avoidObstacles && obstacles.length > 0) {
        const hasObstacle = this.checkPathObstacles(pathPoints, obstacles, padding);
        if (hasObstacle) {
          // Try vertical-first instead
          const altMidPoint = { x: startPoint.x, y: endPoint.y };
          const altPath = [startPoint, altMidPoint, endPoint];
          const altHasObstacle = this.checkPathObstacles(altPath, obstacles, padding);
          
          if (!altHasObstacle) {
            pathPoints = altPath;
            reasoning = 'Orthogonal path (vertical then horizontal) - avoiding obstacles';
          } else {
            // Try multi-segment path
            const multiSegmentPath = this.generateMultiSegmentPath(startPoint, endPoint, obstacles, padding);
            if (multiSegmentPath) {
              pathPoints = multiSegmentPath;
              reasoning = 'Multi-segment orthogonal path avoiding obstacles';
            } else {
              reasoning = 'Orthogonal path (horizontal then vertical) - obstacle avoidance failed';
            }
          }
        }
      }
    } else {
      // Try vertical-first path
      const midPoint = { x: startPoint.x, y: endPoint.y };
      pathPoints = [startPoint, midPoint, endPoint];
      reasoning = 'Orthogonal path (vertical then horizontal)';
      
      // Check for obstacles if avoidance is enabled
      if (avoidObstacles && obstacles.length > 0) {
        const hasObstacle = this.checkPathObstacles(pathPoints, obstacles, padding);
        if (hasObstacle) {
          // Try horizontal-first instead
          const altMidPoint = { x: endPoint.x, y: startPoint.y };
          const altPath = [startPoint, altMidPoint, endPoint];
          const altHasObstacle = this.checkPathObstacles(altPath, obstacles, padding);
          
          if (!altHasObstacle) {
            pathPoints = altPath;
            reasoning = 'Orthogonal path (horizontal then vertical) - avoiding obstacles';
          } else {
            // Try multi-segment path
            const multiSegmentPath = this.generateMultiSegmentPath(startPoint, endPoint, obstacles, padding);
            if (multiSegmentPath) {
              pathPoints = multiSegmentPath;
              reasoning = 'Multi-segment orthogonal path avoiding obstacles';
            } else {
              reasoning = 'Orthogonal path (vertical then horizontal) - obstacle avoidance failed';
            }
          }
        }
      }
    }

    return { pathPoints, reasoning };
  }

  /**
   * Generate curved path with control points
   */
  static generateCurvedPath(startPoint, endPoint, obstacles, options) {
    const { avoidObstacles, curveRadius, padding } = options;
    
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Generate control points for smooth curve
    const midX = startPoint.x + dx * 0.5;
    const midY = startPoint.y + dy * 0.5;
    
    // Offset control point perpendicular to the line
    const perpX = -dy / distance * curveRadius;
    const perpY = dx / distance * curveRadius;
    
    const controlPoint = {
      x: midX + perpX,
      y: midY + perpY
    };
    
    // Generate bezier curve points
    const pathPoints = this.generateBezierPoints(startPoint, controlPoint, endPoint, 8);
    let reasoning = 'Smooth curved path with bezier control points';

    if (avoidObstacles && obstacles.length > 0) {
      const hasObstacle = this.checkPathObstacles(pathPoints, obstacles, padding);
      if (hasObstacle) {
        // Try curve in opposite direction
        const altControlPoint = {
          x: midX - perpX,
          y: midY - perpY
        };
        const altPathPoints = this.generateBezierPoints(startPoint, altControlPoint, endPoint, 8);
        const altHasObstacle = this.checkPathObstacles(altPathPoints, obstacles, padding);
        
        if (!altHasObstacle) {
          return { 
            pathPoints: altPathPoints, 
            reasoning: 'Curved path (reverse direction) avoiding obstacles' 
          };
        } else {
          // Fall back to orthogonal path
          const fallbackResult = this.generateOrthogonalPath(startPoint, endPoint, obstacles, options);
          return {
            pathPoints: fallbackResult.pathPoints,
            reasoning: 'Fallback to orthogonal path - curved path blocked by obstacles'
          };
        }
      }
    }

    return { pathPoints, reasoning };
  }

  /**
   * Check if a path intersects with any obstacles
   */
  static checkPathObstacles(pathPoints, obstacles, padding = 0.1) {
    if (!obstacles || obstacles.length === 0) return false;
    
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const segmentStart = pathPoints[i];
      const segmentEnd = pathPoints[i + 1];
      
      for (const obstacle of obstacles) {
        const obstacleBox = {
          minX: obstacle.x - padding,
          minY: obstacle.y - padding,
          maxX: obstacle.x + obstacle.width + padding,
          maxY: obstacle.y + obstacle.height + padding
        };
        
        if (this.lineIntersectsBox(segmentStart, segmentEnd, obstacleBox)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if a line segment intersects with a bounding box
   */
  static lineIntersectsBox(lineStart, lineEnd, box) {
    // Check if either endpoint is inside the box
    if (this.pointInBox(lineStart, box) || this.pointInBox(lineEnd, box)) {
      return true;
    }
    
    // Check if line intersects any edge of the box
    const boxCorners = [
      { x: box.minX, y: box.minY }, // top-left
      { x: box.maxX, y: box.minY }, // top-right
      { x: box.maxX, y: box.maxY }, // bottom-right
      { x: box.minX, y: box.maxY }  // bottom-left
    ];
    
    const boxEdges = [
      [boxCorners[0], boxCorners[1]], // top edge
      [boxCorners[1], boxCorners[2]], // right edge
      [boxCorners[2], boxCorners[3]], // bottom edge
      [boxCorners[3], boxCorners[0]]  // left edge
    ];
    
    for (const edge of boxEdges) {
      if (this.linesIntersect(lineStart, lineEnd, edge[0], edge[1])) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if a point is inside a bounding box
   */
  static pointInBox(point, box) {
    return point.x >= box.minX && point.x <= box.maxX &&
           point.y >= box.minY && point.y <= box.maxY;
  }

  /**
   * Check if two line segments intersect
   */
  static linesIntersect(p1, p2, p3, p4) {
    const denominator = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    
    if (Math.abs(denominator) < 1e-10) {
      return false; // Lines are parallel
    }
    
    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denominator;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denominator;
    
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  /**
   * Generate bezier curve points
   */
  static generateBezierPoints(start, control, end, numPoints = 8) {
    const points = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const point = this.quadraticBezier(start, control, end, t);
      points.push(point);
    }
    
    return points;
  }

  /**
   * Calculate quadratic bezier point at parameter t
   */
  static quadraticBezier(p0, p1, p2, t) {
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    return { x, y };
  }

  /**
   * Find a simple detour around obstacles for straight paths
   */
  static findSimpleDetour(startPoint, endPoint, obstacles, padding) {
    // Try going around the largest obstacle
    const blockinObstacle = this.findBlockingObstacle(startPoint, endPoint, obstacles, padding);
    if (!blockinObstacle) return null;
    
    const obstacle = blockinObstacle;
    const obstacleBox = {
      minX: obstacle.x - padding,
      minY: obstacle.y - padding,
      maxX: obstacle.x + obstacle.width + padding,
      maxY: obstacle.y + obstacle.height + padding
    };
    
    // Try going around top/bottom or left/right
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal movement - try going over or under
      const overPoint = { x: startPoint.x + dx * 0.5, y: obstacleBox.minY - 0.1 };
      const underPoint = { x: startPoint.x + dx * 0.5, y: obstacleBox.maxY + 0.1 };
      
      // Choose the shorter detour
      const overDistance = Math.abs(overPoint.y - startPoint.y) + Math.abs(overPoint.y - endPoint.y);
      const underDistance = Math.abs(underPoint.y - startPoint.y) + Math.abs(underPoint.y - endPoint.y);
      
      const detourPoint = overDistance < underDistance ? overPoint : underPoint;
      return [startPoint, detourPoint, endPoint];
    } else {
      // Vertical movement - try going left or right
      const leftPoint = { x: obstacleBox.minX - 0.1, y: startPoint.y + dy * 0.5 };
      const rightPoint = { x: obstacleBox.maxX + 0.1, y: startPoint.y + dy * 0.5 };
      
      // Choose the shorter detour
      const leftDistance = Math.abs(leftPoint.x - startPoint.x) + Math.abs(leftPoint.x - endPoint.x);
      const rightDistance = Math.abs(rightPoint.x - startPoint.x) + Math.abs(rightPoint.x - endPoint.x);
      
      const detourPoint = leftDistance < rightDistance ? leftPoint : rightPoint;
      return [startPoint, detourPoint, endPoint];
    }
  }

  /**
   * Find the obstacle blocking a direct path
   */
  static findBlockingObstacle(startPoint, endPoint, obstacles, padding) {
    for (const obstacle of obstacles) {
      const obstacleBox = {
        minX: obstacle.x - padding,
        minY: obstacle.y - padding,
        maxX: obstacle.x + obstacle.width + padding,
        maxY: obstacle.y + obstacle.height + padding
      };
      
      if (this.lineIntersectsBox(startPoint, endPoint, obstacleBox)) {
        return obstacle;
      }
    }
    return null;
  }

  /**
   * Generate multi-segment orthogonal path avoiding obstacles
   */
  static generateMultiSegmentPath(startPoint, endPoint, obstacles, padding) {
    // Simple implementation: try going around obstacles with intermediate points
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    
    // Find midpoint offset to avoid obstacles
    const midX = startPoint.x + dx * 0.5;
    const midY = startPoint.y + dy * 0.5;
    
    // Try different offsets
    const offsets = [
      { x: 0.5, y: 0 },
      { x: -0.5, y: 0 },
      { x: 0, y: 0.5 },
      { x: 0, y: -0.5 }
    ];
    
    for (const offset of offsets) {
      const waypoint = { x: midX + offset.x, y: midY + offset.y };
      const testPath = [
        startPoint,
        { x: waypoint.x, y: startPoint.y },
        { x: waypoint.x, y: waypoint.y },
        { x: waypoint.x, y: endPoint.y },
        endPoint
      ];
      
      if (!this.checkPathObstacles(testPath, obstacles, padding)) {
        return testPath;
      }
    }
    
    return null; // Failed to find clear path
  }

  /**
   * Validate and normalize routing style
   */
  static validateRoutingStyle(routingStyle) {
    const validStyles = ['straight', 'orthogonal', 'curved'];
    if (!routingStyle || !validStyles.includes(routingStyle)) {
      return 'orthogonal'; // default
    }
    return routingStyle;
  }
}

module.exports = PathRouting;