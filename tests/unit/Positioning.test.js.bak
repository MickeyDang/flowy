const Positioning = require('../../src/utils/positioning');
const Flowchart = require('../../src/models/flowchart');

describe('Positioning', () => {
  describe('hierarchicalLayout', () => {
    test('positions single node at margin', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId = flowchart.addNode('Root Node');
      
      Positioning.hierarchicalLayout(flowchart);
      
      const node = flowchart.getNode(nodeId);
      expect(node.x).toBe(0.5); // margin
      expect(node.y).toBe(0.5); // margin
    });

    test('positions nodes in hierarchical levels', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const rootId = flowchart.addNode('Root');
      const child1Id = flowchart.addNode('Child 1');
      const child2Id = flowchart.addNode('Child 2');
      
      flowchart.addConnection(rootId, child1Id);
      flowchart.addConnection(rootId, child2Id);
      
      Positioning.hierarchicalLayout(flowchart);
      
      const root = flowchart.getNode(rootId);
      const child1 = flowchart.getNode(child1Id);
      const child2 = flowchart.getNode(child2Id);
      
      // Root should be at level 0
      expect(root.y).toBe(0.5);
      
      // Children should be at level 1 (1.5 inches below)
      expect(child1.y).toBe(2.0); // 0.5 + 1.5
      expect(child2.y).toBe(2.0);
      
      // Children should be horizontally separated
      expect(child1.x).not.toBe(child2.x);
    });

    test('handles empty flowchart gracefully', () => {
      const flowchart = new Flowchart('test-id', 'Empty');
      
      expect(() => Positioning.hierarchicalLayout(flowchart)).not.toThrow();
    });

    test('finds root nodes correctly', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const node1 = flowchart.addNode('Node 1');
      const node2 = flowchart.addNode('Node 2');
      const node3 = flowchart.addNode('Node 3');
      
      // node1 -> node2 -> node3
      flowchart.addConnection(node1, node2);
      flowchart.addConnection(node2, node3);
      
      const nodes = Array.from(flowchart.nodes.values());
      const connections = flowchart.connections;
      const roots = Positioning.findRootNodes(nodes, connections);
      
      expect(roots.length).toBe(1);
      expect(roots[0].id).toBe(node1);
    });

    test('handles multiple root nodes', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const root1 = flowchart.addNode('Root 1');
      const root2 = flowchart.addNode('Root 2');
      const child = flowchart.addNode('Child');
      
      flowchart.addConnection(root1, child);
      // root2 has no incoming connections, so it's also a root
      
      const nodes = Array.from(flowchart.nodes.values());
      const connections = flowchart.connections;
      const roots = Positioning.findRootNodes(nodes, connections);
      
      expect(roots.length).toBe(2);
      expect(roots.map(r => r.id)).toContain(root1);
      expect(roots.map(r => r.id)).toContain(root2);
    });
  });

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

  describe('assignLevels', () => {
    test('assigns correct levels in chain', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const node1 = flowchart.addNode('Node 1');
      const node2 = flowchart.addNode('Node 2');
      const node3 = flowchart.addNode('Node 3');
      
      flowchart.addConnection(node1, node2);
      flowchart.addConnection(node2, node3);
      
      const nodes = Array.from(flowchart.nodes.values());
      const connections = flowchart.connections;
      const roots = Positioning.findRootNodes(nodes, connections);
      const levels = Positioning.assignLevels(roots, nodes, connections);
      
      expect(levels.get(node1)).toBe(0);
      expect(levels.get(node2)).toBe(1);
      expect(levels.get(node3)).toBe(2);
    });

    test('handles diamond pattern correctly', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const root = flowchart.addNode('Root');
      const left = flowchart.addNode('Left');
      const right = flowchart.addNode('Right');
      const merge = flowchart.addNode('Merge');
      
      flowchart.addConnection(root, left);
      flowchart.addConnection(root, right);
      flowchart.addConnection(left, merge);
      flowchart.addConnection(right, merge);
      
      const nodes = Array.from(flowchart.nodes.values());
      const connections = flowchart.connections;
      const roots = Positioning.findRootNodes(nodes, connections);
      const levels = Positioning.assignLevels(roots, nodes, connections);
      
      expect(levels.get(root)).toBe(0);
      expect(levels.get(left)).toBe(1);
      expect(levels.get(right)).toBe(1);
      expect(levels.get(merge)).toBe(2); // Should be at the maximum level
    });
  });

  describe('positionNodes', () => {
    test('spaces nodes evenly within levels', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const node1 = flowchart.addNode('Node 1');
      const node2 = flowchart.addNode('Node 2');
      const node3 = flowchart.addNode('Node 3');
      
      const nodes = Array.from(flowchart.nodes.values());
      const levels = new Map([
        [node1, 0],
        [node2, 1],
        [node3, 1],
      ]);
      
      Positioning.positionNodes(nodes, levels, 10, 7.5);
      
      const nodeObj1 = flowchart.getNode(node1);
      const nodeObj2 = flowchart.getNode(node2);
      const nodeObj3 = flowchart.getNode(node3);
      
      // Single node in level 0 should be centered-ish
      expect(nodeObj1.y).toBe(0.5);
      
      // Two nodes in level 1 should be at same Y but different X
      expect(nodeObj2.y).toBe(2.0); // 0.5 + 1.5
      expect(nodeObj3.y).toBe(2.0);
      expect(nodeObj2.x).not.toBe(nodeObj3.x);
    });
  });
});