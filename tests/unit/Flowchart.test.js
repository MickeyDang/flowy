const Flowchart = require('../../src/models/flowchart');
const { FlowchartNotFoundError, NodeNotFoundError, ValidationError } = require('../../src/utils/errors');

describe('Flowchart', () => {
  describe('constructor', () => {
    test('creates flowchart with ID and title', () => {
      const flowchart = new Flowchart('test-id', 'Test Flowchart');
      
      expect(flowchart.id).toBe('test-id');
      expect(flowchart.title).toBe('Test Flowchart');
      expect(flowchart.nodes).toBeInstanceOf(Map);
      expect(flowchart.nodes.size).toBe(0);
      expect(flowchart.connections).toEqual([]);
      expect(flowchart.slideWidth).toBe(10);
      expect(flowchart.slideHeight).toBe(7.5);
      expect(flowchart.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('addNode', () => {
    test('adds node with text and position hint', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId = flowchart.addNode('Test Node', { x: 1, y: 2 });
      
      expect(typeof nodeId).toBe('string');
      expect(nodeId).toMatch(/^node_/);
      expect(flowchart.nodes.size).toBe(1);
      
      const node = flowchart.getNode(nodeId);
      expect(node.text).toBe('Test Node');
      expect(node.x).toBe(1);
      expect(node.y).toBe(2);
    });

    test('adds node with default position when no hint provided', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId = flowchart.addNode('Test Node');
      
      const node = flowchart.getNode(nodeId);
      expect(node.x).toBe(0);
      expect(node.y).toBe(0);
    });

    test('throws ValidationError for invalid text', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      
      expect(() => flowchart.addNode('')).toThrow(ValidationError);
      expect(() => flowchart.addNode(null)).toThrow(ValidationError);
    });

    test('throws ValidationError for invalid position hint', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      
      expect(() => flowchart.addNode('Test', { x: 'invalid' })).toThrow(ValidationError);
      expect(() => flowchart.addNode('Test', { y: -1 })).toThrow(ValidationError);
    });
  });

  describe('removeNode', () => {
    test('removes node and associated connections', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId1 = flowchart.addNode('Node 1');
      const nodeId2 = flowchart.addNode('Node 2');
      
      flowchart.addConnection(nodeId1, nodeId2, 'test connection');
      expect(flowchart.connections.length).toBe(1);
      
      flowchart.removeNode(nodeId1);
      
      expect(flowchart.nodes.size).toBe(1);
      expect(flowchart.getNode(nodeId1)).toBeUndefined();
      expect(flowchart.connections.length).toBe(0);
    });

    test('throws NodeNotFoundError for non-existent node', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      
      expect(() => flowchart.removeNode('non-existent')).toThrow(NodeNotFoundError);
    });

    test('throws ValidationError for invalid node ID', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      
      expect(() => flowchart.removeNode('')).toThrow(ValidationError);
      expect(() => flowchart.removeNode(null)).toThrow(ValidationError);
    });
  });

  describe('addConnection', () => {
    test('adds connection between existing nodes', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId1 = flowchart.addNode('Node 1');
      const nodeId2 = flowchart.addNode('Node 2');
      
      flowchart.addConnection(nodeId1, nodeId2, 'test label');
      
      expect(flowchart.connections.length).toBe(1);
      expect(flowchart.connections[0]).toMatchObject({
        sourceId: nodeId1,
        targetId: nodeId2,
        label: 'test label',
        pathPoints: null
      });
      expect(flowchart.connections[0]).toHaveProperty('id');
      expect(typeof flowchart.connections[0].id).toBe('string');
    });

    test('adds connection without label', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId1 = flowchart.addNode('Node 1');
      const nodeId2 = flowchart.addNode('Node 2');
      
      flowchart.addConnection(nodeId1, nodeId2);
      
      expect(flowchart.connections[0].label).toBe('');
    });

    test('throws NodeNotFoundError for non-existent source node', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId2 = flowchart.addNode('Node 2');
      
      expect(() => flowchart.addConnection('non-existent', nodeId2)).toThrow(NodeNotFoundError);
    });

    test('throws NodeNotFoundError for non-existent target node', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId1 = flowchart.addNode('Node 1');
      
      expect(() => flowchart.addConnection(nodeId1, 'non-existent')).toThrow(NodeNotFoundError);
    });

    test('throws ValidationError for invalid node IDs', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId = flowchart.addNode('Node');
      
      expect(() => flowchart.addConnection('', nodeId)).toThrow(ValidationError);
      expect(() => flowchart.addConnection(nodeId, null)).toThrow(ValidationError);
    });
  });

  describe('removeConnection', () => {
    test('removes specific connection', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId1 = flowchart.addNode('Node 1');
      const nodeId2 = flowchart.addNode('Node 2');
      const nodeId3 = flowchart.addNode('Node 3');
      
      flowchart.addConnection(nodeId1, nodeId2);
      flowchart.addConnection(nodeId2, nodeId3);
      
      flowchart.removeConnection(nodeId1, nodeId2);
      
      expect(flowchart.connections.length).toBe(1);
      expect(flowchart.connections[0].sourceId).toBe(nodeId2);
      expect(flowchart.connections[0].targetId).toBe(nodeId3);
    });
  });

  describe('getNode', () => {
    test('returns node by ID', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId = flowchart.addNode('Test Node');
      
      const node = flowchart.getNode(nodeId);
      
      expect(node).toBeDefined();
      expect(node.text).toBe('Test Node');
    });

    test('returns undefined for non-existent node', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      
      const node = flowchart.getNode('non-existent');
      
      expect(node).toBeUndefined();
    });
  });

  describe('getConnections', () => {
    test('returns all connections', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const nodeId1 = flowchart.addNode('Node 1');
      const nodeId2 = flowchart.addNode('Node 2');
      
      flowchart.addConnection(nodeId1, nodeId2);
      
      const connections = flowchart.getConnections();
      
      expect(connections).toEqual(flowchart.connections);
      expect(connections.length).toBe(1);
    });
  });

  describe('setLayout and getLayout', () => {
    test('sets and gets layout', () => {
      const flowchart = new Flowchart('test-id', 'Test');
      const layout = { nodes: new Map(), connections: [] };
      
      flowchart.setLayout(layout);
      
      expect(flowchart.getLayout()).toBe(layout);
    });
  });

  describe('toJSON', () => {
    test('serializes flowchart to JSON', () => {
      const flowchart = new Flowchart('test-id', 'Test Flowchart');
      const nodeId = flowchart.addNode('Test Node');
      
      const json = flowchart.toJSON();
      
      expect(json).toEqual({
        id: 'test-id',
        title: 'Test Flowchart',
        nodes: [expect.objectContaining({
          id: nodeId,
          text: 'Test Node',
        })],
        connections: [],
        layout: null,
        slideWidth: 10,
        slideHeight: 7.5,
        createdAt: flowchart.createdAt,
      });
    });
  });

  describe('fromJSON', () => {
    test('creates flowchart from JSON data', () => {
      const data = {
        id: 'test-id',
        title: 'Test Flowchart',
        nodes: [
          {
            id: 'node-1',
            text: 'Test Node',
            x: 1,
            y: 2,
            width: 1.5,
            height: 0.5,
            properties: {},
            createdAt: new Date().toISOString(),
          },
        ],
        connections: [
          {
            sourceId: 'node-1',
            targetId: 'node-2',
            label: 'test',
          },
        ],
        slideWidth: 12,
        slideHeight: 9,
        createdAt: new Date().toISOString(),
      };
      
      const flowchart = Flowchart.fromJSON(data);
      
      expect(flowchart.id).toBe('test-id');
      expect(flowchart.title).toBe('Test Flowchart');
      expect(flowchart.nodes.size).toBe(1);
      expect(flowchart.connections.length).toBe(1);
      expect(flowchart.slideWidth).toBe(12);
      expect(flowchart.slideHeight).toBe(9);
    });
  });
});