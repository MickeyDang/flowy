const Positioning = require('../../src/utils/positioning');
const FlowchartNode = require('../../src/models/node');

describe('Positioning utilities for PowerPoint generation', () => {
  let node1, node2, node3, node4;

  beforeEach(() => {
    // Create test nodes with various positions and sizes
    node1 = new FlowchartNode('node1', 'Node 1', 1, 1);
    node1.setSize(2, 1);
    node2 = new FlowchartNode('node2', 'Node 2', 5, 1);
    node2.setSize(2, 1);
    node3 = new FlowchartNode('node3', 'Node 3', 3, 4);
    node3.setSize(2, 1);
    node4 = new FlowchartNode('node4', 'Node 4', 7, 3);
    node4.setSize(1.5, 0.8);
  });

  describe('calculateConnectionPoints', () => {
    test('calculates horizontal connection points correctly', () => {
      // Horizontal layout: node1 to node2
      const points = Positioning.calculateConnectionPoints(node1, node2);
      
      expect(points).toEqual({
        startX: 3,      // node1.x + node1.width (right edge)
        startY: 1.5,    // node1.y + node1.height/2 (center)
        endX: 5,        // node2.x (left edge)
        endY: 1.5       // node2.y + node2.height/2 (center)
      });
    });

    test('calculates vertical connection points correctly', () => {
      // Vertical layout: node1 to node3
      const points = Positioning.calculateConnectionPoints(node1, node3);
      
      expect(points).toEqual({
        startX: 2,      // node1.x + node1.width/2 (center)
        startY: 2,      // node1.y + node1.height (bottom edge)
        endX: 4,        // node3.x + node3.width/2 (center)
        endY: 4         // node3.y (top edge)
      });
    });

    test('handles reverse horizontal connection', () => {
      // Right to left: node2 to node1
      const points = Positioning.calculateConnectionPoints(node2, node1);
      
      expect(points).toEqual({
        startX: 5,      // node2.x (left edge)
        startY: 1.5,    // node2.y + node2.height/2 (center)
        endX: 3,        // node1.x + node1.width (right edge)
        endY: 1.5       // node1.y + node1.height/2 (center)
      });
    });

    test('handles reverse vertical connection', () => {
      // Bottom to top: node3 to node1
      const points = Positioning.calculateConnectionPoints(node3, node1);
      
      expect(points).toEqual({
        startX: 4,      // node3.x + node3.width/2 (center)
        startY: 4,      // node3.y (top edge)
        endX: 2,        // node1.x + node1.width/2 (center)
        endY: 2         // node1.y + node1.height (bottom edge)
      });
    });

    test('handles diagonal connections by choosing dominant direction', () => {
      // Diagonal but more horizontal: node1 to node4
      const points = Positioning.calculateConnectionPoints(node1, node4);
      
      // Should connect horizontally since horizontal distance is greater
      expect(points.startX).toBe(3);      // Right edge of node1
      expect(points.startY).toBe(1.5);    // Center of node1
      expect(points.endX).toBe(7);        // Left edge of node4
      expect(points.endY).toBe(3.4);      // Center of node4
    });

    test('handles nodes with different sizes', () => {
      // Test with nodes of different dimensions
      const smallNode = new FlowchartNode('small', 'Small', 0, 0);
      smallNode.setSize(1, 0.5);
      const largeNode = new FlowchartNode('large', 'Large', 3, 2);
      largeNode.setSize(3, 2);
      
      const points = Positioning.calculateConnectionPoints(smallNode, largeNode);
      
      expect(points.startX).toBe(1);      // Right edge of small node
      expect(points.startY).toBe(0.25);   // Center of small node
      expect(points.endX).toBe(3);        // Left edge of large node
      expect(points.endY).toBe(3);        // Center of large node
    });
  });

  describe('calculateBoundingBoxForPath', () => {
    test('calculates bounding box for simple path', () => {
      const pathPoints = [
        { x: 1.0, y: 2.0 },
        { x: 3.0, y: 1.0 },
        { x: 5.0, y: 4.0 }
      ];
      
      const bbox = Positioning.calculateBoundingBoxForPath(pathPoints);
      
      expect(bbox).toEqual({
        minX: 1.0,
        minY: 1.0,
        maxX: 5.0,
        maxY: 4.0
      });
    });

    test('calculates bounding box for complex curved path', () => {
      const pathPoints = [
        { x: 2.5, y: 1.5 },
        { x: 1.0, y: 3.0 },
        { x: 4.0, y: 5.0 },
        { x: 6.0, y: 2.0 },
        { x: 3.5, y: 0.5 }
      ];
      
      const bbox = Positioning.calculateBoundingBoxForPath(pathPoints);
      
      expect(bbox).toEqual({
        minX: 1.0,
        minY: 0.5,
        maxX: 6.0,
        maxY: 5.0
      });
    });

    test('handles single point path', () => {
      const pathPoints = [{ x: 3.0, y: 2.0 }];
      
      const bbox = Positioning.calculateBoundingBoxForPath(pathPoints);
      
      expect(bbox).toEqual({
        minX: 3.0,
        minY: 2.0,
        maxX: 3.0,
        maxY: 2.0
      });
    });

    test('handles empty path array', () => {
      const bbox = Positioning.calculateBoundingBoxForPath([]);
      
      expect(bbox).toEqual({
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
      });
    });

    test('handles null or undefined path', () => {
      expect(Positioning.calculateBoundingBoxForPath(null)).toEqual({
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
      });
      
      expect(Positioning.calculateBoundingBoxForPath(undefined)).toEqual({
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
      });
    });

    test('handles path with invalid points', () => {
      const pathPoints = [
        { x: 1.0, y: 2.0 },
        { x: 'invalid', y: 3.0 },
        { x: 4.0, y: null },
        { x: 5.0, y: 1.0 }
      ];
      
      const bbox = Positioning.calculateBoundingBoxForPath(pathPoints);
      
      // Should only consider valid points
      expect(bbox).toEqual({
        minX: 1.0,
        minY: 1.0,
        maxX: 5.0,
        maxY: 2.0
      });
    });

    test('handles path with no valid points', () => {
      const pathPoints = [
        { x: 'invalid', y: 'invalid' },
        { x: null, y: undefined }
      ];
      
      const bbox = Positioning.calculateBoundingBoxForPath(pathPoints);
      
      expect(bbox).toEqual({
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
      });
    });
  });

  describe('calculateBoundingBox for nodes', () => {
    test('calculates bounding box for multiple nodes', () => {
      const nodes = [node1, node2, node3];
      
      const bbox = Positioning.calculateBoundingBox(nodes);
      
      expect(bbox).toEqual({
        minX: 1,      // node1.x
        minY: 1,      // node1.y
        maxX: 7,      // node2.x + node2.width
        maxY: 5       // node3.y + node3.height
      });
    });

    test('handles single node', () => {
      const bbox = Positioning.calculateBoundingBox([node1]);
      
      expect(bbox).toEqual({
        minX: 1,      // node1.x
        minY: 1,      // node1.y
        maxX: 3,      // node1.x + node1.width
        maxY: 2       // node1.y + node1.height
      });
    });

    test('handles empty node array', () => {
      const bbox = Positioning.calculateBoundingBox([]);
      
      expect(bbox).toEqual({
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
      });
    });

    test('handles null or undefined nodes', () => {
      expect(Positioning.calculateBoundingBox(null)).toEqual({
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
      });
      
      expect(Positioning.calculateBoundingBox(undefined)).toEqual({
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
      });
    });
  });

  describe('checkOverlap', () => {
    test('detects overlapping boxes', () => {
      const box1 = { minX: 1, minY: 1, maxX: 3, maxY: 3 };
      const box2 = { minX: 2, minY: 2, maxX: 4, maxY: 4 };
      
      expect(Positioning.checkOverlap(box1, box2)).toBe(true);
    });

    test('detects non-overlapping boxes', () => {
      const box1 = { minX: 1, minY: 1, maxX: 2, maxY: 2 };
      const box2 = { minX: 3, minY: 3, maxX: 4, maxY: 4 };
      
      expect(Positioning.checkOverlap(box1, box2)).toBe(false);
    });

    test('detects touching boxes as overlapping (edge case)', () => {
      const box1 = { minX: 1, minY: 1, maxX: 2, maxY: 2 };
      const box2 = { minX: 2, minY: 1, maxX: 3, maxY: 2 };
      
      // The checkOverlap function considers touching boxes as overlapping
      expect(Positioning.checkOverlap(box1, box2)).toBe(true);
    });

    test('handles null or undefined boxes', () => {
      const box1 = { minX: 1, minY: 1, maxX: 2, maxY: 2 };
      
      expect(Positioning.checkOverlap(box1, null)).toBe(false);
      expect(Positioning.checkOverlap(null, box1)).toBe(false);
      expect(Positioning.checkOverlap(null, null)).toBe(false);
    });
  });

  describe('centerLayout', () => {
    test('centers nodes within container', () => {
      const nodes = [node1, node2]; // nodes at (1,1) and (5,1)
      const containerWidth = 10;
      const containerHeight = 8;
      
      const centeredNodes = Positioning.centerLayout(nodes, containerWidth, containerHeight);
      
      // Original layout: minX=1, maxX=7, minY=1, maxY=2
      // Layout dimensions: width=6, height=1
      // Offsets: x=(10-6)/2-1=1, y=(8-1)/2-1=2.5
      
      expect(centeredNodes).toHaveLength(2);
      expect(centeredNodes[0].x).toBe(2);    // 1 + 1
      expect(centeredNodes[0].y).toBe(3.5);  // 1 + 2.5
      expect(centeredNodes[1].x).toBe(6);    // 5 + 1
      expect(centeredNodes[1].y).toBe(3.5);  // 1 + 2.5
    });

    test('handles single node centering', () => {
      const nodes = [node1];
      const containerWidth = 10;
      const containerHeight = 8;
      
      const centeredNodes = Positioning.centerLayout(nodes, containerWidth, containerHeight);
      
      expect(centeredNodes).toHaveLength(1);
      expect(centeredNodes[0].x).toBe(4);    // Centered horizontally
      expect(centeredNodes[0].y).toBe(3.5);  // Centered vertically
    });

    test('handles empty node array', () => {
      const centeredNodes = Positioning.centerLayout([], 10, 8);
      
      expect(centeredNodes).toEqual([]);
    });
  });

  describe('integration with PowerPoint generation', () => {
    test('connection points work correctly for PowerPoint coordinate system', () => {
      // Test that connection points are suitable for PowerPoint slide generation
      const points = Positioning.calculateConnectionPoints(node1, node2);
      
      // Verify points are within expected ranges
      expect(points.startX).toBeGreaterThan(0);
      expect(points.startY).toBeGreaterThan(0);
      expect(points.endX).toBeGreaterThan(0);
      expect(points.endY).toBeGreaterThan(0);
      
      // Verify horizontal distance calculation
      const deltaX = points.endX - points.startX;
      const deltaY = points.endY - points.startY;
      expect(deltaX).toBe(2); // Distance between nodes
      expect(deltaY).toBe(0); // Horizontal connection
    });

    test('bounding box calculation works for path generation', () => {
      // Test path that would be used in PowerPoint custom geometry
      const pathPoints = [
        { x: 1.5, y: 1.5 },
        { x: 3.0, y: 0.5 },
        { x: 4.5, y: 1.0 },
        { x: 5.5, y: 1.5 }
      ];
      
      const bbox = Positioning.calculateBoundingBoxForPath(pathPoints);
      
      // These dimensions would be used for PowerPoint shape sizing
      expect(bbox.minX).toBe(1.5);
      expect(bbox.minY).toBe(0.5);
      expect(bbox.maxX).toBe(5.5);
      expect(bbox.maxY).toBe(1.5);
      
      const width = bbox.maxX - bbox.minX;
      const height = bbox.maxY - bbox.minY;
      expect(width).toBe(4.0);
      expect(height).toBe(1.0);
    });
  });
});