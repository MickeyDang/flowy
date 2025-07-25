const { callTool } = require('../../src/tools/flowchart-tools');

describe('set_position', () => {
  let flowchartId, nodeId1, nodeId2, connectionId;

  beforeEach(async () => {
    // Create flowchart
    const flowchartResult = await callTool('create_flowchart', { title: 'Test Flowchart' });
    flowchartId = flowchartResult.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];
    
    // Add nodes
    const node1Result = await callTool('add_node', { flowchartId, text: 'Node 1' });
    nodeId1 = node1Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    
    const node2Result = await callTool('add_node', { flowchartId, text: 'Node 2' });
    nodeId2 = node2Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    
    // Add connection
    const connectionResult = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId1,
      targetNodeId: nodeId2,
      label: 'test connection'
    });
    connectionId = connectionResult.content[0].text.match(/with ID: (.+)$/)[1];
  });

  describe('node positioning', () => {
    test('sets position of existing node', async () => {
      const result = await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 2.5,
        y: 3.0
      });
      
      expect(result.content[0].text).toMatch(/Position set for node .+ to \(2.5, 3\)/);
      expect(result.isError).toBeUndefined();
    });

    test('handles non-existent node', async () => {
      const result = await callTool('set_position', {
        flowchartId,
        elementId: 'non-existent',
        elementType: 'node',
        x: 2.5,
        y: 3.0
      });
      
      expect(result.content[0].text).toMatch(/Error:.*not found/);
      expect(result.isError).toBe(true);
    });

    test('handles invalid coordinates', async () => {
      const result = await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 'invalid',
        y: 3.0
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles out-of-bounds coordinates', async () => {
      const result = await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 15.0, // Beyond slide width
        y: 3.0
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles negative coordinates', async () => {
      const result = await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: -1.0,
        y: 3.0
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });
  });

  describe('connection positioning', () => {
    test('sets position of existing connection', async () => {
      const result = await callTool('set_position', {
        flowchartId,
        elementId: connectionId,
        elementType: 'connection',
        x: 2.5,
        y: 3.0
      });
      
      expect(result.content[0].text).toMatch(/Position set for connection .+ to \(2.5, 3\)/);
      expect(result.isError).toBeUndefined();
    });

    test('handles non-existent connection', async () => {
      const result = await callTool('set_position', {
        flowchartId,
        elementId: 'non-existent',
        elementType: 'connection',
        x: 2.5,
        y: 3.0
      });
      
      expect(result.content[0].text).toMatch(/Error:.*not found/);
      expect(result.isError).toBe(true);
    });
  });

  describe('validation', () => {
    test('handles non-existent flowchart', async () => {
      const result = await callTool('set_position', {
        flowchartId: 'non-existent',
        elementId: nodeId1,
        elementType: 'node',
        x: 2.5,
        y: 3.0
      });
      
      expect(result.content[0].text).toMatch(/Error:.*not found/);
      expect(result.isError).toBe(true);
    });

    test('handles invalid element type', async () => {
      const result = await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'invalid',
        x: 2.5,
        y: 3.0
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });

    test('handles missing required parameters', async () => {
      const result = await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        // Missing elementType
        x: 2.5,
        y: 3.0
      });
      
      expect(result.content[0].text).toMatch(/Error:/);
      expect(result.isError).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('handles zero coordinates', async () => {
      const result = await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 0,
        y: 0
      });
      
      expect(result.content[0].text).toMatch(/Position set for node .+ to \(0, 0\)/);
      expect(result.isError).toBeUndefined();
    });

    test('handles floating point coordinates', async () => {
      const result = await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 1.5555,
        y: 2.3333
      });
      
      expect(result.content[0].text).toMatch(/Position set for node .+ to \(1.5555, 2.3333\)/);
      expect(result.isError).toBeUndefined();
    });

    test('handles maximum slide coordinates', async () => {
      const result = await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 10, // slide width
        y: 7.5 // slide height
      });
      
      expect(result.content[0].text).toMatch(/Position set for node .+ to \(10, 7.5\)/);
      expect(result.isError).toBeUndefined();
    });
  });
});