const LayoutEngine = require('../../src/tools/layout-engine');
const Flowchart = require('../../src/models/flowchart');
const { FileGenerationError } = require('../../src/utils/errors');

// Mock the Positioning module
jest.mock('../../src/utils/positioning', () => ({
  hierarchicalLayout: jest.fn(),
  calculateConnectionPoints: jest.fn(() => ({
    startX: 1,
    startY: 1,
    endX: 2,
    endY: 2,
  })),
}));

const Positioning = require('../../src/utils/positioning');

describe('LayoutEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateLayout', () => {
    test('calculates layout for valid flowchart', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId1 = flowchart.addNode('Node 1');
      const nodeId2 = flowchart.addNode('Node 2');
      flowchart.addConnection(nodeId1, nodeId2, 'test connection');
      
      // Mock the hierarchical layout to set positions
      Positioning.hierarchicalLayout.mockImplementation((fc) => {
        fc.getNode(nodeId1).setPosition(1, 1);
        fc.getNode(nodeId2).setPosition(3, 2);
      });
      
      const layout = LayoutEngine.calculateLayout(flowchart);
      
      expect(Positioning.hierarchicalLayout).toHaveBeenCalledWith(flowchart);
      expect(layout.nodes.size).toBe(2);
      expect(layout.connections.length).toBe(1);
      
      const node1Layout = layout.nodes.get(nodeId1);
      expect(node1Layout).toEqual({
        x: 1,
        y: 1,
        width: expect.any(Number),
        height: expect.any(Number),
      });
      
      const connection = layout.connections[0];
      expect(connection).toEqual({
        sourceId: nodeId1,
        targetId: nodeId2,
        label: 'test connection',
        path: {
          startX: 1,
          startY: 1,
          endX: 2,
          endY: 2,
        },
      });
    });

    test('handles empty flowchart', () => {
      const flowchart = new Flowchart('test-id', 'Empty');
      
      const layout = LayoutEngine.calculateLayout(flowchart);
      
      expect(layout.nodes.size).toBe(0);
      expect(layout.connections.length).toBe(0);
    });

    test('throws FileGenerationError for invalid flowchart', () => {
      expect(() => LayoutEngine.calculateLayout(null)).toThrow(FileGenerationError);
      expect(() => LayoutEngine.calculateLayout({})).toThrow(FileGenerationError);
      expect(() => LayoutEngine.calculateLayout({ nodes: null })).toThrow(FileGenerationError);
    });

    test('handles nodes without proper positioning', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId = flowchart.addNode('Test Node');
      
      // Mock positioning to set invalid positions
      Positioning.hierarchicalLayout.mockImplementation((fc) => {
        const node = fc.getNode(nodeId);
        node.x = 'invalid';
        node.y = null;
      });
      
      const layout = LayoutEngine.calculateLayout(flowchart);
      
      // Should not include nodes with invalid positions
      expect(layout.nodes.size).toBe(0);
    });

    test('provides default dimensions for nodes', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId = flowchart.addNode('Test Node');
      
      Positioning.hierarchicalLayout.mockImplementation((fc) => {
        const node = fc.getNode(nodeId);
        node.setPosition(1, 1);
        // Clear dimensions to test defaults
        node.width = undefined;
        node.height = undefined;
      });
      
      const layout = LayoutEngine.calculateLayout(flowchart);
      
      const nodeLayout = layout.nodes.get(nodeId);
      expect(nodeLayout.width).toBe(1); // default width
      expect(nodeLayout.height).toBe(0.5); // default height
    });
  });

  describe('calculateConnectionPaths', () => {
    test('calculates paths for valid connections', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId1 = flowchart.addNode('Node 1');
      const nodeId2 = flowchart.addNode('Node 2');
      
      const connections = [
        { sourceId: nodeId1, targetId: nodeId2, label: 'test' },
      ];
      
      const paths = LayoutEngine.calculateConnectionPaths(connections, flowchart.nodes);
      
      expect(paths.length).toBe(1);
      expect(paths[0]).toEqual({
        sourceId: nodeId1,
        targetId: nodeId2,
        label: 'test',
        path: {
          startX: 1,
          startY: 1,
          endX: 2,
          endY: 2,
        },
      });
      
      expect(Positioning.calculateConnectionPoints).toHaveBeenCalledWith(
        flowchart.getNode(nodeId1),
        flowchart.getNode(nodeId2)
      );
    });

    test('filters out connections with missing nodes', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId1 = flowchart.addNode('Node 1');
      
      const connections = [
        { sourceId: nodeId1, targetId: 'non-existent', label: 'test' },
        { sourceId: 'non-existent', targetId: nodeId1, label: 'test2' },
      ];
      
      const paths = LayoutEngine.calculateConnectionPaths(connections, flowchart.nodes);
      
      expect(paths.length).toBe(0);
    });

    test('handles empty connections array', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      
      const paths = LayoutEngine.calculateConnectionPaths([], flowchart.nodes);
      
      expect(paths).toEqual([]);
    });
  });
});