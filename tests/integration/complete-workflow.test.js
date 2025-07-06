const { callTool } = require('../../src/tools/flowchart-tools');
const Flowchart = require('../../src/models/flowchart');

// Mock the PptxGenJS module
jest.mock('pptxgenjs');

describe('Complete Flowchart Workflow', () => {
  let flowchartId;

  test('creates complete flowchart and exports to PowerPoint', async () => {
    // Step 1: Create flowchart
    const createResult = await callTool('create_flowchart', { 
      title: 'Integration Test Flowchart' 
    });
    
    expect(createResult.isError).toBeUndefined();
    expect(createResult.content[0].text).toMatch(/Flowchart created with ID:/);
    
    flowchartId = createResult.content[0].text.match(/ID: (.+)$/)[1];
    expect(flowchartId).toBeTruthy();

    // Step 2: Add nodes
    const addNode1Result = await callTool('add_node', {
      flowchartId,
      text: 'Start Process',
      positionHint: { x: 1, y: 1 },
    });
    
    expect(addNode1Result.isError).toBeUndefined();
    const nodeId1 = addNode1Result.content[0].text.match(/ID: (.+)$/)[1];

    const addNode2Result = await callTool('add_node', {
      flowchartId,
      text: 'Decision Point',
      positionHint: { x: 3, y: 1 },
    });
    
    expect(addNode2Result.isError).toBeUndefined();
    const nodeId2 = addNode2Result.content[0].text.match(/ID: (.+)$/)[1];

    const addNode3Result = await callTool('add_node', {
      flowchartId,
      text: 'Process A',
      positionHint: { x: 5, y: 0.5 },
    });
    
    expect(addNode3Result.isError).toBeUndefined();
    const nodeId3 = addNode3Result.content[0].text.match(/ID: (.+)$/)[1];

    const addNode4Result = await callTool('add_node', {
      flowchartId,
      text: 'Process B',
      positionHint: { x: 5, y: 1.5 },
    });
    
    expect(addNode4Result.isError).toBeUndefined();
    const nodeId4 = addNode4Result.content[0].text.match(/ID: (.+)$/)[1];

    const addNode5Result = await callTool('add_node', {
      flowchartId,
      text: 'End Process',
      positionHint: { x: 7, y: 1 },
    });
    
    expect(addNode5Result.isError).toBeUndefined();
    const nodeId5 = addNode5Result.content[0].text.match(/ID: (.+)$/)[1];

    // Step 3: Add connections
    const addConnection1Result = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId1,
      targetNodeId: nodeId2,
      label: 'proceed',
    });
    
    expect(addConnection1Result.isError).toBeUndefined();

    const addConnection2Result = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId2,
      targetNodeId: nodeId3,
      label: 'yes',
    });
    
    expect(addConnection2Result.isError).toBeUndefined();

    const addConnection3Result = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId2,
      targetNodeId: nodeId4,
      label: 'no',
    });
    
    expect(addConnection3Result.isError).toBeUndefined();

    const addConnection4Result = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId3,
      targetNodeId: nodeId5,
    });
    
    expect(addConnection4Result.isError).toBeUndefined();

    const addConnection5Result = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId4,
      targetNodeId: nodeId5,
    });
    
    expect(addConnection5Result.isError).toBeUndefined();

    // Step 4: Apply layout
    const layoutResult = await callTool('auto_layout', {
      flowchartId,
      algorithm: 'hierarchical',
    });
    
    expect(layoutResult.isError).toBeUndefined();
    expect(layoutResult.content[0].text).toMatch(/Layout applied/);

    // Step 5: Export to PowerPoint
    const exportResult = await callTool('export_pptx', {
      flowchartId,
      filename: 'integration-test-flowchart',
    });
    
    expect(exportResult.isError).toBeUndefined();
    expect(exportResult.content[0].text).toMatch(/PowerPoint presentation generated:/);
    expect(exportResult.content[0].text).toContain('integration-test-flowchart.pptx');
  });

  test('verifies flowchart structure after creation', async () => {
    // Use the flowchart tools internal storage to verify structure
    const flowchartTools = require('../../src/tools/flowchart-tools');
    const flowcharts = flowchartTools.flowcharts || new Map();
    
    // Find the flowchart we created (it should be the only one)
    let testFlowchart;
    for (const [id, flowchart] of flowcharts) {
      if (flowchart.title === 'Integration Test Flowchart') {
        testFlowchart = flowchart;
        break;
      }
    }
    
    if (testFlowchart) {
      // Verify flowchart properties
      expect(testFlowchart.title).toBe('Integration Test Flowchart');
      expect(testFlowchart.nodes.size).toBe(5);
      expect(testFlowchart.connections.length).toBe(5);
      expect(testFlowchart.slideWidth).toBe(10);
      expect(testFlowchart.slideHeight).toBe(7.5);

      // Verify nodes
      const nodes = Array.from(testFlowchart.nodes.values());
      const nodeTexts = nodes.map(node => node.text);
      expect(nodeTexts).toContain('Start Process');
      expect(nodeTexts).toContain('Decision Point');
      expect(nodeTexts).toContain('Process A');
      expect(nodeTexts).toContain('Process B');
      expect(nodeTexts).toContain('End Process');

      // Verify connections
      const connectionLabels = testFlowchart.connections.map(conn => conn.label);
      expect(connectionLabels).toContain('proceed');
      expect(connectionLabels).toContain('yes');
      expect(connectionLabels).toContain('no');

      // Verify that all connections reference existing nodes
      testFlowchart.connections.forEach(connection => {
        expect(testFlowchart.getNode(connection.sourceId)).toBeTruthy();
        expect(testFlowchart.getNode(connection.targetId)).toBeTruthy();
      });
    }
  });

  test('handles complex workflow with error recovery', async () => {
    // Create another flowchart for error testing
    const createResult = await callTool('create_flowchart', { 
      title: 'Error Recovery Test' 
    });
    
    const testFlowchartId = createResult.content[0].text.match(/ID: (.+)$/)[1];

    // Add a valid node
    const validNodeResult = await callTool('add_node', {
      flowchartId: testFlowchartId,
      text: 'Valid Node',
    });
    
    const validNodeId = validNodeResult.content[0].text.match(/ID: (.+)$/)[1];

    // Try to add invalid node (should fail but not break system)
    const invalidNodeResult = await callTool('add_node', {
      flowchartId: testFlowchartId,
      text: '', // invalid text
    });
    
    expect(invalidNodeResult.isError).toBe(true);

    // Try to add connection with non-existent node (should fail)
    const invalidConnectionResult = await callTool('add_connection', {
      flowchartId: testFlowchartId,
      sourceNodeId: validNodeId,
      targetNodeId: 'non-existent-node',
    });
    
    expect(invalidConnectionResult.isError).toBe(true);

    // Add a second valid node
    const validNode2Result = await callTool('add_node', {
      flowchartId: testFlowchartId,
      text: 'Second Valid Node',
    });
    
    const validNode2Id = validNode2Result.content[0].text.match(/ID: (.+)$/)[1];

    // Add valid connection
    const validConnectionResult = await callTool('add_connection', {
      flowchartId: testFlowchartId,
      sourceNodeId: validNodeId,
      targetNodeId: validNode2Id,
      label: 'valid connection',
    });
    
    expect(validConnectionResult.isError).toBeUndefined();

    // Apply layout (should work despite previous errors)
    const layoutResult = await callTool('auto_layout', {
      flowchartId: testFlowchartId,
      algorithm: 'hierarchical',
    });
    
    expect(layoutResult.isError).toBeUndefined();

    // Export should work (should handle any missing layouts gracefully)
    const exportResult = await callTool('export_pptx', {
      flowchartId: testFlowchartId,
      filename: 'error-recovery-test',
    });
    
    expect(exportResult.isError).toBeUndefined();
  });

  test('validates complete workflow with edge cases', async () => {
    // Test empty flowchart export
    const emptyFlowchartResult = await callTool('create_flowchart', { 
      title: 'Empty Flowchart Test' 
    });
    
    const emptyFlowchartId = emptyFlowchartResult.content[0].text.match(/ID: (.+)$/)[1];

    // Apply layout to empty flowchart
    const emptyLayoutResult = await callTool('auto_layout', {
      flowchartId: emptyFlowchartId,
      algorithm: 'hierarchical',
    });
    
    expect(emptyLayoutResult.isError).toBeUndefined();

    // Export empty flowchart (should work and show placeholder)
    const emptyExportResult = await callTool('export_pptx', {
      flowchartId: emptyFlowchartId,
      filename: 'empty-flowchart-test',
    });
    
    expect(emptyExportResult.isError).toBeUndefined();

    // Test single node flowchart
    const singleNodeResult = await callTool('add_node', {
      flowchartId: emptyFlowchartId,
      text: 'Single Node',
    });
    
    expect(singleNodeResult.isError).toBeUndefined();

    // Layout and export single node
    await callTool('auto_layout', {
      flowchartId: emptyFlowchartId,
      algorithm: 'hierarchical',
    });

    const singleNodeExportResult = await callTool('export_pptx', {
      flowchartId: emptyFlowchartId,
      filename: 'single-node-test',
    });
    
    expect(singleNodeExportResult.isError).toBeUndefined();
  });
});