const { callTool } = require('../../src/tools/flowchart-tools');

describe('get_connector_points', () => {
  let flowchartId, nodeId1, nodeId2, connectionId;

  beforeEach(async () => {
    // Create flowchart
    const flowchartResult = await callTool('create_flowchart', { title: 'Test Flowchart' });
    flowchartId = flowchartResult.content[0].text.match(/ID: (.+)$/)[1];
    
    // Add nodes with known positions
    const node1Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Node 1',
      positionHint: { x: 1, y: 1 }
    });
    nodeId1 = node1Result.content[0].text.match(/ID: (.+)$/)[1];
    
    const node2Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Node 2',
      positionHint: { x: 4, y: 3 }
    });
    nodeId2 = node2Result.content[0].text.match(/ID: (.+)$/)[1];
    
    // Add connection
    const connectionResult = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId1,
      targetNodeId: nodeId2,
      label: 'test connection'
    });
    connectionId = connectionResult.content[0].text.match(/with ID: (.+)$/)[1];
  });

  describe('successful point retrieval', () => {
    test('returns connector points for existing connection', async () => {
      const result = await callTool('get_connector_points', {
        flowchartId,
        connectionId
      });
      
      expect(result.isError).toBeUndefined();
      const points = JSON.parse(result.content[0].text);
      
      expect(points).toHaveProperty('sourceNodeId');
      expect(points).toHaveProperty('targetNodeId');
      expect(points).toHaveProperty('startPoint');
      expect(points).toHaveProperty('endPoint');
      expect(points).toHaveProperty('label');
      
      expect(points.sourceNodeId).toBe(nodeId1);
      expect(points.targetNodeId).toBe(nodeId2);
      expect(points.label).toBe('test connection');
      
      expect(points.startPoint).toHaveProperty('x');
      expect(points.startPoint).toHaveProperty('y');
      expect(points.endPoint).toHaveProperty('x');
      expect(points.endPoint).toHaveProperty('y');
      
      expect(typeof points.startPoint.x).toBe('number');
      expect(typeof points.startPoint.y).toBe('number');
      expect(typeof points.endPoint.x).toBe('number');
      expect(typeof points.endPoint.y).toBe('number');
    });

    test('calculates correct points for horizontal connection', async () => {
      // Position nodes horizontally
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 1.0,
        y: 2.0
      });
      
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId2,
        elementType: 'node',
        x: 4.0,
        y: 2.0
      });
      
      // Resize to known dimensions
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 2.0,
        height: 1.0
      });
      
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId2,
        width: 2.0,
        height: 1.0
      });
      
      const result = await callTool('get_connector_points', {
        flowchartId,
        connectionId
      });
      
      const points = JSON.parse(result.content[0].text);
      
      // For horizontal connection, should connect from right edge of source to left edge of target
      expect(points.startPoint.x).toBe(3.0); // node1.x + node1.width
      expect(points.startPoint.y).toBe(2.5); // node1.y + node1.height/2
      expect(points.endPoint.x).toBe(4.0);   // node2.x
      expect(points.endPoint.y).toBe(2.5);   // node2.y + node2.height/2
    });

    test('calculates correct points for vertical connection', async () => {
      // Position nodes vertically
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 2.0,
        y: 1.0
      });
      
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId2,
        elementType: 'node',
        x: 2.0,
        y: 4.0
      });
      
      // Resize to known dimensions
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 2.0,
        height: 1.0
      });
      
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId2,
        width: 2.0,
        height: 1.0
      });
      
      const result = await callTool('get_connector_points', {
        flowchartId,
        connectionId
      });
      
      const points = JSON.parse(result.content[0].text);
      
      // For vertical connection, should connect from bottom edge of source to top edge of target
      expect(points.startPoint.x).toBe(3.0); // node1.x + node1.width/2
      expect(points.startPoint.y).toBe(2.0); // node1.y + node1.height
      expect(points.endPoint.x).toBe(3.0);   // node2.x + node2.width/2
      expect(points.endPoint.y).toBe(4.0);   // node2.y
    });

    test('handles connection without label', async () => {
      // Create connection without label
      const connectionResult = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2
      });
      const unlabeledConnectionId = connectionResult.content[0].text.match(/with ID: (.+)$/)[1];
      
      const result = await callTool('get_connector_points', {
        flowchartId,
        connectionId: unlabeledConnectionId
      });
      
      const points = JSON.parse(result.content[0].text);
      expect(points.label).toBe('');
    });
  });

  describe('validation errors', () => {
    test('handles non-existent flowchart', async () => {
      const result = await callTool('get_connector_points', {
        flowchartId: 'non-existent',
        connectionId
      });
      
      expect(result.content[0].text).toMatch(/Error: Flowchart not found: non-existent/);
      expect(result.isError).toBe(true);
    });

    test('handles non-existent connection', async () => {
      const result = await callTool('get_connector_points', {
        flowchartId,
        connectionId: 'non-existent'
      });
      
      expect(result.content[0].text).toMatch(/Error: Connection not found: non-existent/);
      expect(result.isError).toBe(true);
    });

    test('handles missing required parameters', async () => {
      const result = await callTool('get_connector_points', {
        flowchartId
        // Missing connectionId
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles missing flowchartId', async () => {
      const result = await callTool('get_connector_points', {
        connectionId
        // Missing flowchartId
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('handles nodes at same position', async () => {
      // Position both nodes at the same location
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 2.0,
        y: 2.0
      });
      
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId2,
        elementType: 'node',
        x: 2.0,
        y: 2.0
      });
      
      const result = await callTool('get_connector_points', {
        flowchartId,
        connectionId
      });
      
      const points = JSON.parse(result.content[0].text);
      
      // Should still calculate points, even if overlapping
      expect(typeof points.startPoint.x).toBe('number');
      expect(typeof points.startPoint.y).toBe('number');
      expect(typeof points.endPoint.x).toBe('number');
      expect(typeof points.endPoint.y).toBe('number');
    });

    test('handles very small nodes', async () => {
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 0.01,
        height: 0.01
      });
      
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId2,
        width: 0.01,
        height: 0.01
      });
      
      const result = await callTool('get_connector_points', {
        flowchartId,
        connectionId
      });
      
      const points = JSON.parse(result.content[0].text);
      
      // Should still calculate valid points
      expect(typeof points.startPoint.x).toBe('number');
      expect(typeof points.startPoint.y).toBe('number');
      expect(typeof points.endPoint.x).toBe('number');
      expect(typeof points.endPoint.y).toBe('number');
    });

    test('handles very large nodes', async () => {
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 8.0,
        height: 6.0
      });
      
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId2,
        width: 8.0,
        height: 6.0
      });
      
      const result = await callTool('get_connector_points', {
        flowchartId,
        connectionId
      });
      
      const points = JSON.parse(result.content[0].text);
      
      // Should calculate points at the edges of large nodes
      expect(typeof points.startPoint.x).toBe('number');
      expect(typeof points.startPoint.y).toBe('number');
      expect(typeof points.endPoint.x).toBe('number');
      expect(typeof points.endPoint.y).toBe('number');
    });

    test('handles reverse direction connection', async () => {
      // Create a connection from node2 to node1 (reverse direction)
      const reverseResult = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeId2,
        targetNodeId: nodeId1,
        label: 'reverse connection'
      });
      const reverseConnectionId = reverseResult.content[0].text.match(/with ID: (.+)$/)[1];
      
      const result = await callTool('get_connector_points', {
        flowchartId,
        connectionId: reverseConnectionId
      });
      
      const points = JSON.parse(result.content[0].text);
      
      expect(points.sourceNodeId).toBe(nodeId2);
      expect(points.targetNodeId).toBe(nodeId1);
      expect(points.label).toBe('reverse connection');
    });

    test('handles self-connecting node', async () => {
      // Create a connection from node1 to itself
      const selfResult = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId1,
        label: 'self connection'
      });
      const selfConnectionId = selfResult.content[0].text.match(/with ID: (.+)$/)[1];
      
      const result = await callTool('get_connector_points', {
        flowchartId,
        connectionId: selfConnectionId
      });
      
      const points = JSON.parse(result.content[0].text);
      
      expect(points.sourceNodeId).toBe(nodeId1);
      expect(points.targetNodeId).toBe(nodeId1);
      expect(points.label).toBe('self connection');
    });
  });
});