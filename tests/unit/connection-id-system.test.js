const { callTool } = require('../../src/tools/flowchart-tools');

describe('Connection ID System', () => {
  let flowchartId, nodeId1, nodeId2, nodeId3;

  beforeEach(async () => {
    // Create flowchart
    const flowchartResult = await callTool('create_flowchart', { title: 'Connection ID Test' });
    flowchartId = flowchartResult.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];
    
    // Add nodes
    const node1Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Node 1',
      positionHint: { x: 1, y: 1 }
    });
    nodeId1 = node1Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    
    const node2Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Node 2',
      positionHint: { x: 4, y: 1 }
    });
    nodeId2 = node2Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    
    const node3Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Node 3',
      positionHint: { x: 7, y: 1 }
    });
    nodeId3 = node3Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
  });

  describe('Connection ID generation', () => {
    test('generates unique connection IDs', async () => {
      const connectionIds = [];
      
      // Create multiple connections
      for (let i = 0; i < 5; i++) {
        const result = await callTool('add_connection', {
          flowchartId,
          sourceNodeId: nodeId1,
          targetNodeId: nodeId2,
          label: `connection ${i}`
        });
        
        expect(result.isError).toBeUndefined();
        const connectionId = result.content[0].text.match(/with ID: (.+)$/)[1];
        connectionIds.push(connectionId);
      }
      
      // Verify all IDs are unique
      const uniqueIds = new Set(connectionIds);
      expect(uniqueIds.size).toBe(connectionIds.length);
      
      // Verify ID format (should start with 'conn_')
      connectionIds.forEach(id => {
        expect(id).toMatch(/^conn_\d+_[a-z0-9]+$/);
      });
    });

    test('generates IDs with timestamp component', async () => {
      const before = Date.now();
      
      const result = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        label: 'timestamped connection'
      });
      
      const after = Date.now();
      
      expect(result.isError).toBeUndefined();
      const connectionId = result.content[0].text.match(/with ID: (.+)$/)[1];
      
      // Extract timestamp from ID
      const timestampStr = connectionId.match(/^conn_(\d+)_/)[1];
      const timestamp = parseInt(timestampStr);
      
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    test('generates IDs with random component', async () => {
      const connectionIds = [];
      
      // Create connections in rapid succession
      for (let i = 0; i < 10; i++) {
        const result = await callTool('add_connection', {
          flowchartId,
          sourceNodeId: nodeId1,
          targetNodeId: nodeId2,
          label: `rapid connection ${i}`
        });
        
        const connectionId = result.content[0].text.match(/with ID: (.+)$/)[1];
        connectionIds.push(connectionId);
      }
      
      // Extract random components
      const randomComponents = connectionIds.map(id => {
        return id.match(/^conn_\d+_([a-z0-9]+)$/)[1];
      });
      
      // Verify all random components are different
      const uniqueRandoms = new Set(randomComponents);
      expect(uniqueRandoms.size).toBe(randomComponents.length);
      
      // Verify random component format (alphanumeric, length 9)
      randomComponents.forEach(random => {
        expect(random).toMatch(/^[a-z0-9]{9}$/);
      });
    });
  });

  describe('Connection ID retrieval', () => {
    test('retrieves connection by ID', async () => {
      // Create connection
      const createResult = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        label: 'test connection'
      });
      
      const connectionId = createResult.content[0].text.match(/with ID: (.+)$/)[1];
      
      // Retrieve connection points by ID
      const pointsResult = await callTool('get_connector_points', {
        flowchartId,
        connectionId
      });
      
      expect(pointsResult.isError).toBeUndefined();
      const points = JSON.parse(pointsResult.content[0].text);
      
      expect(points.sourceNodeId).toBe(nodeId1);
      expect(points.targetNodeId).toBe(nodeId2);
      expect(points.label).toBe('test connection');
    });

    test('retrieves connection bounding box by ID', async () => {
      // Create connection
      const createResult = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId3,
        label: 'bounding box test'
      });
      
      const connectionId = createResult.content[0].text.match(/with ID: (.+)$/)[1];
      
      // Get bounding box by ID
      const boundingBoxResult = await callTool('get_bounding_box', {
        flowchartId,
        elementId: connectionId,
        elementType: 'connector'
      });
      
      expect(boundingBoxResult.isError).toBeUndefined();
      const boundingBox = JSON.parse(boundingBoxResult.content[0].text);
      
      expect(boundingBox).toHaveProperty('topLeft');
      expect(boundingBox).toHaveProperty('bottomRight');
      expect(boundingBox).toHaveProperty('center');
      expect(boundingBox).toHaveProperty('width');
      expect(boundingBox).toHaveProperty('height');
    });

    test('sets custom path by connection ID', async () => {
      // Create connection
      const createResult = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId3,
        label: 'path test'
      });
      
      const connectionId = createResult.content[0].text.match(/with ID: (.+)$/)[1];
      
      // Set custom path by ID
      const pathResult = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.5, y: 1.5 },
          { x: 4.0, y: 0.5 },
          { x: 6.5, y: 1.5 }
        ]
      });
      
      expect(pathResult.isError).toBeUndefined();
      expect(pathResult.content[0].text).toMatch(new RegExp(`Custom path set for connection ${connectionId}`));
    });
  });

  describe('Connection ID validation', () => {
    test('handles invalid connection ID format', async () => {
      const result = await callTool('get_connector_points', {
        flowchartId,
        connectionId: 'invalid-format'
      });
      
      expect(result.content[0].text).toMatch(/Error:.*not found/);
      expect(result.isError).toBe(true);
    });

    test('handles non-existent connection ID', async () => {
      const fakeId = 'conn_1234567890_abcdefghi';
      
      const result = await callTool('get_connector_points', {
        flowchartId,
        connectionId: fakeId
      });
      
      expect(result.content[0].text).toMatch(/Error:.*not found/);
      expect(result.isError).toBe(true);
    });

    test('handles empty connection ID', async () => {
      const result = await callTool('get_connector_points', {
        flowchartId,
        connectionId: ''
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles null connection ID', async () => {
      const result = await callTool('get_connector_points', {
        flowchartId,
        connectionId: null
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });
  });

  describe('Multiple connections between same nodes', () => {
    test('creates multiple connections with different IDs', async () => {
      const connectionIds = [];
      const labels = ['first', 'second', 'third'];
      
      // Create multiple connections between same nodes
      for (const label of labels) {
        const result = await callTool('add_connection', {
          flowchartId,
          sourceNodeId: nodeId1,
          targetNodeId: nodeId2,
          label
        });
        
        expect(result.isError).toBeUndefined();
        const connectionId = result.content[0].text.match(/with ID: (.+)$/)[1];
        connectionIds.push(connectionId);
      }
      
      // Verify all connections have unique IDs
      const uniqueIds = new Set(connectionIds);
      expect(uniqueIds.size).toBe(connectionIds.length);
      
      // Verify each connection can be retrieved independently
      for (let i = 0; i < connectionIds.length; i++) {
        const pointsResult = await callTool('get_connector_points', {
          flowchartId,
          connectionId: connectionIds[i]
        });
        
        expect(pointsResult.isError).toBeUndefined();
        const points = JSON.parse(pointsResult.content[0].text);
        expect(points.label).toBe(labels[i]);
      }
    });

    test('sets different paths for multiple connections', async () => {
      // Create two connections between same nodes
      const connection1Result = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        label: 'top path'
      });
      const connectionId1 = connection1Result.content[0].text.match(/with ID: (.+)$/)[1];
      
      const connection2Result = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        label: 'bottom path'
      });
      const connectionId2 = connection2Result.content[0].text.match(/with ID: (.+)$/)[1];
      
      // Set different paths
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 1.5, y: 1.5 },
          { x: 2.5, y: 0.5 },
          { x: 3.5, y: 1.5 }
        ]
      });
      
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId2,
        pathPoints: [
          { x: 1.5, y: 1.5 },
          { x: 2.5, y: 2.5 },
          { x: 3.5, y: 1.5 }
        ]
      });
      
      // Verify different bounding boxes
      const boundingBox1Result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: connectionId1,
        elementType: 'connector'
      });
      const boundingBox1 = JSON.parse(boundingBox1Result.content[0].text);
      
      const boundingBox2Result = await callTool('get_bounding_box', {
        flowchartId,
        elementId: connectionId2,
        elementType: 'connector'
      });
      const boundingBox2 = JSON.parse(boundingBox2Result.content[0].text);
      
      // Top path should have lower Y values than bottom path
      expect(boundingBox1.topLeft.y).toBeLessThan(boundingBox2.topLeft.y);
    });
  });

  describe('Connection ID persistence', () => {
    test('connection ID remains stable after node repositioning', async () => {
      // Create connection
      const createResult = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        label: 'stable connection'
      });
      const connectionId = createResult.content[0].text.match(/with ID: (.+)$/)[1];
      
      // Get initial connection points
      const initialPointsResult = await callTool('get_connector_points', {
        flowchartId,
        connectionId
      });
      const initialPoints = JSON.parse(initialPointsResult.content[0].text);
      
      // Move nodes
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
        x: 5.0,
        y: 3.0
      });
      
      // Get updated connection points using same ID
      const updatedPointsResult = await callTool('get_connector_points', {
        flowchartId,
        connectionId
      });
      expect(updatedPointsResult.isError).toBeUndefined();
      
      const updatedPoints = JSON.parse(updatedPointsResult.content[0].text);
      
      // ID and node references should remain the same
      expect(updatedPoints.sourceNodeId).toBe(initialPoints.sourceNodeId);
      expect(updatedPoints.targetNodeId).toBe(initialPoints.targetNodeId);
      expect(updatedPoints.label).toBe(initialPoints.label);
      
      // But coordinates should be different
      expect(updatedPoints.startPoint.x).not.toBe(initialPoints.startPoint.x);
      expect(updatedPoints.startPoint.y).not.toBe(initialPoints.startPoint.y);
    });

    test('connection ID remains stable after custom path changes', async () => {
      // Create connection
      const createResult = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId3,
        label: 'path changing connection'
      });
      const connectionId = createResult.content[0].text.match(/with ID: (.+)$/)[1];
      
      // Set initial custom path
      await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.5, y: 1.5 },
          { x: 6.5, y: 1.5 }
        ]
      });
      
      // Change path
      await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.5, y: 1.5 },
          { x: 4.0, y: 3.0 },
          { x: 6.5, y: 1.5 }
        ]
      });
      
      // Verify connection can still be retrieved by same ID
      const pointsResult = await callTool('get_connector_points', {
        flowchartId,
        connectionId
      });
      expect(pointsResult.isError).toBeUndefined();
      
      const points = JSON.parse(pointsResult.content[0].text);
      expect(points.sourceNodeId).toBe(nodeId1);
      expect(points.targetNodeId).toBe(nodeId3);
      expect(points.label).toBe('path changing connection');
    });
  });

  describe('Edge cases and error handling', () => {
    test('handles concurrent connection creation', async () => {
      // Create multiple connections simultaneously
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(callTool('add_connection', {
          flowchartId,
          sourceNodeId: nodeId1,
          targetNodeId: nodeId2,
          label: `concurrent ${i}`
        }));
      }
      
      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.isError).toBeUndefined();
      });
      
      // Extract all connection IDs
      const connectionIds = results.map(result => 
        result.content[0].text.match(/with ID: (.+)$/)[1]
      );
      
      // All IDs should be unique
      const uniqueIds = new Set(connectionIds);
      expect(uniqueIds.size).toBe(connectionIds.length);
    });

    test('handles connection operations with invalid flowchart ID', async () => {
      const fakeConnectionId = 'conn_1234567890_abcdefghi';
      
      const operations = [
        { tool: 'get_connector_points', args: { flowchartId: 'invalid', connectionId: fakeConnectionId } },
        { tool: 'get_bounding_box', args: { flowchartId: 'invalid', elementId: fakeConnectionId, elementType: 'connector' } },
        { tool: 'set_connector_path', args: { flowchartId: 'invalid', connectionId: fakeConnectionId, pathPoints: [{ x: 1, y: 1 }, { x: 2, y: 2 }] } }
      ];
      
      for (const op of operations) {
        const result = await callTool(op.tool, op.args);
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toMatch(/Error:.*not found/);
      }
    });

    test('handles malformed connection ID patterns', async () => {
      const malformedIds = [
        'node_1234567890_abcdefghi', // Wrong prefix
        'conn_abc_defghi',            // Non-numeric timestamp
        'conn_1234567890_ABC',        // Uppercase in random part
        'conn_1234567890',            // Missing random part
        'conn__abcdefghi',            // Missing timestamp
        'conn_1234567890_ab',         // Short random part
      ];
      
      for (const malformedId of malformedIds) {
        const result = await callTool('get_connector_points', {
          flowchartId,
          connectionId: malformedId
        });
        
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toMatch(/Error:.*not found/);
      }
    });
  });
});