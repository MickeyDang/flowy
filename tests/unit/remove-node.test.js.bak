const { callTool } = require('../../src/tools/flowchart-tools');

describe('remove_node', () => {
  let flowchartId, nodeId1, nodeId2, nodeId3;

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
  });

  test('removes node successfully with no connections', async () => {
    const result = await callTool('remove_node', {
      flowchartId,
      nodeId: nodeId1,
    });
    
    expect(result.content[0].text).toMatch(/Node .+ removed successfully\. Cleaned up 0 connection\(s\)\./);
    expect(result.isError).toBeUndefined();
  });

  test('removes node and cleans up connections', async () => {
    // Add connections involving nodeId1
    await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId1,
      targetNodeId: nodeId2,
      label: 'connection 1',
    });
    
    await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId3,
      targetNodeId: nodeId1,
      label: 'connection 2',
    });
    
    // Remove node1, should clean up 2 connections
    const result = await callTool('remove_node', {
      flowchartId,
      nodeId: nodeId1,
    });
    
    expect(result.content[0].text).toMatch(/Node .+ removed successfully\. Cleaned up 2 connection\(s\)\./);
    expect(result.isError).toBeUndefined();
  });

  test('removes node with only outgoing connections', async () => {
    // Add connection from nodeId1 to nodeId2
    await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId1,
      targetNodeId: nodeId2,
    });
    
    // Remove node1, should clean up 1 connection
    const result = await callTool('remove_node', {
      flowchartId,
      nodeId: nodeId1,
    });
    
    expect(result.content[0].text).toMatch(/Node .+ removed successfully\. Cleaned up 1 connection\(s\)\./);
    expect(result.isError).toBeUndefined();
  });

  test('removes node with only incoming connections', async () => {
    // Add connection from nodeId2 to nodeId1
    await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId2,
      targetNodeId: nodeId1,
    });
    
    // Remove node1, should clean up 1 connection
    const result = await callTool('remove_node', {
      flowchartId,
      nodeId: nodeId1,
    });
    
    expect(result.content[0].text).toMatch(/Node .+ removed successfully\. Cleaned up 1 connection\(s\)\./);
    expect(result.isError).toBeUndefined();
  });

  test('removes node with multiple connections', async () => {
    // Add multiple connections involving nodeId1
    await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId1,
      targetNodeId: nodeId2,
    });
    
    await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId1,
      targetNodeId: nodeId3,
    });
    
    await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId2,
      targetNodeId: nodeId1,
    });
    
    // Remove node1, should clean up 3 connections
    const result = await callTool('remove_node', {
      flowchartId,
      nodeId: nodeId1,
    });
    
    expect(result.content[0].text).toMatch(/Node .+ removed successfully\. Cleaned up 3 connection\(s\)\./);
    expect(result.isError).toBeUndefined();
  });

  test('handles non-existent flowchart', async () => {
    const result = await callTool('remove_node', {
      flowchartId: 'non-existent',
      nodeId: nodeId1,
    });
    
    expect(result.content[0].text).toMatch(/Error: Flowchart with ID "non-existent" not found/);
    expect(result.isError).toBe(true);
  });

  test('handles non-existent node', async () => {
    const result = await callTool('remove_node', {
      flowchartId,
      nodeId: 'non-existent',
    });
    
    expect(result.content[0].text).toMatch(/Error: Node with ID "non-existent" not found/);
    expect(result.isError).toBe(true);
  });

  test('handles invalid flowchart ID', async () => {
    const result = await callTool('remove_node', {
      flowchartId: '',
      nodeId: nodeId1,
    });
    
    expect(result.content[0].text).toMatch(/Error:/);
    expect(result.isError).toBe(true);
  });

  test('handles invalid node ID', async () => {
    const result = await callTool('remove_node', {
      flowchartId,
      nodeId: '',
    });
    
    expect(result.content[0].text).toMatch(/Error:/);
    expect(result.isError).toBe(true);
  });

  test('handles null/undefined node ID', async () => {
    const result = await callTool('remove_node', {
      flowchartId,
      nodeId: null,
    });
    
    expect(result.content[0].text).toMatch(/Error:/);
    expect(result.isError).toBe(true);
  });

  test('handles removing last node in flowchart', async () => {
    // Create a flowchart with only one node
    const singleNodeFlowchartResult = await callTool('create_flowchart', { title: 'Single Node Flowchart' });
    const singleNodeFlowchartId = singleNodeFlowchartResult.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];
    
    const singleNodeResult = await callTool('add_node', { flowchartId: singleNodeFlowchartId, text: 'Only Node' });
    const singleNodeId = singleNodeResult.content[0].text.match(/ID: ([a-zA-Z0-9_]+)/)[1];
    
    // Remove the only node
    const result = await callTool('remove_node', {
      flowchartId: singleNodeFlowchartId,
      nodeId: singleNodeId,
    });
    
    expect(result.content[0].text).toMatch(/Node .+ removed successfully\. Cleaned up 0 connection\(s\)\./);
    expect(result.isError).toBeUndefined();
  });

  test('preserves connections not involving the removed node', async () => {
    // Add connection between nodeId2 and nodeId3 (not involving nodeId1)
    await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId2,
      targetNodeId: nodeId3,
    });
    
    // Add connection involving nodeId1
    await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId1,
      targetNodeId: nodeId2,
    });
    
    // Remove node1, should only clean up 1 connection
    const result = await callTool('remove_node', {
      flowchartId,
      nodeId: nodeId1,
    });
    
    expect(result.content[0].text).toMatch(/Node .+ removed successfully\. Cleaned up 1 connection\(s\)\./);
    expect(result.isError).toBeUndefined();
    
    // The connection between nodeId2 and nodeId3 should still exist
    // We can't directly test this without a get_connections tool, but the count confirms it
  });

  test('handles missing required parameters', async () => {
    // Test missing flowchartId
    const result1 = await callTool('remove_node', {
      nodeId: nodeId1,
    });
    
    expect(result1.content[0].text).toMatch(/Error:/);
    expect(result1.isError).toBe(true);
    
    // Test missing nodeId
    const result2 = await callTool('remove_node', {
      flowchartId,
    });
    
    expect(result2.content[0].text).toMatch(/Error:/);
    expect(result2.isError).toBe(true);
  });
});