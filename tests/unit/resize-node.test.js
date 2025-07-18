const { callTool } = require('../../src/tools/flowchart-tools');

describe('resize_node', () => {
  let flowchartId, nodeId1, nodeId2;

  beforeEach(async () => {
    // Create flowchart
    const flowchartResult = await callTool('create_flowchart', { title: 'Test Flowchart' });
    flowchartId = flowchartResult.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];
    
    // Add nodes
    const node1Result = await callTool('add_node', { flowchartId, text: 'Node 1' });
    nodeId1 = node1Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    
    const node2Result = await callTool('add_node', { flowchartId, text: 'Node 2' });
    nodeId2 = node2Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
  });

  describe('successful resizing', () => {
    test('resizes node with valid dimensions', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 2.5,
        height: 1.5
      });
      
      expect(result.content[0].text).toMatch(/Node .+ resized to 2.5 × 1.5 inches/);
      expect(result.isError).toBeUndefined();
    });

    test('resizes node with minimum dimensions', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 0.1,
        height: 0.1
      });
      
      expect(result.content[0].text).toMatch(/Node .+ resized to 0.1 × 0.1 inches/);
      expect(result.isError).toBeUndefined();
    });

    test('resizes node with large dimensions', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 8.0,
        height: 5.0
      });
      
      expect(result.content[0].text).toMatch(/Node .+ resized to 8 × 5 inches/);
      expect(result.isError).toBeUndefined();
    });

    test('resizes node with floating point dimensions', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 1.25,
        height: 0.75
      });
      
      expect(result.content[0].text).toMatch(/Node .+ resized to 1.25 × 0.75 inches/);
      expect(result.isError).toBeUndefined();
    });
  });

  describe('validation errors', () => {
    test('handles non-existent flowchart', async () => {
      const result = await callTool('resize_node', {
        flowchartId: 'non-existent',
        nodeId: nodeId1,
        width: 2.0,
        height: 1.0
      });
      
      expect(result.content[0].text).toMatch(/Error:.*not found/);
      expect(result.isError).toBe(true);
    });

    test('handles non-existent node', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: 'non-existent',
        width: 2.0,
        height: 1.0
      });
      
      expect(result.content[0].text).toMatch(/Error:.*not found/);
      expect(result.isError).toBe(true);
    });

    test('handles invalid width type', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 'invalid',
        height: 1.0
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles invalid height type', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 2.0,
        height: 'invalid'
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles zero width', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 0,
        height: 1.0
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles negative width', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: -1.0,
        height: 1.0
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles zero height', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 2.0,
        height: 0
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles negative height', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 2.0,
        height: -1.0
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles infinite dimensions', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: Infinity,
        height: 1.0
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles NaN dimensions', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: NaN,
        height: 1.0
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });
  });

  describe('missing parameters', () => {
    test('handles missing width', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        height: 1.0
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles missing height', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 2.0
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles missing nodeId', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        width: 2.0,
        height: 1.0
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('handles very small dimensions', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 0.01,
        height: 0.01
      });
      
      expect(result.content[0].text).toMatch(/Validation error for width: must be between 0.1 and 20 inches/);
      expect(result.isError).toBe(true);
    });

    test('handles identical width and height', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 2.0,
        height: 2.0
      });
      
      expect(result.content[0].text).toMatch(/Node .+ resized to 2 × 2 inches/);
      expect(result.isError).toBeUndefined();
    });

    test('handles very precise floating point dimensions', async () => {
      const result = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 1.234567,
        height: 0.987654
      });
      
      expect(result.content[0].text).toMatch(/Node .+ resized to 1.234567 × 0.987654 inches/);
      expect(result.isError).toBeUndefined();
    });

    test('handles multiple resize operations on same node', async () => {
      // First resize
      const result1 = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 2.0,
        height: 1.0
      });
      expect(result1.isError).toBeUndefined();
      
      // Second resize
      const result2 = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 3.0,
        height: 2.0
      });
      expect(result2.content[0].text).toMatch(/Node .+ resized to 3 × 2 inches/);
      expect(result2.isError).toBeUndefined();
    });
  });
});