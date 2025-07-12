const { callTool } = require('../../src/tools/flowchart-tools');

describe('Positioning Workflow Integration', () => {
  let flowchartId, nodeId1, nodeId2, nodeId3, connectionId1, connectionId2;

  beforeEach(async () => {
    // Create flowchart
    const flowchartResult = await callTool('create_flowchart', { title: 'Positioning Test Flowchart' });
    flowchartId = flowchartResult.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];
    
    // Add three nodes
    const node1Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Start Node',
      positionHint: { x: 1, y: 1 }
    });
    nodeId1 = node1Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];
    
    const node2Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Middle Node',
      positionHint: { x: 5, y: 3 }
    });
    nodeId2 = node2Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];
    
    const node3Result = await callTool('add_node', { 
      flowchartId, 
      text: 'End Node',
      positionHint: { x: 8, y: 5 }
    });
    nodeId3 = node3Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];
    
    // Add connections
    const connection1Result = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId1,
      targetNodeId: nodeId2,
      label: 'first connection'
    });
    connectionId1 = connection1Result.content[0].text.match(/with ID: (.+)$/)[1];
    
    const connection2Result = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId2,
      targetNodeId: nodeId3,
      label: 'second connection'
    });
    connectionId2 = connection2Result.content[0].text.match(/with ID: (.+)$/)[1];
  });

  describe('Node positioning and resizing workflow', () => {
    test('complete node manipulation workflow', async () => {
      // Step 1: Resize first node
      const resizeResult = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 2.5,
        height: 1.5
      });
      expect(resizeResult.isError).toBeUndefined();
      
      // Step 2: Move node to new position
      const positionResult = await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 0.5,
        y: 0.5
      });
      expect(positionResult.isError).toBeUndefined();
      
      // Step 3: Get bounding box to verify changes
      const boundingBoxResult = await callTool('get_bounding_box', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node'
      });
      expect(boundingBoxResult.isError).toBeUndefined();
      
      const boundingBox = JSON.parse(boundingBoxResult.content[0].text);
      expect(boundingBox.topLeft.x).toBe(0.5);
      expect(boundingBox.topLeft.y).toBe(0.5);
      expect(boundingBox.bottomRight.x).toBe(3.0);
      expect(boundingBox.bottomRight.y).toBe(2.0);
      expect(boundingBox.width).toBe(2.5);
      expect(boundingBox.height).toBe(1.5);
    });

    test('automatic layout followed by manual adjustments', async () => {
      // Step 1: Set initial positions (simulating automatic layout)
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 1.0,
        y: 1.0
      });
      
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId2,
        elementType: 'node',
        x: 1.0,
        y: 3.0
      });
      
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId3,
        elementType: 'node',
        x: 5.0,
        y: 2.0
      });
      
      // Step 2: Manually adjust specific nodes
      const manualAdjustResult = await callTool('set_position', {
        flowchartId,
        elementId: nodeId2,
        elementType: 'node',
        x: 4.0,
        y: 2.0
      });
      expect(manualAdjustResult.isError).toBeUndefined();
      
      // Step 3: Resize adjusted node
      const resizeResult = await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId2,
        width: 3.0,
        height: 1.0
      });
      expect(resizeResult.isError).toBeUndefined();
      
      // Step 4: Verify final position and size
      const boundingBoxResult = await callTool('get_bounding_box', {
        flowchartId,
        elementId: nodeId2,
        elementType: 'node'
      });
      
      const boundingBox = JSON.parse(boundingBoxResult.content[0].text);
      expect(boundingBox.topLeft.x).toBe(4.0);
      expect(boundingBox.topLeft.y).toBe(2.0);
      expect(boundingBox.width).toBe(3.0);
      expect(boundingBox.height).toBe(1.0);
    });
  });

  describe('Connection positioning workflow', () => {
    test('connector points update with node repositioning', async () => {
      // Step 1: Get initial connector points
      const initialPointsResult = await callTool('get_connector_points', {
        flowchartId,
        connectionId: connectionId1
      });
      expect(initialPointsResult.isError).toBeUndefined();
      const initialPoints = JSON.parse(initialPointsResult.content[0].text);
      
      // Step 2: Move source node
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 2.0,
        y: 2.0
      });
      
      // Step 3: Move target node
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId2,
        elementType: 'node',
        x: 6.0,
        y: 4.0
      });
      
      // Step 4: Get updated connector points
      const updatedPointsResult = await callTool('get_connector_points', {
        flowchartId,
        connectionId: connectionId1
      });
      expect(updatedPointsResult.isError).toBeUndefined();
      const updatedPoints = JSON.parse(updatedPointsResult.content[0].text);
      
      // Points should be different after node repositioning
      expect(updatedPoints.startPoint.x).not.toBe(initialPoints.startPoint.x);
      expect(updatedPoints.startPoint.y).not.toBe(initialPoints.startPoint.y);
      expect(updatedPoints.endPoint.x).not.toBe(initialPoints.endPoint.x);
      expect(updatedPoints.endPoint.y).not.toBe(initialPoints.endPoint.y);
    });

    test('custom connector path workflow', async () => {
      // Step 1: Set custom path for first connection
      const customPathResult = await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 2.0, y: 4.0 },
          { x: 4.0, y: 2.0 },
          { x: 5.0, y: 3.0 }
        ]
      });
      expect(customPathResult.isError).toBeUndefined();
      
      // Step 2: Get connector bounding box with custom path
      const boundingBoxResult = await callTool('get_bounding_box', {
        flowchartId,
        elementId: connectionId1,
        elementType: 'connector'
      });
      expect(boundingBoxResult.isError).toBeUndefined();
      
      const boundingBox = JSON.parse(boundingBoxResult.content[0].text);
      expect(boundingBox.topLeft.x).toBe(1.0);
      expect(boundingBox.topLeft.y).toBe(1.0);
      expect(boundingBox.bottomRight.x).toBe(5.0);
      expect(boundingBox.bottomRight.y).toBe(4.0);
      
      // Step 3: Update custom path
      const updatedPathResult = await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 0.5, y: 0.5 },
          { x: 6.0, y: 6.0 }
        ]
      });
      expect(updatedPathResult.isError).toBeUndefined();
      
      // Step 4: Verify updated bounding box
      const updatedBoundingBoxResult = await callTool('get_bounding_box', {
        flowchartId,
        elementId: connectionId1,
        elementType: 'connector'
      });
      
      const updatedBoundingBox = JSON.parse(updatedBoundingBoxResult.content[0].text);
      expect(updatedBoundingBox.topLeft.x).toBe(0.5);
      expect(updatedBoundingBox.topLeft.y).toBe(0.5);
      expect(updatedBoundingBox.bottomRight.x).toBe(6.0);
      expect(updatedBoundingBox.bottomRight.y).toBe(6.0);
    });
  });

  describe('Multi-element positioning workflow', () => {
    test('position multiple elements in sequence', async () => {
      // Position nodes in a line
      const positions = [
        { nodeId: nodeId1, x: 1.0, y: 3.0 },
        { nodeId: nodeId2, x: 4.0, y: 3.0 },
        { nodeId: nodeId3, x: 7.0, y: 3.0 }
      ];
      
      // Apply positions
      for (const pos of positions) {
        const result = await callTool('set_position', {
          flowchartId,
          elementId: pos.nodeId,
          elementType: 'node',
          x: pos.x,
          y: pos.y
        });
        expect(result.isError).toBeUndefined();
      }
      
      // Verify all positions
      for (const pos of positions) {
        const boundingBoxResult = await callTool('get_bounding_box', {
          flowchartId,
          elementId: pos.nodeId,
          elementType: 'node'
        });
        
        const boundingBox = JSON.parse(boundingBoxResult.content[0].text);
        expect(boundingBox.topLeft.x).toBe(pos.x);
        expect(boundingBox.topLeft.y).toBe(pos.y);
      }
    });

    test('resize all nodes to same dimensions', async () => {
      const targetWidth = 2.0;
      const targetHeight = 1.0;
      const nodeIds = [nodeId1, nodeId2, nodeId3];
      
      // Resize all nodes
      for (const nodeId of nodeIds) {
        const result = await callTool('resize_node', {
          flowchartId,
          nodeId,
          width: targetWidth,
          height: targetHeight
        });
        expect(result.isError).toBeUndefined();
      }
      
      // Verify all sizes
      for (const nodeId of nodeIds) {
        const boundingBoxResult = await callTool('get_bounding_box', {
          flowchartId,
          elementId: nodeId,
          elementType: 'node'
        });
        
        const boundingBox = JSON.parse(boundingBoxResult.content[0].text);
        expect(boundingBox.width).toBe(targetWidth);
        expect(boundingBox.height).toBe(targetHeight);
      }
    });
  });

  describe('Export workflow with custom positioning', () => {
    test('export to PDF after positioning adjustments', async () => {
      // Step 1: Position nodes
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 1.0,
        y: 1.0
      });
      
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId2,
        elementType: 'node',
        x: 4.0,
        y: 3.0
      });
      
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId3,
        elementType: 'node',
        x: 7.0,
        y: 5.0
      });
      
      // Step 2: Set custom connector path
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 2.0, y: 1.5 },
          { x: 3.0, y: 2.5 },
          { x: 4.0, y: 3.5 }
        ]
      });
      
      // Step 3: Export to PDF
      const exportResult = await callTool('export_pdf', {
        flowchartId,
        filename: 'positioned-flowchart'
      });
      
      expect(exportResult.isError).toBeUndefined();
      expect(exportResult.content[0].text).toContain('PDF generated successfully');
      expect(exportResult.content[0].text).toContain('positioned-flowchart.pdf');
    });

    test('export to SVG after positioning adjustments', async () => {
      // Step 1: Set initial layout positions
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 2.0,
        y: 1.0
      });
      
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId2,
        elementType: 'node',
        x: 2.0,
        y: 3.0
      });
      
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId3,
        elementType: 'node',
        x: 6.0,
        y: 2.0
      });
      
      // Step 2: Make manual adjustments
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId2,
        width: 3.0,
        height: 1.5
      });
      
      // Step 3: Export to SVG
      const exportResult = await callTool('export_svg', {
        flowchartId,
        filename: 'positioned-flowchart'
      });
      
      expect(exportResult.isError).toBeUndefined();
      expect(exportResult.content[0].text).toContain('SVG generated successfully');
      expect(exportResult.content[0].text).toContain('positioned-flowchart.svg');
    });
  });

  describe('Error recovery workflow', () => {
    test('recover from invalid positioning attempts', async () => {
      // Attempt invalid positioning
      const invalidResult = await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: -1.0, // Invalid (negative)
        y: 2.0
      });
      expect(invalidResult.isError).toBe(true);
      
      // Recover with valid positioning
      const validResult = await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 1.0,
        y: 2.0
      });
      expect(validResult.isError).toBeUndefined();
      
      // Verify successful positioning
      const boundingBoxResult = await callTool('get_bounding_box', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node'
      });
      
      const boundingBox = JSON.parse(boundingBoxResult.content[0].text);
      expect(boundingBox.topLeft.x).toBe(1.0);
      expect(boundingBox.topLeft.y).toBe(2.0);
    });

    test('handle mixed valid and invalid operations', async () => {
      const operations = [
        // Valid operation
        { 
          tool: 'set_position',
          args: { flowchartId, elementId: nodeId1, elementType: 'node', x: 2.0, y: 2.0 },
          shouldSucceed: true
        },
        // Invalid operation
        { 
          tool: 'resize_node',
          args: { flowchartId, nodeId: nodeId1, width: -1.0, height: 1.0 },
          shouldSucceed: false
        },
        // Valid operation
        { 
          tool: 'resize_node',
          args: { flowchartId, nodeId: nodeId1, width: 2.0, height: 1.0 },
          shouldSucceed: true
        }
      ];
      
      for (const op of operations) {
        const result = await callTool(op.tool, op.args);
        if (op.shouldSucceed) {
          expect(result.isError).toBeUndefined();
        } else {
          expect(result.isError).toBe(true);
        }
      }
      
      // Verify final state is valid
      const boundingBoxResult = await callTool('get_bounding_box', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node'
      });
      
      const boundingBox = JSON.parse(boundingBoxResult.content[0].text);
      expect(boundingBox.topLeft.x).toBe(2.0);
      expect(boundingBox.topLeft.y).toBe(2.0);
      expect(boundingBox.width).toBe(2.0);
      expect(boundingBox.height).toBe(1.0);
    });
  });
});