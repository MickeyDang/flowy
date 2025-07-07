const FlowchartPresentationGenerator = require('../../src/utils/pptx-generator');
const Flowchart = require('../../src/models/flowchart');
const FlowchartNode = require('../../src/models/node');

// Mock PptxGenJS
jest.mock('pptxgenjs');

describe('PowerPoint Generation with Custom Paths', () => {
  let generator, flowchart, node1, node2, node3;

  beforeEach(() => {
    generator = new FlowchartPresentationGenerator();
    
    // Create test flowchart
    flowchart = new Flowchart('test-flowchart', 'Test Flowchart', 10, 7.5);
    
    // Add test nodes
    node1 = new FlowchartNode('node1', 'Node 1', 1, 1, 2, 1);
    node2 = new FlowchartNode('node2', 'Node 2', 5, 1, 2, 1);
    node3 = new FlowchartNode('node3', 'Node 3', 3, 4, 2, 1);
    
    flowchart.nodes.set('node1', node1);
    flowchart.nodes.set('node2', node2);
    flowchart.nodes.set('node3', node3);
  });

  describe('Straight line connectors (default)', () => {
    test('generates straight line connectors when no custom path', async () => {
      // Add connection without custom path
      const connectionId = flowchart.addConnection('node1', 'node2', 'straight connection');
      
      // Create presentation
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      const slide = generator.addFlowchartSlide(flowchart);
      
      expect(pptx).toBeDefined();
      expect(slide).toBeDefined();
      
      // Verify line shape was added (not custGeom)
      expect(slide.shapes).toHaveLength(1);
      expect(slide.shapes[0].type).toBe('line');
      expect(slide.shapes[0].options).toHaveProperty('line');
      expect(slide.shapes[0].options.line).toHaveProperty('endArrowType', 'triangle');
    });

    test('calculates correct line coordinates for horizontal connection', async () => {
      // Position nodes horizontally
      node1.setPosition(1, 2);
      node1.setSize(2, 1);
      node2.setPosition(5, 2);
      node2.setSize(2, 1);
      
      const connectionId = flowchart.addConnection('node1', 'node2', 'horizontal');
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      const slide = generator.addFlowchartSlide(flowchart);
      
      const lineShape = slide.shapes[0];
      expect(lineShape.type).toBe('line');
      
      // Should connect from right edge of node1 to left edge of node2
      expect(lineShape.options.x).toBe(3); // node1.x + node1.width
      expect(lineShape.options.y).toBe(3.5); // node1.y + node1.height/2 + 1 (slide offset)
      expect(lineShape.options.w).toBe(2); // distance between nodes
      expect(lineShape.options.h).toBe(0); // horizontal line
    });

    test('calculates correct line coordinates for vertical connection', async () => {
      // Position nodes vertically
      node1.setPosition(2, 1);
      node1.setSize(2, 1);
      node3.setPosition(2, 4);
      node3.setSize(2, 1);
      
      const connectionId = flowchart.addConnection('node1', 'node3', 'vertical');
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      const slide = generator.addFlowchartSlide(flowchart);
      
      const lineShape = slide.shapes[0];
      expect(lineShape.type).toBe('line');
      
      // Should connect from bottom edge of node1 to top edge of node3
      expect(lineShape.options.x).toBe(3); // node1.x + node1.width/2
      expect(lineShape.options.y).toBe(3); // node1.y + node1.height + 1 (slide offset)
      expect(lineShape.options.w).toBe(0); // vertical line
      expect(lineShape.options.h).toBe(2); // distance between nodes
    });

    test('adds connection label for straight line connector', async () => {
      const connectionId = flowchart.addConnection('node1', 'node2', 'labeled connection');
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      const slide = generator.addFlowchartSlide(flowchart);
      
      // Should have one text element for the label
      expect(slide.texts).toHaveLength(4); // 1 title + 3 nodes + 1 connection label
      
      const connectionLabel = slide.texts.find(text => text.text === 'labeled connection');
      expect(connectionLabel).toBeDefined();
      expect(connectionLabel.options).toHaveProperty('fontSize', 10);
      expect(connectionLabel.options).toHaveProperty('color', '666666');
      expect(connectionLabel.options).toHaveProperty('align', 'center');
    });
  });

  describe('Custom geometry connectors', () => {
    test('generates custom geometry for connector with path points', async () => {
      // Add connection with custom path
      const connectionId = flowchart.addConnection('node1', 'node2', 'curved connection');
      const connection = flowchart.getConnection(connectionId);
      connection.pathPoints = [
        { x: 1.5, y: 1.5 },
        { x: 3.0, y: 0.5 },
        { x: 4.5, y: 1.0 },
        { x: 5.5, y: 1.5 }
      ];
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      const slide = generator.addFlowchartSlide(flowchart);
      
      // Should use custGeom instead of line
      expect(slide.shapes).toHaveLength(1);
      expect(slide.shapes[0].type).toBe('custGeom');
      expect(slide.shapes[0].options).toHaveProperty('custGeom');
    });

    test('calculates correct bounding box for custom path', async () => {
      const connectionId = flowchart.addConnection('node1', 'node3', 'custom path');
      const connection = flowchart.getConnection(connectionId);
      connection.pathPoints = [
        { x: 2.0, y: 2.0 },
        { x: 1.0, y: 4.0 },
        { x: 4.0, y: 6.0 },
        { x: 3.0, y: 5.0 }
      ];
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      const slide = generator.addFlowchartSlide(flowchart);
      
      const customShape = slide.shapes[0];
      expect(customShape.type).toBe('custGeom');
      
      // Bounding box should encompass all path points
      expect(customShape.options.x).toBe(1.0); // min x
      expect(customShape.options.y).toBe(3.0); // min y + 1 (slide offset)
      expect(customShape.options.w).toBe(3.0); // max x - min x
      expect(customShape.options.h).toBe(4.0); // max y - min y
    });

    test('generates correct path data for custom geometry', async () => {
      const connectionId = flowchart.addConnection('node1', 'node2', 'path data test');
      const connection = flowchart.getConnection(connectionId);
      connection.pathPoints = [
        { x: 1.0, y: 1.0 },
        { x: 2.0, y: 2.0 },
        { x: 3.0, y: 1.0 }
      ];
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      const slide = generator.addFlowchartSlide(flowchart);
      
      const customShape = slide.shapes[0];
      expect(customShape.options.custGeom).toHaveProperty('pathLst');
      expect(customShape.options.custGeom.pathLst).toHaveLength(1);
      
      const pathData = customShape.options.custGeom.pathLst[0].pathData;
      expect(pathData).toMatch(/^M 0 1 L 0.5 0 L 1 1$/); // Relative coordinates
    });

    test('handles custom path with zero dimensions', async () => {
      const connectionId = flowchart.addConnection('node1', 'node2', 'zero dim path');
      const connection = flowchart.getConnection(connectionId);
      connection.pathPoints = [
        { x: 2.0, y: 2.0 },
        { x: 2.0, y: 2.0 }
      ];
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      const slide = generator.addFlowchartSlide(flowchart);
      
      const customShape = slide.shapes[0];
      expect(customShape.type).toBe('custGeom');
      
      // Should handle zero dimensions gracefully
      expect(customShape.options.w).toBe(0.1); // Fallback minimum width
      expect(customShape.options.h).toBe(0.1); // Fallback minimum height
    });

    test('positions label correctly for custom path', async () => {
      const connectionId = flowchart.addConnection('node1', 'node3', 'custom label');
      const connection = flowchart.getConnection(connectionId);
      connection.pathPoints = [
        { x: 1.0, y: 1.0 },
        { x: 2.0, y: 3.0 },
        { x: 3.0, y: 2.0 },
        { x: 4.0, y: 4.0 }
      ];
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      const slide = generator.addFlowchartSlide(flowchart);
      
      // Find the connection label
      const connectionLabel = slide.texts.find(text => text.text === 'custom label');
      expect(connectionLabel).toBeDefined();
      
      // Label should be positioned at the midpoint of the path
      const midIndex = Math.floor(connection.pathPoints.length / 2);
      const midPoint = connection.pathPoints[midIndex];
      
      expect(connectionLabel.options.x).toBe(midPoint.x - 0.5);
      expect(connectionLabel.options.y).toBe(midPoint.y - 0.15);
    });
  });

  describe('Mixed connector types', () => {
    test('handles flowchart with both straight and custom connectors', async () => {
      // Add straight connection
      const straightId = flowchart.addConnection('node1', 'node2', 'straight');
      
      // Add custom path connection
      const customId = flowchart.addConnection('node2', 'node3', 'custom');
      const customConnection = flowchart.getConnection(customId);
      customConnection.pathPoints = [
        { x: 6.0, y: 1.5 },
        { x: 7.0, y: 3.0 },
        { x: 4.0, y: 4.5 }
      ];
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      const slide = generator.addFlowchartSlide(flowchart);
      
      // Should have both line and custGeom shapes
      expect(slide.shapes).toHaveLength(2);
      
      const shapeTypes = slide.shapes.map(shape => shape.type);
      expect(shapeTypes).toContain('line');
      expect(shapeTypes).toContain('custGeom');
    });

    test('handles multiple custom path connectors', async () => {
      // Add multiple custom connections
      const paths = [
        {
          source: 'node1',
          target: 'node2',
          label: 'path1',
          points: [{ x: 1.5, y: 1.5 }, { x: 5.5, y: 1.5 }]
        },
        {
          source: 'node2',
          target: 'node3',
          label: 'path2',
          points: [{ x: 6.0, y: 1.5 }, { x: 4.0, y: 4.5 }]
        },
        {
          source: 'node1',
          target: 'node3',
          label: 'path3',
          points: [{ x: 2.0, y: 1.5 }, { x: 1.0, y: 3.0 }, { x: 3.0, y: 4.5 }]
        }
      ];
      
      for (const path of paths) {
        const connectionId = flowchart.addConnection(path.source, path.target, path.label);
        const connection = flowchart.getConnection(connectionId);
        connection.pathPoints = path.points;
      }
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      const slide = generator.addFlowchartSlide(flowchart);
      
      // Should have all custom geometry shapes
      expect(slide.shapes).toHaveLength(3);
      slide.shapes.forEach(shape => {
        expect(shape.type).toBe('custGeom');
      });
    });
  });

  describe('Arrow head positioning', () => {
    test('applies arrow head to straight line connector', async () => {
      const connectionId = flowchart.addConnection('node1', 'node2', 'arrow test');
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      const slide = generator.addFlowchartSlide(flowchart);
      
      const lineShape = slide.shapes[0];
      expect(lineShape.options.line).toHaveProperty('endArrowType', 'triangle');
      expect(lineShape.options.line).toHaveProperty('color', '666666');
      expect(lineShape.options.line).toHaveProperty('width', 2);
    });

    test('applies arrow head to custom geometry connector', async () => {
      const connectionId = flowchart.addConnection('node1', 'node2', 'custom arrow');
      const connection = flowchart.getConnection(connectionId);
      connection.pathPoints = [
        { x: 1.5, y: 1.5 },
        { x: 3.0, y: 0.5 },
        { x: 5.5, y: 1.5 }
      ];
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      const slide = generator.addFlowchartSlide(flowchart);
      
      const customShape = slide.shapes[0];
      expect(customShape.options.line).toHaveProperty('endArrowType', 'triangle');
      expect(customShape.options.line).toHaveProperty('color', '666666');
      expect(customShape.options.line).toHaveProperty('width', 2);
    });
  });

  describe('Shape styling', () => {
    test('applies correct styling to custom geometry shapes', async () => {
      const connectionId = flowchart.addConnection('node1', 'node2', 'styled custom');
      const connection = flowchart.getConnection(connectionId);
      connection.pathPoints = [
        { x: 1.5, y: 1.5 },
        { x: 5.5, y: 1.5 }
      ];
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      const slide = generator.addFlowchartSlide(flowchart);
      
      const customShape = slide.shapes[0];
      
      // Check fill properties
      expect(customShape.options.fill).toEqual({
        type: 'solid',
        color: 'FFFFFF',
        alpha: 0
      });
      
      // Check line properties
      expect(customShape.options.line).toHaveProperty('color', '666666');
      expect(customShape.options.line).toHaveProperty('width', 2);
      expect(customShape.options.line).toHaveProperty('endArrowType', 'triangle');
    });

    test('maintains consistent styling between straight and custom connectors', async () => {
      // Add both types
      const straightId = flowchart.addConnection('node1', 'node2', 'straight');
      
      const customId = flowchart.addConnection('node2', 'node3', 'custom');
      const customConnection = flowchart.getConnection(customId);
      customConnection.pathPoints = [{ x: 6.0, y: 1.5 }, { x: 4.0, y: 4.5 }];
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      const slide = generator.addFlowchartSlide(flowchart);
      
      const straightShape = slide.shapes.find(s => s.type === 'line');
      const customShape = slide.shapes.find(s => s.type === 'custGeom');
      
      // Both should have same line styling
      expect(straightShape.options.line.color).toBe(customShape.options.line.color);
      expect(straightShape.options.line.width).toBe(customShape.options.line.width);
      expect(straightShape.options.line.endArrowType).toBe(customShape.options.line.endArrowType);
    });
  });

  describe('Error handling', () => {
    test('handles invalid path points gracefully', async () => {
      const connectionId = flowchart.addConnection('node1', 'node2', 'invalid path');
      const connection = flowchart.getConnection(connectionId);
      connection.pathPoints = []; // Empty path
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      
      // Should not throw error, fall back to straight line
      expect(() => {
        const slide = generator.addFlowchartSlide(flowchart);
      }).not.toThrow();
    });

    test('handles single point path', async () => {
      const connectionId = flowchart.addConnection('node1', 'node2', 'single point');
      const connection = flowchart.getConnection(connectionId);
      connection.pathPoints = [{ x: 3.0, y: 2.0 }]; // Single point
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      
      // Should fall back to straight line
      expect(() => {
        const slide = generator.addFlowchartSlide(flowchart);
      }).not.toThrow();
      
      const slide = generator.addFlowchartSlide(flowchart);
      expect(slide.shapes[0].type).toBe('line'); // Should fallback to line
    });

    test('handles malformed path points', async () => {
      const connectionId = flowchart.addConnection('node1', 'node2', 'malformed path');
      const connection = flowchart.getConnection(connectionId);
      connection.pathPoints = [
        { x: 1.0, y: 1.0 },
        { x: 'invalid', y: 2.0 }, // Invalid x coordinate
        { x: 3.0, y: 3.0 }
      ];
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      
      // Should handle gracefully without throwing
      expect(() => {
        const slide = generator.addFlowchartSlide(flowchart);
      }).not.toThrow();
    });
  });

  describe('Performance considerations', () => {
    test('handles connector with many path points', async () => {
      const connectionId = flowchart.addConnection('node1', 'node2', 'many points');
      const connection = flowchart.getConnection(connectionId);
      
      // Create path with 100 points
      const pathPoints = [];
      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        pathPoints.push({
          x: 1.5 + t * 4.0,
          y: 1.5 + Math.sin(t * Math.PI * 4) * 0.5
        });
      }
      connection.pathPoints = pathPoints;
      
      const pptx = generator.createPresentation('Test Presentation', flowchart);
      
      // Should handle large number of points without significant delay
      const startTime = Date.now();
      const slide = generator.addFlowchartSlide(flowchart);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(slide.shapes[0].type).toBe('custGeom');
    });
  });
});