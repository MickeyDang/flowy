const { callTool } = require('../../src/tools/flowchart-tools');

describe('get_bounding_box', () => {
  let flowchartId, nodeId1, nodeId2, connectionId;

  beforeEach(async () => {
    // Create flowchart
    const flowchartResult = await callTool('create_flowchart', { title: 'Test Flowchart' });
    flowchartId = flowchartResult.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];
    
    // Add nodes
    const node1Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Node 1',
      positionHint: { x: 1, y: 2 }
    });
    nodeId1 = node1Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    
    const node2Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Node 2',
      positionHint: { x: 4, y: 5 }
    });
    nodeId2 = node2Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    
    // Add connection
    const connectionResult = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId1,
      targetNodeId: nodeId2,
      label: 'test connection'
    });
    connectionId = connectionResult.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];
  });

  describe('node bounding boxes', () => {
    test('returns bounding box for existing node', async () => {
      const result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node'
      });
      
      expect(result.isError).toBeUndefined();
      const boundingBox = JSON.parse(result.content[0].text);
      
      expect(boundingBox).toHaveProperty('topLeft');
      expect(boundingBox).toHaveProperty('bottomRight');
      expect(boundingBox).toHaveProperty('center');
      expect(boundingBox).toHaveProperty('width');
      expect(boundingBox).toHaveProperty('height');
      
      expect(boundingBox.topLeft).toHaveProperty('x');
      expect(boundingBox.topLeft).toHaveProperty('y');
      expect(boundingBox.bottomRight).toHaveProperty('x');
      expect(boundingBox.bottomRight).toHaveProperty('y');
      expect(boundingBox.center).toHaveProperty('x');
      expect(boundingBox.center).toHaveProperty('y');
      
      expect(typeof boundingBox.width).toBe('number');
      expect(typeof boundingBox.height).toBe('number');
    });

    test('calculates correct node bounding box coordinates', async () => {
      // Resize node to known dimensions
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 2.0,
        height: 1.0
      });
      
      // Set position to known coordinates
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 3.0,
        y: 4.0
      });
      
      const result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node'
      });
      
      const boundingBox = JSON.parse(result.content[0].text);
      
      expect(boundingBox.topLeft.x).toBe(3.0);
      expect(boundingBox.topLeft.y).toBe(4.0);
      expect(boundingBox.bottomRight.x).toBe(5.0);
      expect(boundingBox.bottomRight.y).toBe(5.0);
      expect(boundingBox.center.x).toBe(4.0);
      expect(boundingBox.center.y).toBe(4.5);
      expect(boundingBox.width).toBe(2.0);
      expect(boundingBox.height).toBe(1.0);
    });

    test('handles node at origin', async () => {
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 0,
        y: 0
      });
      
      const result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node'
      });
      
      const boundingBox = JSON.parse(result.content[0].text);
      
      expect(boundingBox.topLeft.x).toBe(0);
      expect(boundingBox.topLeft.y).toBe(0);
      expect(boundingBox.bottomRight.x).toBeGreaterThan(0);
      expect(boundingBox.bottomRight.y).toBeGreaterThan(0);
    });
  });

  describe('connector bounding boxes', () => {
    test('returns bounding box for existing connector', async () => {
      const result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: connectionId,
        elementType: 'connector'
      });
      
      expect(result.isError).toBeUndefined();
      const boundingBox = JSON.parse(result.content[0].text);
      
      expect(boundingBox).toHaveProperty('topLeft');
      expect(boundingBox).toHaveProperty('bottomRight');
      expect(boundingBox).toHaveProperty('center');
      expect(boundingBox).toHaveProperty('width');
      expect(boundingBox).toHaveProperty('height');
    });

    test('calculates bounding box for straight connector', async () => {
      // Position nodes at known locations
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 1.0,
        y: 1.0
      });
      
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId2,
        elementType: 'node',
        x: 4.0,
        y: 3.0
      });
      
      const result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: connectionId,
        elementType: 'connector'
      });
      
      const boundingBox = JSON.parse(result.content[0].text);
      
      // Bounding box should encompass both node centers
      expect(boundingBox.width).toBeGreaterThan(0);
      expect(boundingBox.height).toBeGreaterThan(0);
      expect(boundingBox.topLeft.x).toBeLessThanOrEqual(boundingBox.bottomRight.x);
      expect(boundingBox.topLeft.y).toBeLessThanOrEqual(boundingBox.bottomRight.y);
    });

    test('calculates bounding box for connector with custom path', async () => {
      // Set custom path points
      await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 2.0, y: 3.0 },
          { x: 4.0, y: 2.0 },
          { x: 5.0, y: 4.0 }
        ]
      });
      
      const result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: connectionId,
        elementType: 'connector'
      });
      
      const boundingBox = JSON.parse(result.content[0].text);
      
      // Should encompass all path points
      expect(boundingBox.topLeft.x).toBe(1.0);
      expect(boundingBox.topLeft.y).toBe(1.0);
      expect(boundingBox.bottomRight.x).toBe(5.0);
      expect(boundingBox.bottomRight.y).toBe(4.0);
      expect(boundingBox.width).toBe(4.0);
      expect(boundingBox.height).toBe(3.0);
      expect(boundingBox.center.x).toBe(3.0);
      expect(boundingBox.center.y).toBe(2.5);
    });
  });

  describe('validation errors', () => {
    test('handles non-existent flowchart', async () => {
      const result = await callTool('get_bounding_box', {
        flowchartId: 'non-existent',
        elementId: nodeId1,
        elementType: 'node'
      });
      
      expect(result.content[0].text).toMatch(/Error:.*not found/);
      expect(result.isError).toBe(true);
    });

    test('handles non-existent node', async () => {
      const result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: 'non-existent',
        elementType: 'node'
      });
      
      expect(result.content[0].text).toMatch(/Error:.*not found/);
      expect(result.isError).toBe(true);
    });

    test('handles non-existent connector', async () => {
      const result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: 'non-existent',
        elementType: 'connector'
      });
      
      expect(result.content[0].text).toMatch(/Error:.*not found/);
      expect(result.isError).toBe(true);
    });

    test('handles invalid element type', async () => {
      const result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'invalid'
      });
      
      expect(result.content[0].text).toMatch(/Error: Invalid element type: invalid/);
      expect(result.isError).toBe(true);
    });

    test('handles missing required parameters', async () => {
      const result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: nodeId1
        // Missing elementType
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('handles very small node', async () => {
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 0.1,
        height: 0.1
      });
      
      const result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node'
      });
      
      const boundingBox = JSON.parse(result.content[0].text);
      expect(boundingBox.width).toBe(0.1);
      expect(boundingBox.height).toBe(0.1);
    });

    test('handles very large node', async () => {
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 8.0,
        height: 6.0
      });
      
      const result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node'
      });
      
      const boundingBox = JSON.parse(result.content[0].text);
      expect(boundingBox.width).toBe(8.0);
      expect(boundingBox.height).toBe(6.0);
    });

    test('handles node with floating point dimensions', async () => {
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 1.234,
        height: 0.567
      });
      
      const result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node'
      });
      
      const boundingBox = JSON.parse(result.content[0].text);
      expect(boundingBox.width).toBe(1.234);
      expect(boundingBox.height).toBe(0.567);
    });

    test('handles connector with single point path', async () => {
      await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 2.0, y: 2.0 },
          { x: 2.0, y: 2.0 }
        ]
      });
      
      const result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: connectionId,
        elementType: 'connector'
      });
      
      const boundingBox = JSON.parse(result.content[0].text);
      expect(boundingBox.width).toBe(0);
      expect(boundingBox.height).toBe(0);
      expect(boundingBox.center.x).toBe(2.0);
      expect(boundingBox.center.y).toBe(2.0);
    });
  });
});