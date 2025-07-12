const { callTool } = require('../../src/tools/flowchart-tools');
const Flowchart = require('../../src/models/flowchart');

// Mock the jsPDF module
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    setProperties: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    setFillColor: jest.fn(),
    setDrawColor: jest.fn(),
    setLineWidth: jest.fn(),
    rect: jest.fn(),
    setTextColor: jest.fn(),
    line: jest.fn(),
    triangle: jest.fn(),
    output: jest.fn().mockReturnValue(Buffer.from('mock-pdf-data'))
  }))
}));

describe('Complete Flowchart Workflow', () => {
  let flowchartId;

  test('creates complete flowchart and exports to PDF', async () => {
    // Step 1: Create flowchart
    const createResult = await callTool('create_flowchart', { 
      title: 'Integration Test Flowchart' 
    });
    
    expect(createResult.isError).toBeUndefined();
    expect(createResult.content[0].text).toMatch(/Flowchart created with ID:/);
    
    flowchartId = createResult.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];
    expect(flowchartId).toBeTruthy();

    // Step 2: Add nodes
    const addNode1Result = await callTool('add_node', {
      flowchartId,
      text: 'Start Process',
      positionHint: { x: 1, y: 1 },
    });
    
    expect(addNode1Result.isError).toBeUndefined();
    const nodeId1 = addNode1Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];

    const addNode2Result = await callTool('add_node', {
      flowchartId,
      text: 'Decision Point',
      positionHint: { x: 3, y: 1 },
    });
    
    expect(addNode2Result.isError).toBeUndefined();
    const nodeId2 = addNode2Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];

    const addNode3Result = await callTool('add_node', {
      flowchartId,
      text: 'Process A',
      positionHint: { x: 5, y: 0.5 },
    });
    
    expect(addNode3Result.isError).toBeUndefined();
    const nodeId3 = addNode3Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];

    const addNode4Result = await callTool('add_node', {
      flowchartId,
      text: 'Process B',
      positionHint: { x: 5, y: 1.5 },
    });
    
    expect(addNode4Result.isError).toBeUndefined();
    const nodeId4 = addNode4Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];

    const addNode5Result = await callTool('add_node', {
      flowchartId,
      text: 'End Process',
      positionHint: { x: 7, y: 1 },
    });
    
    expect(addNode5Result.isError).toBeUndefined();
    const nodeId5 = addNode5Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];

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

    // Step 4: Set initial positions (replacing deprecated auto_layout)
    await callTool('set_position', { flowchartId, elementId: nodeId1, elementType: 'node', x: 1, y: 2 });
    await callTool('set_position', { flowchartId, elementId: nodeId2, elementType: 'node', x: 3, y: 2 });
    await callTool('set_position', { flowchartId, elementId: nodeId3, elementType: 'node', x: 5, y: 1 });
    await callTool('set_position', { flowchartId, elementId: nodeId4, elementType: 'node', x: 5, y: 3 });
    await callTool('set_position', { flowchartId, elementId: nodeId5, elementType: 'node', x: 7, y: 2 });

    // Step 5: Export to PDF
    const exportResult = await callTool('export_pdf', {
      flowchartId,
      filename: 'integration-test-flowchart',
    });
    
    expect(exportResult.isError).toBeUndefined();
    expect(exportResult.content[0].type).toBe('text');
    expect(exportResult.content[0].text).toContain('PDF generated successfully');
    expect(exportResult.content[0].text).toContain('integration-test-flowchart.pdf');
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
    
    const testFlowchartId = createResult.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];

    // Add a valid node
    const validNodeResult = await callTool('add_node', {
      flowchartId: testFlowchartId,
      text: 'Valid Node',
    });
    
    const validNodeId = validNodeResult.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];

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
    
    const validNode2Id = validNode2Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];

    // Add valid connection
    const validConnectionResult = await callTool('add_connection', {
      flowchartId: testFlowchartId,
      sourceNodeId: validNodeId,
      targetNodeId: validNode2Id,
      label: 'valid connection',
    });
    
    expect(validConnectionResult.isError).toBeUndefined();

    // Position nodes (replacing deprecated auto_layout)
    await callTool('set_position', { flowchartId: testFlowchartId, elementId: validNodeId, elementType: 'node', x: 2, y: 2 });
    await callTool('set_position', { flowchartId: testFlowchartId, elementId: validNode2Id, elementType: 'node', x: 4, y: 2 });

    // Export should work (should handle any missing layouts gracefully)
    const exportResult = await callTool('export_pdf', {
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
    
    const emptyFlowchartId = emptyFlowchartResult.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];

    // No layout needed for empty flowchart (auto_layout deprecated)

    // Export empty flowchart (should work and show placeholder)
    const emptyExportResult = await callTool('export_pdf', {
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

    // Position single node (replacing deprecated auto_layout)
    const singleNodeId = singleNodeResult.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];
    await callTool('set_position', { flowchartId: emptyFlowchartId, elementId: singleNodeId, elementType: 'node', x: 2, y: 2 });

    const singleNodeExportResult = await callTool('export_pdf', {
      flowchartId: emptyFlowchartId,
      filename: 'single-node-test',
    });
    
    expect(singleNodeExportResult.isError).toBeUndefined();
  });
});