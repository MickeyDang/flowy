const Positioning = require('../../src/utils/positioning');

describe('Positioning', () => {
  describe('calculateConnectionPoints', () => {
    test('calculates horizontal connection points', () => {
      const sourceNode = { x: 0, y: 1, width: 2, height: 1 };
      const targetNode = { x: 5, y: 1, width: 2, height: 1 };
      
      const points = Positioning.calculateConnectionPoints(sourceNode, targetNode);
      
      expect(points.startX).toBe(2); // sourceNode.x + width
      expect(points.startY).toBe(1.5); // sourceNode center Y
      expect(points.endX).toBe(5); // targetNode.x
      expect(points.endY).toBe(1.5); // targetNode center Y
    });

    test('calculates vertical connection points', () => {
      const sourceNode = { x: 1, y: 0, width: 2, height: 1 };
      const targetNode = { x: 1, y: 5, width: 2, height: 1 };
      
      const points = Positioning.calculateConnectionPoints(sourceNode, targetNode);
      
      expect(points.startX).toBe(2); // sourceNode center X
      expect(points.startY).toBe(1); // sourceNode.y + height
      expect(points.endX).toBe(2); // targetNode center X
      expect(points.endY).toBe(5); // targetNode.y
    });

    test('prefers horizontal connections over vertical', () => {
      const sourceNode = { x: 0, y: 0, width: 1, height: 1 };
      const targetNode = { x: 2, y: 1, width: 1, height: 1 }; // slightly diagonal
      
      const points = Positioning.calculateConnectionPoints(sourceNode, targetNode);
      
      // Should connect horizontally (right edge to left edge)
      expect(points.startX).toBe(1); // sourceNode right edge
      expect(points.endX).toBe(2); // targetNode left edge
    });
  });
});