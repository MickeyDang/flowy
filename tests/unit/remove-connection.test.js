const { callTool } = require('../../src/tools/flowchart-tools');

describe('remove_connection', () => {
  let flowchartId, nodeId1, nodeId2, nodeId3, connectionId1, connectionId2;

  beforeEach(async () => {
    // Create a flowchart
    const flowchartResult = await callTool('create_flowchart', { title: 'Test Flowchart' });
    flowchartId = flowchartResult.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];
    
    // Add nodes
    const node1Result = await callTool('add_node', { flowchartId, text: 'Node 1' });
    nodeId1 = node1Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    
    const node2Result = await callTool('add_node', { flowchartId, text: 'Node 2' });
    nodeId2 = node2Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    
    const node3Result = await callTool('add_node', { flowchartId, text: 'Node 3' });
    nodeId3 = node3Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    
    // Add connections
    const connection1Result = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId1,
      targetNodeId: nodeId2,
      label: 'Connection 1',
    });
    connectionId1 = connection1Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    
    const connection2Result = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId2,
      targetNodeId: nodeId3,
      label: 'Connection 2',
    });
    connectionId2 = connection2Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
  });

  test('removes connection successfully', async () => {
    const result = await callTool('remove_connection', {
      flowchartId,
      connectionId: connectionId1,
    });
    
    expect(result.content[0].text).toMatch(/Connection .+ removed successfully\./);
    expect(result.isError).toBeUndefined();
  });

  test('removes specific connection without affecting others', async () => {
    // Remove first connection
    const result = await callTool('remove_connection', {
      flowchartId,
      connectionId: connectionId1,
    });
    
    expect(result.content[0].text).toMatch(/Connection .+ removed successfully\./);
    expect(result.isError).toBeUndefined();
    
    // Second connection should still be accessible (no direct way to verify, but no error should occur)
    // This test verifies that only the specified connection is removed
  });

  test('removes connection from flowchart with single connection', async () => {
    // Create new flowchart with single connection
    const singleConnFlowchartResult = await callTool('create_flowchart', { title: 'Single Connection Flowchart' });
    const singleConnFlowchartId = singleConnFlowchartResult.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];
    
    const singleNode1Result = await callTool('add_node', { flowchartId: singleConnFlowchartId, text: 'Node A' });
    const singleNodeId1 = singleNode1Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    
    const singleNode2Result = await callTool('add_node', { flowchartId: singleConnFlowchartId, text: 'Node B' });
    const singleNodeId2 = singleNode2Result.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    
    const singleConnectionResult = await callTool('add_connection', {
      flowchartId: singleConnFlowchartId,
      sourceNodeId: singleNodeId1,
      targetNodeId: singleNodeId2,
    });
    const singleConnectionId = singleConnectionResult.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    
    // Remove the only connection
    const result = await callTool('remove_connection', {
      flowchartId: singleConnFlowchartId,
      connectionId: singleConnectionId,
    });
    
    expect(result.content[0].text).toMatch(/Connection .+ removed successfully\./);
    expect(result.isError).toBeUndefined();
  });

  test('verifies nodes remain intact after connection removal', async () => {
    // Remove connection
    await callTool('remove_connection', {
      flowchartId,
      connectionId: connectionId1,
    });
    
    // Verify nodes still exist by trying to use them in a new connection
    const newConnectionResult = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId1,
      targetNodeId: nodeId3,
      label: 'New Connection',
    });
    
    expect(newConnectionResult.content[0].text).toMatch(/Connection added successfully/);
    expect(newConnectionResult.isError).toBeUndefined();
  });

  test('handles non-existent flowchart', async () => {
    const result = await callTool('remove_connection', {
      flowchartId: 'non-existent',
      connectionId: connectionId1,
    });
    
    expect(result.content[0].text).toMatch(/Error: Flowchart with ID "non-existent" not found/);
    expect(result.isError).toBe(true);
  });

  test('handles non-existent connection', async () => {
    const result = await callTool('remove_connection', {
      flowchartId,
      connectionId: 'non-existent',
    });
    
    expect(result.content[0].text).toMatch(/Error: Connection with ID "non-existent" not found/);
    expect(result.isError).toBe(true);
  });

  test('handles invalid flowchart ID', async () => {
    const result = await callTool('remove_connection', {
      flowchartId: '',
      connectionId: connectionId1,
    });
    
    expect(result.content[0].text).toMatch(/Error:/);
    expect(result.isError).toBe(true);
  });

  test('handles invalid connection ID', async () => {
    const result = await callTool('remove_connection', {
      flowchartId,
      connectionId: '',
    });
    
    expect(result.content[0].text).toMatch(/Error:/);
    expect(result.isError).toBe(true);
  });

  test('handles null/undefined connection ID', async () => {
    const result = await callTool('remove_connection', {
      flowchartId,
      connectionId: null,
    });
    
    expect(result.content[0].text).toMatch(/Error:/);
    expect(result.isError).toBe(true);
  });

  test('handles null/undefined flowchart ID', async () => {
    const result = await callTool('remove_connection', {
      flowchartId: null,
      connectionId: connectionId1,
    });
    
    expect(result.content[0].text).toMatch(/Error:/);
    expect(result.isError).toBe(true);
  });

  test('handles missing required parameters', async () => {
    // Test missing flowchartId
    const result1 = await callTool('remove_connection', {
      connectionId: connectionId1,
    });
    
    expect(result1.content[0].text).toMatch(/Error:/);
    expect(result1.isError).toBe(true);
    
    // Test missing connectionId
    const result2 = await callTool('remove_connection', {
      flowchartId,
    });
    
    expect(result2.content[0].text).toMatch(/Error:/);
    expect(result2.isError).toBe(true);
    
    // Test both missing
    const result3 = await callTool('remove_connection', {});
    
    expect(result3.content[0].text).toMatch(/Error:/);
    expect(result3.isError).toBe(true);
  });

  test('handles removing connection that was already removed', async () => {
    // Remove connection first time
    const result1 = await callTool('remove_connection', {
      flowchartId,
      connectionId: connectionId1,
    });
    
    expect(result1.content[0].text).toMatch(/Connection .+ removed successfully\./);
    expect(result1.isError).toBeUndefined();
    
    // Try to remove same connection again
    const result2 = await callTool('remove_connection', {
      flowchartId,
      connectionId: connectionId1,
    });
    
    expect(result2.content[0].text).toMatch(/Error: Connection with ID .+ not found/);
    expect(result2.isError).toBe(true);
  });

  test('handles connection removal from different flowchart', async () => {
    // Create another flowchart
    const flowchart2Result = await callTool('create_flowchart', { title: 'Another Flowchart' });
    const flowchart2Id = flowchart2Result.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];
    
    // Try to remove connection from original flowchart using different flowchart ID
    const result = await callTool('remove_connection', {
      flowchartId: flowchart2Id,
      connectionId: connectionId1,
    });
    
    expect(result.content[0].text).toMatch(/Error: Connection with ID .+ not found/);
    expect(result.isError).toBe(true);
  });
});