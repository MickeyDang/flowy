const { callTool } = require('../../src/tools/flowchart-tools');

describe('set_connector_path', () => {
  let flowchartId, nodeId1, nodeId2, connectionId;

  beforeEach(async () => {
    // Create flowchart
    const flowchartResult = await callTool('create_flowchart', { title: 'Test Flowchart' });
    flowchartId = flowchartResult.content[0].text.match(/ID: (.+)$/)[1];
    
    // Add nodes
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

  describe('successful path setting', () => {
    test('sets custom path with valid points', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 2.0, y: 3.0 },
          { x: 4.0, y: 2.0 },
          { x: 5.0, y: 4.0 }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Custom path set for connection .+ with 4 points/);
      expect(result.isError).toBeUndefined();
    });

    test('sets path with minimum points (2)', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 5.0, y: 4.0 }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Custom path set for connection .+ with 2 points/);
      expect(result.isError).toBeUndefined();
    });

    test('sets path with many points', async () => {
      const pathPoints = [];
      for (let i = 0; i < 10; i++) {
        pathPoints.push({ x: i * 0.5, y: i * 0.3 });
      }
      
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints
      });
      
      expect(result.content[0].text).toMatch(/Custom path set for connection .+ with 10 points/);
      expect(result.isError).toBeUndefined();
    });

    test('sets path with floating point coordinates', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.234, y: 1.567 },
          { x: 2.891, y: 3.456 },
          { x: 4.123, y: 2.789 }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Custom path set for connection .+ with 3 points/);
      expect(result.isError).toBeUndefined();
    });

    test('overwrites existing custom path', async () => {
      // Set initial path
      await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 5.0, y: 4.0 }
        ]
      });
      
      // Overwrite with new path
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 0.5, y: 0.5 },
          { x: 2.5, y: 2.5 },
          { x: 4.5, y: 4.5 }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Custom path set for connection .+ with 3 points/);
      expect(result.isError).toBeUndefined();
    });
  });

  describe('validation errors', () => {
    test('handles non-existent flowchart', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId: 'non-existent',
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 5.0, y: 4.0 }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Error: Flowchart not found: non-existent/);
      expect(result.isError).toBe(true);
    });

    test('handles non-existent connection', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId: 'non-existent',
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 5.0, y: 4.0 }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Error: Connection not found: non-existent/);
      expect(result.isError).toBe(true);
    });

    test('handles empty pathPoints array', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: []
      });
      
      expect(result.content[0].text).toMatch(/Error: pathPoints must contain at least 2 points/);
      expect(result.isError).toBe(true);
    });

    test('handles single point in pathPoints', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Error: pathPoints must contain at least 2 points/);
      expect(result.isError).toBe(true);
    });

    test('handles non-array pathPoints', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: 'not-an-array'
      });
      
      expect(result.content[0].text).toMatch(/Error: pathPoints must be an array/);
      expect(result.isError).toBe(true);
    });

    test('handles null pathPoints', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: null
      });
      
      expect(result.content[0].text).toMatch(/Error: pathPoints must be an array/);
      expect(result.isError).toBe(true);
    });
  });

  describe('point validation errors', () => {
    test('handles invalid point object', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          'invalid-point'
        ]
      });
      
      expect(result.content[0].text).toMatch(/Error: pathPoints\[1\] must be an object/);
      expect(result.isError).toBe(true);
    });

    test('handles missing x coordinate', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { y: 2.0 }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Error: pathPoints\[1\].x must be a finite number/);
      expect(result.isError).toBe(true);
    });

    test('handles missing y coordinate', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 2.0 }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Error: pathPoints\[1\].y must be a finite number/);
      expect(result.isError).toBe(true);
    });

    test('handles invalid x coordinate type', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 'invalid', y: 2.0 }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Error: pathPoints\[1\].x must be a finite number/);
      expect(result.isError).toBe(true);
    });

    test('handles invalid y coordinate type', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 2.0, y: 'invalid' }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Error: pathPoints\[1\].y must be a finite number/);
      expect(result.isError).toBe(true);
    });

    test('handles infinite coordinates', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: Infinity, y: 2.0 }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Error: pathPoints\[1\].x must be a finite number/);
      expect(result.isError).toBe(true);
    });

    test('handles NaN coordinates', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 2.0, y: NaN }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Error: pathPoints\[1\].y must be a finite number/);
      expect(result.isError).toBe(true);
    });
  });

  describe('bounds validation', () => {
    test('handles out-of-bounds x coordinate', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 15.0, y: 2.0 } // Beyond slide width (10 inches)
        ]
      });
      
      expect(result.content[0].text).toMatch(/Error: pathPoints\[1\]: x must be between 0 and 10 inches/);
      expect(result.isError).toBe(true);
    });

    test('handles negative x coordinate', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: -1.0, y: 2.0 }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Error: pathPoints\[1\]: x must be between 0 and 10 inches/);
      expect(result.isError).toBe(true);
    });

    test('handles out-of-bounds y coordinate', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 2.0, y: 10.0 } // Beyond slide height (7.5 inches)
        ]
      });
      
      expect(result.content[0].text).toMatch(/Error: pathPoints\[1\]: y must be between 0 and 7.5 inches/);
      expect(result.isError).toBe(true);
    });

    test('handles negative y coordinate', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 2.0, y: -1.0 }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Error: pathPoints\[1\]: y must be between 0 and 7.5 inches/);
      expect(result.isError).toBe(true);
    });

    test('allows coordinates at slide boundaries', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 0, y: 0 },        // Bottom-left corner
          { x: 10, y: 7.5 }      // Top-right corner
        ]
      });
      
      expect(result.content[0].text).toMatch(/Custom path set for connection .+ with 2 points/);
      expect(result.isError).toBeUndefined();
    });
  });

  describe('missing parameters', () => {
    test('handles missing pathPoints', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId
        // Missing pathPoints
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles missing connectionId', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 5.0, y: 4.0 }
        ]
        // Missing connectionId
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles missing flowchartId', async () => {
      const result = await callTool('set_connector_path', {
        connectionId,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 5.0, y: 4.0 }
        ]
        // Missing flowchartId
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('handles path with zero-length segments', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 2.0, y: 2.0 },
          { x: 2.0, y: 2.0 }, // Same point
          { x: 3.0, y: 3.0 }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Custom path set for connection .+ with 3 points/);
      expect(result.isError).toBeUndefined();
    });

    test('handles very long path', async () => {
      const pathPoints = [];
      for (let i = 0; i <= 100; i++) {
        pathPoints.push({ 
          x: (i / 100) * 10,  // Spread across slide width
          y: Math.sin(i / 10) * 3 + 3.75 // Sine wave across slide height
        });
      }
      
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints
      });
      
      expect(result.content[0].text).toMatch(/Custom path set for connection .+ with 101 points/);
      expect(result.isError).toBeUndefined();
    });

    test('handles path with very precise coordinates', async () => {
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId,
        pathPoints: [
          { x: 1.123456789, y: 1.987654321 },
          { x: 2.111111111, y: 2.222222222 },
          { x: 3.333333333, y: 3.444444444 }
        ]
      });
      
      expect(result.content[0].text).toMatch(/Custom path set for connection .+ with 3 points/);
      expect(result.isError).toBeUndefined();
    });
  });
});