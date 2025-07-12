const PathRouting = require('../../src/utils/path-routing');

describe('PathRouting', () => {
  // Test node fixtures
  const sourceNode = {
    id: 'source',
    x: 1,
    y: 1,
    width: 1,
    height: 0.5,
    text: 'Source'
  };

  const targetNode = {
    id: 'target', 
    x: 4,
    y: 3,
    width: 1,
    height: 0.5,
    text: 'Target'
  };

  const obstacleNode = {
    id: 'obstacle',
    x: 2.5,
    y: 1.8,
    width: 1,
    height: 0.5,
    text: 'Obstacle'
  };

  describe('generatePath', () => {
    test('generates straight path without obstacles', () => {
      const result = PathRouting.generatePath(sourceNode, targetNode, [], 'straight');
      
      expect(result).toHaveProperty('pathPoints');
      expect(result).toHaveProperty('reasoning');
      expect(result).toHaveProperty('routingStyle', 'straight');
      expect(result.pathPoints).toHaveLength(2);
      expect(result.reasoning).toContain('straight line');
    });

    test('generates orthogonal path', () => {
      const result = PathRouting.generatePath(sourceNode, targetNode, [], 'orthogonal');
      
      expect(result.routingStyle).toBe('orthogonal');
      expect(result.pathPoints.length).toBeGreaterThanOrEqual(3);
      expect(result.reasoning).toContain('Orthogonal');
    });

    test('generates curved path', () => {
      const result = PathRouting.generatePath(sourceNode, targetNode, [], 'curved');
      
      expect(result.routingStyle).toBe('curved');
      expect(result.pathPoints.length).toBeGreaterThan(3);
      expect(result.reasoning).toContain('curved');
    });

    test('defaults to orthogonal for invalid routing style', () => {
      const result = PathRouting.generatePath(sourceNode, targetNode, [], 'invalid');
      
      expect(result.routingStyle).toBe('orthogonal');
    });

    test('filters out source and target from obstacles', () => {
      const allNodes = [sourceNode, targetNode, obstacleNode];
      const result = PathRouting.generatePath(sourceNode, targetNode, allNodes, 'straight');
      
      // Should only consider obstacleNode as obstacle, not source/target
      expect(result).toBeDefined();
    });
  });

  describe('generateStraightPath', () => {
    test('creates direct path without obstacles', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 2, y: 2 };
      const result = PathRouting.generateStraightPath(start, end, [], { avoidObstacles: true, padding: 0.1 });
      
      expect(result.pathPoints).toEqual([start, end]);
      expect(result.reasoning).toContain('Direct straight line');
    });

    test('avoids obstacles when enabled', () => {
      const start = { x: 0, y: 1 };
      const end = { x: 4, y: 1 };
      const obstacles = [{ x: 1.5, y: 0.8, width: 1, height: 0.4 }];
      const result = PathRouting.generateStraightPath(start, end, obstacles, { avoidObstacles: true, padding: 0.1 });
      
      // Should create detour if obstacle blocks path
      expect(result.pathPoints.length).toBeGreaterThanOrEqual(2);
    });

    test('ignores obstacles when avoidance disabled', () => {
      const start = { x: 0, y: 1 };
      const end = { x: 4, y: 1 };
      const obstacles = [{ x: 1.5, y: 0.8, width: 1, height: 0.4 }];
      const result = PathRouting.generateStraightPath(start, end, obstacles, { avoidObstacles: false, padding: 0.1 });
      
      expect(result.pathPoints).toEqual([start, end]);
    });
  });

  describe('generateOrthogonalPath', () => {
    test('creates L-shaped path', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 2, y: 2 };
      const result = PathRouting.generateOrthogonalPath(start, end, [], { avoidObstacles: true, minSegmentLength: 0.3, padding: 0.1 });
      
      expect(result.pathPoints).toHaveLength(3);
      expect(result.pathPoints[0]).toEqual(start);
      expect(result.pathPoints[2]).toEqual(end);
    });

    test('chooses horizontal-first for wider movements', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 4, y: 1 }; // More horizontal than vertical
      const result = PathRouting.generateOrthogonalPath(start, end, [], { avoidObstacles: false, minSegmentLength: 0.3, padding: 0.1 });
      
      expect(result.pathPoints[1].x).toBe(end.x);
      expect(result.pathPoints[1].y).toBe(start.y);
      expect(result.reasoning).toContain('horizontal then vertical');
    });

    test('chooses vertical-first for taller movements', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 1, y: 4 }; // More vertical than horizontal
      const result = PathRouting.generateOrthogonalPath(start, end, [], { avoidObstacles: false, minSegmentLength: 0.3, padding: 0.1 });
      
      expect(result.pathPoints[1].x).toBe(start.x);
      expect(result.pathPoints[1].y).toBe(end.y);
      expect(result.reasoning).toContain('vertical then horizontal');
    });

    test('tries alternative path when obstacles block primary path', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 2, y: 2 };
      const obstacles = [{ x: 1.8, y: -0.2, width: 0.4, height: 0.4 }]; // Blocks horizontal-first path
      const result = PathRouting.generateOrthogonalPath(start, end, obstacles, { avoidObstacles: true, minSegmentLength: 0.3, padding: 0.1 });
      
      expect(result.pathPoints).toHaveLength(3);
      // Should try vertical-first instead
    });
  });

  describe('generateCurvedPath', () => {
    test('creates bezier curve with control points', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 2, y: 2 };
      const result = PathRouting.generateCurvedPath(start, end, [], { avoidObstacles: true, curveRadius: 0.2, padding: 0.1 });
      
      expect(result.pathPoints.length).toBeGreaterThan(3);
      expect(result.pathPoints[0]).toEqual(start);
      expect(result.pathPoints[result.pathPoints.length - 1]).toEqual(end);
      expect(result.reasoning).toContain('curved');
    });

    test('tries reverse curve when primary curve blocked', () => {
      const start = { x: 0, y: 1 };
      const end = { x: 2, y: 1 };
      const obstacles = [{ x: 0.8, y: 0.8, width: 0.4, height: 0.6 }]; // Blocks one curve direction
      const result = PathRouting.generateCurvedPath(start, end, obstacles, { avoidObstacles: true, curveRadius: 0.2, padding: 0.1 });
      
      expect(result.pathPoints.length).toBeGreaterThan(2);
    });
  });

  describe('checkPathObstacles', () => {
    test('returns false when no obstacles', () => {
      const path = [{ x: 0, y: 0 }, { x: 2, y: 2 }];
      const result = PathRouting.checkPathObstacles(path, [], 0.1);
      
      expect(result).toBe(false);
    });

    test('detects obstacle intersection', () => {
      const path = [{ x: 0, y: 1 }, { x: 4, y: 1 }];
      const obstacles = [{ x: 1.5, y: 0.8, width: 1, height: 0.4 }];
      const result = PathRouting.checkPathObstacles(path, obstacles, 0.1);
      
      expect(result).toBe(true);
    });

    test('accounts for padding around obstacles', () => {
      const path = [{ x: 0, y: 1 }, { x: 4, y: 1 }];
      const obstacles = [{ x: 1.5, y: 1.1, width: 1, height: 0.2 }]; // Just above path
      const result = PathRouting.checkPathObstacles(path, obstacles, 0.15); // Padding should cause intersection
      
      expect(result).toBe(true);
    });
  });

  describe('lineIntersectsBox', () => {
    test('detects line passing through box', () => {
      const lineStart = { x: 0, y: 1 };
      const lineEnd = { x: 4, y: 1 };
      const box = { minX: 1.5, minY: 0.8, maxX: 2.5, maxY: 1.2 };
      const result = PathRouting.lineIntersectsBox(lineStart, lineEnd, box);
      
      expect(result).toBe(true);
    });

    test('detects line starting inside box', () => {
      const lineStart = { x: 2, y: 1 };
      const lineEnd = { x: 4, y: 1 };
      const box = { minX: 1.5, minY: 0.8, maxX: 2.5, maxY: 1.2 };
      const result = PathRouting.lineIntersectsBox(lineStart, lineEnd, box);
      
      expect(result).toBe(true);
    });

    test('returns false for non-intersecting line', () => {
      const lineStart = { x: 0, y: 0 };
      const lineEnd = { x: 1, y: 0 };
      const box = { minX: 2, minY: 0.5, maxX: 3, maxY: 1.5 };
      const result = PathRouting.lineIntersectsBox(lineStart, lineEnd, box);
      
      expect(result).toBe(false);
    });
  });

  describe('pointInBox', () => {
    test('detects point inside box', () => {
      const point = { x: 2, y: 1 };
      const box = { minX: 1.5, minY: 0.8, maxX: 2.5, maxY: 1.2 };
      const result = PathRouting.pointInBox(point, box);
      
      expect(result).toBe(true);
    });

    test('detects point outside box', () => {
      const point = { x: 0, y: 0 };
      const box = { minX: 1.5, minY: 0.8, maxX: 2.5, maxY: 1.2 };
      const result = PathRouting.pointInBox(point, box);
      
      expect(result).toBe(false);
    });

    test('handles point on box boundary', () => {
      const point = { x: 1.5, y: 1 };
      const box = { minX: 1.5, minY: 0.8, maxX: 2.5, maxY: 1.2 };
      const result = PathRouting.pointInBox(point, box);
      
      expect(result).toBe(true);
    });
  });

  describe('linesIntersect', () => {
    test('detects intersecting lines', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 2, y: 2 };
      const p3 = { x: 0, y: 2 };
      const p4 = { x: 2, y: 0 };
      const result = PathRouting.linesIntersect(p1, p2, p3, p4);
      
      expect(result).toBe(true);
    });

    test('detects non-intersecting lines', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 1, y: 0 };
      const p3 = { x: 2, y: 1 };
      const p4 = { x: 3, y: 1 };
      const result = PathRouting.linesIntersect(p1, p2, p3, p4);
      
      expect(result).toBe(false);
    });

    test('handles parallel lines', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 2, y: 0 };
      const p3 = { x: 0, y: 1 };
      const p4 = { x: 2, y: 1 };
      const result = PathRouting.linesIntersect(p1, p2, p3, p4);
      
      expect(result).toBe(false);
    });
  });

  describe('generateBezierPoints', () => {
    test('generates correct number of points', () => {
      const start = { x: 0, y: 0 };
      const control = { x: 1, y: 2 };
      const end = { x: 2, y: 0 };
      const points = PathRouting.generateBezierPoints(start, control, end, 4);
      
      expect(points).toHaveLength(5); // numPoints + 1
      expect(points[0]).toEqual(start);
      expect(points[4]).toEqual(end);
    });

    test('generates smooth curve points', () => {
      const start = { x: 0, y: 0 };
      const control = { x: 1, y: 1 };
      const end = { x: 2, y: 0 };
      const points = PathRouting.generateBezierPoints(start, control, end, 8);
      
      // Check that middle points are different from start/end
      expect(points[4].x).toBeCloseTo(1, 1);
      expect(points[4].y).toBeGreaterThan(0);
    });
  });

  describe('quadraticBezier', () => {
    test('returns start point at t=0', () => {
      const p0 = { x: 0, y: 0 };
      const p1 = { x: 1, y: 2 };
      const p2 = { x: 2, y: 0 };
      const result = PathRouting.quadraticBezier(p0, p1, p2, 0);
      
      expect(result).toEqual(p0);
    });

    test('returns end point at t=1', () => {
      const p0 = { x: 0, y: 0 };
      const p1 = { x: 1, y: 2 };
      const p2 = { x: 2, y: 0 };
      const result = PathRouting.quadraticBezier(p0, p1, p2, 1);
      
      expect(result).toEqual(p2);
    });

    test('calculates correct midpoint at t=0.5', () => {
      const p0 = { x: 0, y: 0 };
      const p1 = { x: 1, y: 2 };
      const p2 = { x: 2, y: 0 };
      const result = PathRouting.quadraticBezier(p0, p1, p2, 0.5);
      
      expect(result.x).toBeCloseTo(1, 5);
      expect(result.y).toBeCloseTo(1, 5);
    });
  });

  describe('validateRoutingStyle', () => {
    test('accepts valid routing styles', () => {
      expect(PathRouting.validateRoutingStyle('straight')).toBe('straight');
      expect(PathRouting.validateRoutingStyle('orthogonal')).toBe('orthogonal');
      expect(PathRouting.validateRoutingStyle('curved')).toBe('curved');
    });

    test('defaults to orthogonal for invalid styles', () => {
      expect(PathRouting.validateRoutingStyle('invalid')).toBe('orthogonal');
      expect(PathRouting.validateRoutingStyle('')).toBe('orthogonal');
      expect(PathRouting.validateRoutingStyle(null)).toBe('orthogonal');
      expect(PathRouting.validateRoutingStyle(undefined)).toBe('orthogonal');
    });
  });

  describe('findSimpleDetour', () => {
    test('finds detour around horizontal obstacle', () => {
      const start = { x: 0, y: 1 };
      const end = { x: 4, y: 1 };
      const obstacles = [{ x: 1.5, y: 0.8, width: 1, height: 0.4 }];
      const result = PathRouting.findSimpleDetour(start, end, obstacles, 0.1);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(start);
      expect(result[2]).toEqual(end);
      // Middle point should be above or below the obstacle
      expect(result[1].y).not.toBeCloseTo(1, 1);
    });

    test('returns null when no blocking obstacle', () => {
      const start = { x: 0, y: 1 };
      const end = { x: 4, y: 1 };
      const obstacles = [{ x: 1.5, y: 2, width: 1, height: 0.4 }]; // Above path
      const result = PathRouting.findSimpleDetour(start, end, obstacles, 0.1);
      
      expect(result).toBeNull();
    });
  });

  describe('edge cases and error handling', () => {
    test('handles identical start and end points', () => {
      const samePoint = { x: 1, y: 1 };
      const result = PathRouting.generatePath(
        { id: 'same1', x: 1, y: 1, width: 1, height: 0.5 },
        { id: 'same2', x: 1, y: 1, width: 1, height: 0.5 },
        [],
        'straight'
      );
      
      expect(result.pathPoints).toHaveLength(2);
    });

    test('handles very small movements', () => {
      const result = PathRouting.generatePath(
        { id: 'close1', x: 1, y: 1, width: 1, height: 0.5 },
        { id: 'close2', x: 1.1, y: 1.1, width: 1, height: 0.5 },
        [],
        'orthogonal'
      );
      
      expect(result.pathPoints.length).toBeGreaterThanOrEqual(2);
    });

    test('handles empty obstacles array', () => {
      const result = PathRouting.generatePath(sourceNode, targetNode, [], 'straight', { avoidObstacles: true });
      
      expect(result.pathPoints).toHaveLength(2);
      expect(result.reasoning).toContain('Direct straight line');
    });

    test('handles extreme option values', () => {
      const result = PathRouting.generatePath(sourceNode, targetNode, [], 'curved', {
        curveRadius: 0.001,
        padding: 0.001,
        minSegmentLength: 0.001
      });
      
      expect(result).toBeDefined();
      expect(result.pathPoints.length).toBeGreaterThan(2);
    });
  });
});