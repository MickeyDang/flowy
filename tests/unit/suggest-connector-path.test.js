const { callTool } = require('../../src/tools/flowchart-tools');

describe('suggest_connector_path', () => {
  let flowchartId, nodeId1, nodeId2, nodeId3, obstacleNodeId;

  beforeEach(async () => {
    // Create a flowchart
    const flowchartResult = await callTool('create_flowchart', { title: 'Path Test Flowchart' });
    flowchartId = flowchartResult.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];
    
    // Add nodes in specific positions for testing
    const node1Result = await callTool('add_node', { flowchartId, text: 'Source Node' });
    nodeId1 = node1Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    await callTool('set_position', { flowchartId, nodeId: nodeId1, x: 1, y: 1 });
    
    const node2Result = await callTool('add_node', { flowchartId, text: 'Target Node' });
    nodeId2 = node2Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    await callTool('set_position', { flowchartId, nodeId: nodeId2, x: 5, y: 4 });
    
    const node3Result = await callTool('add_node', { flowchartId, text: 'Another Node' });
    nodeId3 = node3Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    await callTool('set_position', { flowchartId, nodeId: nodeId3, x: 7, y: 1 });
    
    // Add obstacle node between source and target
    const obstacleResult = await callTool('add_node', { flowchartId, text: 'Obstacle' });
    obstacleNodeId = obstacleResult.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    await callTool('set_position', { flowchartId, nodeId: obstacleNodeId, x: 3, y: 2.5 });
  });

  describe('basic functionality', () => {
    test('generates straight path successfully', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        routingStyle: 'straight'
      });
      
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Generated straight path');
      expect(result.content[0].text).toContain('pathPoints');
      
      // Parse the JSON result
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      expect(jsonMatch).toBeTruthy();
      const pathData = JSON.parse(jsonMatch[0]);
      
      expect(pathData).toHaveProperty('pathPoints');
      expect(pathData).toHaveProperty('routingInfo');
      expect(pathData.pathPoints).toBeInstanceOf(Array);
      expect(pathData.pathPoints.length).toBeGreaterThanOrEqual(2);
      expect(pathData.routingInfo.style).toBe('straight');
    });

    test('generates orthogonal path successfully', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        routingStyle: 'orthogonal'
      });
      
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Generated orthogonal path');
      
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      expect(pathData.routingInfo.style).toBe('orthogonal');
      expect(pathData.pathPoints.length).toBeGreaterThanOrEqual(3);
    });

    test('generates curved path successfully', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        routingStyle: 'curved'
      });
      
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Generated curved path');
      
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      expect(pathData.routingInfo.style).toBe('curved');
      expect(pathData.pathPoints.length).toBeGreaterThan(3);
    });

    test('defaults to orthogonal when no routing style specified', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2
      });
      
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Generated orthogonal path');
      
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      expect(pathData.routingInfo.style).toBe('orthogonal');
    });
  });

  describe('routing options', () => {
    test('applies custom curve radius for curved paths', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        routingStyle: 'curved',
        options: {
          curveRadius: 0.5
        }
      });
      
      expect(result.isError).toBeUndefined();
      
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      expect(pathData.routingInfo.optionsUsed.curveRadius).toBe(0.5);
    });

    test('applies custom padding for obstacle avoidance', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        routingStyle: 'straight',
        options: {
          padding: 0.3,
          avoidObstacles: true
        }
      });
      
      expect(result.isError).toBeUndefined();
      
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      expect(pathData.routingInfo.optionsUsed.padding).toBe(0.3);
      expect(pathData.routingInfo.optionsUsed.avoidObstacles).toBe(true);
    });

    test('disables obstacle avoidance when requested', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        routingStyle: 'straight',
        options: {
          avoidObstacles: false
        }
      });
      
      expect(result.isError).toBeUndefined();
      
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      expect(pathData.routingInfo.optionsUsed.avoidObstacles).toBe(false);
    });

    test('clamps option values to valid ranges', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        routingStyle: 'curved',
        options: {
          curveRadius: 5.0, // Should be clamped to 1.0
          padding: -0.1,   // Should be clamped to 0.05
          minSegmentLength: 0.01 // Should be clamped to 0.1
        }
      });
      
      expect(result.isError).toBeUndefined();
      
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      expect(pathData.routingInfo.optionsUsed.curveRadius).toBe(1.0);
      expect(pathData.routingInfo.optionsUsed.padding).toBe(0.05);
      expect(pathData.routingInfo.optionsUsed.minSegmentLength).toBe(0.1);
    });
  });

  describe('path information', () => {
    test('includes comprehensive routing information', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        routingStyle: 'orthogonal'
      });
      
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      expect(pathData).toHaveProperty('pathPoints');
      expect(pathData).toHaveProperty('routingInfo');
      expect(pathData).toHaveProperty('usage');
      
      expect(pathData.routingInfo).toHaveProperty('style');
      expect(pathData.routingInfo).toHaveProperty('reasoning');
      expect(pathData.routingInfo).toHaveProperty('startPoint');
      expect(pathData.routingInfo).toHaveProperty('endPoint');
      expect(pathData.routingInfo).toHaveProperty('obstaclesConsidered');
      expect(pathData.routingInfo).toHaveProperty('optionsUsed');
      
      expect(pathData.usage).toHaveProperty('description');
      expect(pathData.usage).toHaveProperty('example');
    });

    test('counts obstacles correctly', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        routingStyle: 'straight'
      });
      
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      // Should count all nodes except source and target (nodeId3 and obstacleNodeId)
      expect(pathData.routingInfo.obstaclesConsidered).toBe(2);
    });

    test('provides usage instructions', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2
      });
      
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      expect(pathData.usage.description).toContain('set_connector_path');
      expect(pathData.usage.example).toContain('set_connector_path');
      expect(pathData.usage.example).toContain(flowchartId);
    });

    test('rounds coordinates to reasonable precision', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        routingStyle: 'straight'
      });
      
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      // Check that coordinates are rounded to 3 decimal places
      pathData.pathPoints.forEach(point => {
        expect(point.x).toBe(Math.round(point.x * 1000) / 1000);
        expect(point.y).toBe(Math.round(point.y * 1000) / 1000);
      });
    });
  });

  describe('error handling', () => {
    test('handles non-existent flowchart', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId: 'non-existent',
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        routingStyle: 'straight'
      });
      
      expect(result.content[0].text).toMatch(/Error: Flowchart with ID "non-existent" not found/);
      expect(result.isError).toBe(true);
    });

    test('handles non-existent source node', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: 'non-existent',
        targetNodeId: nodeId2,
        routingStyle: 'straight'
      });
      
      expect(result.content[0].text).toMatch(/Error: Node with ID "non-existent" not found/);
      expect(result.isError).toBe(true);
    });

    test('handles non-existent target node', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: 'non-existent',
        routingStyle: 'straight'
      });
      
      expect(result.content[0].text).toMatch(/Error: Node with ID "non-existent" not found/);
      expect(result.isError).toBe(true);
    });

    test('handles invalid routing style gracefully', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        routingStyle: 'invalid-style'
      });
      
      // Should default to orthogonal and not error
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Generated orthogonal path');
    });

    test('handles missing required parameters', async () => {
      // Test missing flowchartId
      const result1 = await callTool('suggest_connector_path', {
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2
      });
      
      expect(result1.content[0].text).toMatch(/Error:/);
      expect(result1.isError).toBe(true);
      
      // Test missing sourceNodeId
      const result2 = await callTool('suggest_connector_path', {
        flowchartId,
        targetNodeId: nodeId2
      });
      
      expect(result2.content[0].text).toMatch(/Error:/);
      expect(result2.isError).toBe(true);
      
      // Test missing targetNodeId
      const result3 = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1
      });
      
      expect(result3.content[0].text).toMatch(/Error:/);
      expect(result3.isError).toBe(true);
    });

    test('handles invalid node IDs', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: '',
        targetNodeId: nodeId2,
        routingStyle: 'straight'
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles same source and target node', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId1,
        routingStyle: 'straight'
      });
      
      // Should still generate a path (even if trivial)
      expect(result.isError).toBeUndefined();
      
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      expect(pathData.pathPoints).toHaveLength(2);
    });
  });

  describe('integration with existing tools', () => {
    test('generated path can be used with set_connector_path', async () => {
      // First create a connection
      const connectionResult = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        label: 'Test Connection'
      });
      const connectionId = connectionResult.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
      
      // Generate path
      const pathResult = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        routingStyle: 'orthogonal'
      });
      
      const jsonMatch = pathResult.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      // Use generated path with set_connector_path
      const setPathResult = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: pathData.pathPoints
      });
      
      expect(setPathResult.isError).toBeUndefined();
      expect(setPathResult.content[0].text).toContain('Custom path set');
    });

    test('works with nodes at various positions', async () => {
      // Test with nodes positioned at different quadrants
      const closeNode1Result = await callTool('add_node', { flowchartId, text: 'Close1' });
      const closeNode1Id = closeNode1Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
      await callTool('set_position', { flowchartId, nodeId: closeNode1Id, x: 0.5, y: 0.5 });
      
      const closeNode2Result = await callTool('add_node', { flowchartId, text: 'Close2' });
      const closeNode2Id = closeNode2Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
      await callTool('set_position', { flowchartId, nodeId: closeNode2Id, x: 0.8, y: 0.8 });
      
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: closeNode1Id,
        targetNodeId: closeNode2Id,
        routingStyle: 'straight'
      });
      
      expect(result.isError).toBeUndefined();
      
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      expect(pathData.pathPoints.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('obstacle avoidance behavior', () => {
    test('considers obstacle nodes in path planning', async () => {
      // Create path between nodes that would naturally pass through obstacle
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        routingStyle: 'straight',
        options: {
          avoidObstacles: true
        }
      });
      
      expect(result.isError).toBeUndefined();
      
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      // Should have considered the obstacle node
      expect(pathData.routingInfo.obstaclesConsidered).toBeGreaterThan(0);
    });

    test('reasoning explains obstacle avoidance decisions', async () => {
      const result = await callTool('suggest_connector_path', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        routingStyle: 'orthogonal',
        options: {
          avoidObstacles: true
        }
      });
      
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      const pathData = JSON.parse(jsonMatch[0]);
      
      expect(pathData.routingInfo.reasoning).toBeDefined();
      expect(typeof pathData.routingInfo.reasoning).toBe('string');
      expect(pathData.routingInfo.reasoning.length).toBeGreaterThan(0);
    });
  });
});