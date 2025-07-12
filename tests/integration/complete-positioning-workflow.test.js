const { callTool } = require('../../src/tools/flowchart-tools');

describe('Complete Positioning and Custom Path Workflow', () => {
  let flowchartId;
  const nodeIds = {};
  const connectionIds = {};

  beforeEach(async () => {
    // Create a comprehensive test flowchart
    const flowchartResult = await callTool('create_flowchart', { 
      title: 'Complete Workflow Test Flowchart' 
    });
    flowchartId = flowchartResult.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];
    
    // Create a network of nodes representing a simple workflow
    const nodes = [
      { name: 'start', text: 'Start Process', x: 1, y: 2 },
      { name: 'decision', text: 'Decision Point', x: 3, y: 2 },
      { name: 'process1', text: 'Process A', x: 5, y: 1 },
      { name: 'process2', text: 'Process B', x: 5, y: 3 },
      { name: 'merge', text: 'Merge Results', x: 7, y: 2 },
      { name: 'end', text: 'End Process', x: 9, y: 2 }
    ];
    
    // Add all nodes
    for (const node of nodes) {
      const result = await callTool('add_node', {
        flowchartId,
        text: node.text,
        positionHint: { x: node.x, y: node.y }
      });
      expect(result.isError).toBeUndefined();
      nodeIds[node.name] = result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];
    }
    
    // Create connections representing the workflow
    const connections = [
      { name: 'start_to_decision', source: 'start', target: 'decision', label: 'begin' },
      { name: 'decision_to_a', source: 'decision', target: 'process1', label: 'path A' },
      { name: 'decision_to_b', source: 'decision', target: 'process2', label: 'path B' },
      { name: 'a_to_merge', source: 'process1', target: 'merge', label: 'result A' },
      { name: 'b_to_merge', source: 'process2', target: 'merge', label: 'result B' },
      { name: 'merge_to_end', source: 'merge', target: 'end', label: 'complete' }
    ];
    
    // Add all connections
    for (const conn of connections) {
      const result = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeIds[conn.source],
        targetNodeId: nodeIds[conn.target],
        label: conn.label
      });
      expect(result.isError).toBeUndefined();
      connectionIds[conn.name] = result.content[0].text.match(/with ID: (.+)$/)[1];
    }
  });

  describe('Complete workflow execution', () => {
    test('end-to-end positioning and path customization workflow', async () => {
      // Phase 1: Set initial layout positions (simulating automatic layout)
      console.log('Phase 1: Setting initial layout positions...');
      const initialPositions = [
        { nodeId: nodeIds.start, x: 1, y: 2 },
        { nodeId: nodeIds.decision, x: 3, y: 2 },
        { nodeId: nodeIds.process1, x: 5, y: 1 },
        { nodeId: nodeIds.process2, x: 5, y: 3 },
        { nodeId: nodeIds.merge, x: 7, y: 2 },
        { nodeId: nodeIds.end, x: 9, y: 2 }
      ];
      
      for (const pos of initialPositions) {
        await callTool('set_position', {
          flowchartId,
          elementId: pos.nodeId,
          elementType: 'node',
          x: pos.x,
          y: pos.y
        });
      }
      
      // Phase 2: Manual positioning adjustments for better visual flow
      console.log('Phase 2: Making manual positioning adjustments...');
      const positionAdjustments = [
        { nodeId: nodeIds.start, x: 0.5, y: 3.0 },
        { nodeId: nodeIds.decision, x: 2.5, y: 3.0 },
        { nodeId: nodeIds.process1, x: 4.5, y: 1.5 },
        { nodeId: nodeIds.process2, x: 4.5, y: 4.5 },
        { nodeId: nodeIds.merge, x: 6.5, y: 3.0 },
        { nodeId: nodeIds.end, x: 8.5, y: 3.0 }
      ];
      
      for (const adjustment of positionAdjustments) {
        const result = await callTool('set_position', {
          flowchartId,
          elementId: adjustment.nodeId,
          elementType: 'node',
          x: adjustment.x,
          y: adjustment.y
        });
        expect(result.isError).toBeUndefined();
      }
      
      // Phase 3: Resize nodes for better proportions
      console.log('Phase 3: Resizing nodes for better proportions...');
      const resizeOperations = [
        { nodeId: nodeIds.start, width: 1.5, height: 0.8 },
        { nodeId: nodeIds.decision, width: 2.0, height: 1.0 },
        { nodeId: nodeIds.process1, width: 1.8, height: 0.8 },
        { nodeId: nodeIds.process2, width: 1.8, height: 0.8 },
        { nodeId: nodeIds.merge, width: 2.0, height: 0.8 },
        { nodeId: nodeIds.end, width: 1.5, height: 0.8 }
      ];
      
      for (const resize of resizeOperations) {
        const result = await callTool('resize_node', {
          flowchartId,
          nodeId: resize.nodeId,
          width: resize.width,
          height: resize.height
        });
        expect(result.isError).toBeUndefined();
      }
      
      // Phase 4: Set custom connector paths for better routing
      console.log('Phase 4: Setting custom connector paths...');
      const customPaths = [
        {
          connectionId: connectionIds.start_to_decision,
          pathPoints: [
            { x: 2.0, y: 3.4 },
            { x: 3.5, y: 3.4 }
          ]
        },
        {
          connectionId: connectionIds.decision_to_a,
          pathPoints: [
            { x: 5.5, y: 3.0 },
            { x: 6.0, y: 2.0 },
            { x: 6.5, y: 1.9 }
          ]
        },
        {
          connectionId: connectionIds.decision_to_b,
          pathPoints: [
            { x: 5.5, y: 3.0 },
            { x: 6.0, y: 4.0 },
            { x: 6.5, y: 4.9 }
          ]
        },
        {
          connectionId: connectionIds.a_to_merge,
          pathPoints: [
            { x: 8.3, y: 1.9 },
            { x: 9.0, y: 2.5 },
            { x: 9.5, y: 3.0 }
          ]
        },
        {
          connectionId: connectionIds.b_to_merge,
          pathPoints: [
            { x: 8.3, y: 4.9 },
            { x: 9.0, y: 4.0 },
            { x: 9.5, y: 3.5 }
          ]
        },
        {
          connectionId: connectionIds.merge_to_end,
          pathPoints: [
            { x: 7.5, y: 3.4 },
            { x: 8.5, y: 3.4 }
          ]
        }
      ];
      
      for (const path of customPaths) {
        const result = await callTool('set_connector_path', {
          flowchartId,
          connectionId: path.connectionId,
          pathPoints: path.pathPoints
        });
        expect(result.isError).toBeUndefined();
      }
      
      // Phase 5: Verification - Get all bounding boxes
      console.log('Phase 5: Verifying all element positions and bounding boxes...');
      const allElements = [
        ...Object.entries(nodeIds).map(([name, id]) => ({ type: 'node', name, id })),
        ...Object.entries(connectionIds).map(([name, id]) => ({ type: 'connector', name, id }))
      ];
      
      const boundingBoxes = {};
      for (const element of allElements) {
        const result = await callTool('get_bounding_box', {
          flowchartId,
          elementId: element.id,
          elementType: element.type
        });
        expect(result.isError).toBeUndefined();
        boundingBoxes[element.name] = JSON.parse(result.content[0].text);
      }
      
      // Verify no unexpected overlaps between nodes
      const nodeNames = Object.keys(nodeIds);
      let nodeOverlaps = 0;
      for (let i = 0; i < nodeNames.length; i++) {
        for (let j = i + 1; j < nodeNames.length; j++) {
          const box1 = boundingBoxes[nodeNames[i]];
          const box2 = boundingBoxes[nodeNames[j]];
          
          const overlap = !(
            box1.bottomRight.x < box2.topLeft.x ||
            box2.bottomRight.x < box1.topLeft.x ||
            box1.bottomRight.y < box2.topLeft.y ||
            box2.bottomRight.y < box1.topLeft.y
          );
          
          if (overlap) {
            nodeOverlaps++;
          }
        }
      }
      
      // With careful positioning, we should have minimal or no node overlaps
      expect(nodeOverlaps).toBeLessThanOrEqual(1);
      
      // Phase 6: Get connector points for all connections
      console.log('Phase 6: Verifying all connector points...');
      const connectorPoints = {};
      for (const [name, connectionId] of Object.entries(connectionIds)) {
        const result = await callTool('get_connector_points', {
          flowchartId,
          connectionId
        });
        expect(result.isError).toBeUndefined();
        connectorPoints[name] = JSON.parse(result.content[0].text);
      }
      
      // Verify all connector points are valid
      Object.entries(connectorPoints).forEach(([name, points]) => {
        expect(points).toHaveProperty('sourceNodeId');
        expect(points).toHaveProperty('targetNodeId');
        expect(points).toHaveProperty('startPoint');
        expect(points).toHaveProperty('endPoint');
        expect(points).toHaveProperty('label');
        
        expect(typeof points.startPoint.x).toBe('number');
        expect(typeof points.startPoint.y).toBe('number');
        expect(typeof points.endPoint.x).toBe('number');
        expect(typeof points.endPoint.y).toBe('number');
      });
      
      // Phase 7: Export to both formats
      console.log('Phase 7: Exporting to PDF and SVG...');
      const pdfResult = await callTool('export_pdf', {
        flowchartId,
        filename: 'complete-workflow-test'
      });
      expect(pdfResult.isError).toBeUndefined();
      expect(pdfResult.content[0].text).toContain('PDF generated successfully');
      
      const svgResult = await callTool('export_svg', {
        flowchartId,
        filename: 'complete-workflow-test'
      });
      expect(svgResult.isError).toBeUndefined();
      expect(svgResult.content[0].text).toContain('SVG generated successfully');
      
      console.log('Complete workflow test passed successfully!');
    });

    test('stress test with complex positioning and many custom paths', async () => {
      // Create a complex scenario with many elements
      const additionalNodes = [];
      const additionalConnections = [];
      
      // Add 10 more nodes in a grid pattern
      for (let i = 0; i < 10; i++) {
        const x = 2 + (i % 4) * 2;
        const y = 6 + Math.floor(i / 4) * 2;
        
        const result = await callTool('add_node', {
          flowchartId,
          text: `Grid Node ${i}`,
          positionHint: { x, y }
        });
        expect(result.isError).toBeUndefined();
        
        const nodeId = result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];
        additionalNodes.push(nodeId);
        
        // Connect each new node to the merge node with custom paths
        const connResult = await callTool('add_connection', {
          flowchartId,
          sourceNodeId: nodeId,
          targetNodeId: nodeIds.merge,
          label: `grid connection ${i}`
        });
        expect(connResult.isError).toBeUndefined();
        
        const connectionId = connResult.content[0].text.match(/with ID: (.+)$/)[1];
        additionalConnections.push(connectionId);
      }
      
      // Set unique custom paths for all additional connections
      for (let i = 0; i < additionalConnections.length; i++) {
        const connectionId = additionalConnections[i];
        const nodeX = 2 + (i % 4) * 1.5;
        const nodeY = 4 + Math.floor(i / 4) * 1;
        
        // Create a curved path to avoid other elements
        const pathPoints = [
          { x: nodeX + 1, y: nodeY + 0.4 },
          { x: nodeX + 2, y: nodeY - 1 },
          { x: 8 + i * 0.2, y: 4 - i * 0.1 },
          { x: 9.5, y: 3.2 }
        ];
        
        const result = await callTool('set_connector_path', {
          flowchartId,
          connectionId,
          pathPoints
        });
        expect(result.isError).toBeUndefined();
      }
      
      // Verify all operations completed successfully
      expect(additionalNodes).toHaveLength(10);
      expect(additionalConnections).toHaveLength(10);
      
      // Get bounding boxes for all additional elements
      for (let i = 0; i < additionalNodes.length; i++) {
        const nodeResult = await callTool('get_bounding_box', {
          flowchartId,
          elementId: additionalNodes[i],
          elementType: 'node'
        });
        expect(nodeResult.isError).toBeUndefined();
        
        const connResult = await callTool('get_bounding_box', {
          flowchartId,
          elementId: additionalConnections[i],
          elementType: 'connector'
        });
        expect(connResult.isError).toBeUndefined();
      }
      
      // Final export should still work with complex layout
      const complexExportResult = await callTool('export_pdf', {
        flowchartId,
        filename: 'complex-stress-test'
      });
      expect(complexExportResult.isError).toBeUndefined();
    });
  });

  describe('Error recovery and robustness', () => {
    test('recovers gracefully from invalid operations during workflow', async () => {
      const operations = [
        // Valid operation
        {
          tool: 'set_position',
          args: { flowchartId, elementId: nodeIds.start, elementType: 'node', x: 1.0, y: 1.0 },
          shouldSucceed: true
        },
        // Invalid operation (out of bounds)
        {
          tool: 'set_position',
          args: { flowchartId, elementId: nodeIds.decision, elementType: 'node', x: 15.0, y: 1.0 },
          shouldSucceed: false
        },
        // Valid operation
        {
          tool: 'resize_node',
          args: { flowchartId, nodeId: nodeIds.process1, width: 2.0, height: 1.0 },
          shouldSucceed: true
        },
        // Invalid operation (negative size)
        {
          tool: 'resize_node',
          args: { flowchartId, nodeId: nodeIds.process2, width: -1.0, height: 1.0 },
          shouldSucceed: false
        },
        // Valid operation
        {
          tool: 'set_connector_path',
          args: { 
            flowchartId, 
            connectionId: connectionIds.start_to_decision, 
            pathPoints: [{ x: 1.5, y: 1.5 }, { x: 3.5, y: 1.5 }] 
          },
          shouldSucceed: true
        },
        // Invalid operation (out of bounds path)
        {
          tool: 'set_connector_path',
          args: { 
            flowchartId, 
            connectionId: connectionIds.decision_to_a, 
            pathPoints: [{ x: 1.5, y: 1.5 }, { x: 15.0, y: 1.5 }] 
          },
          shouldSucceed: false
        }
      ];
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const op of operations) {
        const result = await callTool(op.tool, op.args);
        
        if (op.shouldSucceed) {
          expect(result.isError).toBeUndefined();
          successCount++;
        } else {
          expect(result.isError).toBe(true);
          errorCount++;
        }
      }
      
      expect(successCount).toBe(3);
      expect(errorCount).toBe(3);
      
      // System should still be functional after errors
      const finalExportResult = await callTool('export_pdf', {
        flowchartId,
        filename: 'error-recovery-test'
      });
      expect(finalExportResult.isError).toBeUndefined();
    });
  });
});