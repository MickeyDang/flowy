const { callTool } = require('../../src/tools/flowchart-tools');

describe('Connector Path Workflow Integration', () => {
  let flowchartId, nodeId1, nodeId2, nodeId3, nodeId4, connectionId1, connectionId2, connectionId3;

  beforeEach(async () => {
    // Create flowchart
    const flowchartResult = await callTool('create_flowchart', { title: 'Connector Path Test Flowchart' });
    flowchartId = flowchartResult.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];
    
    // Add four nodes in a square pattern
    const node1Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Top Left',
      positionHint: { x: 1, y: 1 }
    });
    nodeId1 = node1Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];
    
    const node2Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Top Right',
      positionHint: { x: 6, y: 1 }
    });
    nodeId2 = node2Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];
    
    const node3Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Bottom Left',
      positionHint: { x: 1, y: 5 }
    });
    nodeId3 = node3Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];
    
    const node4Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Bottom Right',
      positionHint: { x: 6, y: 5 }
    });
    nodeId4 = node4Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];
    
    // Add connections
    const connection1Result = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId1,
      targetNodeId: nodeId2,
      label: 'top edge'
    });
    connectionId1 = connection1Result.content[0].text.match(/with ID: (.+)$/)[1];
    
    const connection2Result = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId2,
      targetNodeId: nodeId4,
      label: 'right edge'
    });
    connectionId2 = connection2Result.content[0].text.match(/with ID: (.+)$/)[1];
    
    const connection3Result = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId1,
      targetNodeId: nodeId4,
      label: 'diagonal'
    });
    connectionId3 = connection3Result.content[0].text.match(/with ID: (.+)$/)[1];
  });

  describe('Basic custom path workflow', () => {
    test('set and verify straight custom path', async () => {
      // Step 1: Set straight custom path
      const pathResult = await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 2.0, y: 1.5 },
          { x: 6.0, y: 1.5 }
        ]
      });
      expect(pathResult.isError).toBeUndefined();
      
      // Step 2: Get bounding box for custom path
      const boundingBoxResult = await callTool('get_bounding_box', {
        flowchartId,
        elementId: connectionId1,
        elementType: 'connector'
      });
      expect(boundingBoxResult.isError).toBeUndefined();
      
      const boundingBox = JSON.parse(boundingBoxResult.content[0].text);
      expect(boundingBox.topLeft.x).toBe(2.0);
      expect(boundingBox.topLeft.y).toBe(1.5);
      expect(boundingBox.bottomRight.x).toBe(6.0);
      expect(boundingBox.bottomRight.y).toBe(1.5);
      expect(boundingBox.width).toBe(4.0);
      expect(boundingBox.height).toBe(0);
    });

    test('set and verify curved custom path', async () => {
      // Step 1: Set curved custom path
      const pathResult = await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId2,
        pathPoints: [
          { x: 6.5, y: 1.5 },
          { x: 8.0, y: 3.0 },
          { x: 7.5, y: 4.5 },
          { x: 6.5, y: 5.5 }
        ]
      });
      expect(pathResult.isError).toBeUndefined();
      
      // Step 2: Verify bounding box encompasses all points
      const boundingBoxResult = await callTool('get_bounding_box', {
        flowchartId,
        elementId: connectionId2,
        elementType: 'connector'
      });
      
      const boundingBox = JSON.parse(boundingBoxResult.content[0].text);
      expect(boundingBox.topLeft.x).toBe(6.5);
      expect(boundingBox.topLeft.y).toBe(1.5);
      expect(boundingBox.bottomRight.x).toBe(8.0);
      expect(boundingBox.bottomRight.y).toBe(5.5);
      expect(boundingBox.width).toBe(1.5);
      expect(boundingBox.height).toBe(4.0);
    });

    test('set complex zigzag path', async () => {
      // Step 1: Set zigzag custom path
      const pathResult = await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId3,
        pathPoints: [
          { x: 2.0, y: 1.5 },
          { x: 3.5, y: 2.0 },
          { x: 3.0, y: 3.5 },
          { x: 4.5, y: 4.0 },
          { x: 5.0, y: 5.0 },
          { x: 6.0, y: 5.5 }
        ]
      });
      expect(pathResult.isError).toBeUndefined();
      
      // Step 2: Verify complex bounding box
      const boundingBoxResult = await callTool('get_bounding_box', {
        flowchartId,
        elementId: connectionId3,
        elementType: 'connector'
      });
      
      const boundingBox = JSON.parse(boundingBoxResult.content[0].text);
      expect(boundingBox.topLeft.x).toBe(2.0);
      expect(boundingBox.topLeft.y).toBe(1.5);
      expect(boundingBox.bottomRight.x).toBe(6.0);
      expect(boundingBox.bottomRight.y).toBe(5.5);
      expect(boundingBox.center.x).toBe(4.0);
      expect(boundingBox.center.y).toBe(3.5);
    });
  });

  describe('Path modification workflow', () => {
    test('iteratively refine connector path', async () => {
      // Step 1: Set initial simple path
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 2.0, y: 1.5 },
          { x: 6.0, y: 1.5 }
        ]
      });
      
      // Step 2: Add intermediate point for slight curve
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 2.0, y: 1.5 },
          { x: 4.0, y: 0.5 },
          { x: 6.0, y: 1.5 }
        ]
      });
      
      // Step 3: Add more points for complex curve
      const finalPathResult = await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 2.0, y: 1.5 },
          { x: 3.0, y: 0.5 },
          { x: 4.0, y: 0.2 },
          { x: 5.0, y: 0.5 },
          { x: 6.0, y: 1.5 }
        ]
      });
      expect(finalPathResult.isError).toBeUndefined();
      
      // Step 4: Verify final bounding box
      const boundingBoxResult = await callTool('get_bounding_box', {
        flowchartId,
        elementId: connectionId1,
        elementType: 'connector'
      });
      
      const boundingBox = JSON.parse(boundingBoxResult.content[0].text);
      expect(boundingBox.topLeft.y).toBe(0.2); // Should include lowest point
      expect(boundingBox.bottomRight.y).toBe(1.5); // Should include highest point
    });

    test('switch between different path styles', async () => {
      const pathStyles = [
        // Straight path
        [
          { x: 2.0, y: 1.5 },
          { x: 6.0, y: 1.5 }
        ],
        // Curved path
        [
          { x: 2.0, y: 1.5 },
          { x: 4.0, y: 3.0 },
          { x: 6.0, y: 1.5 }
        ],
        // Rectangular path
        [
          { x: 2.0, y: 1.5 },
          { x: 2.0, y: 0.5 },
          { x: 6.0, y: 0.5 },
          { x: 6.0, y: 1.5 }
        ]
      ];
      
      for (const [index, pathPoints] of pathStyles.entries()) {
        const pathResult = await callTool('set_connector_path', {
          flowchartId,
          connectionId: connectionId1,
          pathPoints
        });
        expect(pathResult.isError).toBeUndefined();
        expect(pathResult.content[0].text).toMatch(new RegExp(`with ${pathPoints.length} points`));
      }
    });
  });

  describe('Multiple connector paths workflow', () => {
    test('set different paths for all connectors', async () => {
      const paths = [
        {
          connectionId: connectionId1,
          pathPoints: [
            { x: 2.0, y: 1.5 },
            { x: 4.0, y: 0.5 },
            { x: 6.0, y: 1.5 }
          ]
        },
        {
          connectionId: connectionId2,
          pathPoints: [
            { x: 6.5, y: 1.5 },
            { x: 8.0, y: 3.0 },
            { x: 6.5, y: 5.5 }
          ]
        },
        {
          connectionId: connectionId3,
          pathPoints: [
            { x: 2.0, y: 1.5 },
            { x: 3.0, y: 3.0 },
            { x: 5.0, y: 4.0 },
            { x: 6.0, y: 5.5 }
          ]
        }
      ];
      
      // Set all paths
      for (const path of paths) {
        const result = await callTool('set_connector_path', {
          flowchartId,
          connectionId: path.connectionId,
          pathPoints: path.pathPoints
        });
        expect(result.isError).toBeUndefined();
      }
      
      // Verify all bounding boxes
      for (const path of paths) {
        const boundingBoxResult = await callTool('get_bounding_box', {
          flowchartId,
          elementId: path.connectionId,
          elementType: 'connector'
        });
        expect(boundingBoxResult.isError).toBeUndefined();
        
        const boundingBox = JSON.parse(boundingBoxResult.content[0].text);
        expect(boundingBox.width).toBeGreaterThanOrEqual(0);
        expect(boundingBox.height).toBeGreaterThanOrEqual(0);
      }
    });

    test('avoid path overlaps through custom routing', async () => {
      // Set paths that avoid each other
      const separatedPaths = [
        {
          connectionId: connectionId1,
          pathPoints: [
            { x: 2.0, y: 1.5 },
            { x: 4.0, y: 0.5 }, // Route above
            { x: 6.0, y: 1.5 }
          ]
        },
        {
          connectionId: connectionId3,
          pathPoints: [
            { x: 2.0, y: 1.5 },
            { x: 4.0, y: 2.5 }, // Route below
            { x: 6.0, y: 5.5 }
          ]
        }
      ];
      
      // Set separated paths
      for (const path of separatedPaths) {
        const result = await callTool('set_connector_path', {
          flowchartId,
          connectionId: path.connectionId,
          pathPoints: path.pathPoints
        });
        expect(result.isError).toBeUndefined();
      }
      
      // Get bounding boxes
      const boundingBoxes = [];
      for (const path of separatedPaths) {
        const boundingBoxResult = await callTool('get_bounding_box', {
          flowchartId,
          elementId: path.connectionId,
          elementType: 'connector'
        });
        boundingBoxes.push(JSON.parse(boundingBoxResult.content[0].text));
      }
      
      // Verify separation (top path should not exceed bottom path boundary)
      expect(boundingBoxes[0].bottomRight.y).toBeLessThanOrEqual(boundingBoxes[1].topLeft.y);
    });
  });

  describe('Path validation and error handling', () => {
    test('handle path points outside slide bounds', async () => {
      // Attempt to set path with out-of-bounds points
      const invalidResult = await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 2.0, y: 1.5 },
          { x: 15.0, y: 1.5 } // Beyond slide width
        ]
      });
      expect(invalidResult.isError).toBe(true);
      expect(invalidResult.content[0].text).toMatch(/pathPoints\[1\]: Validation error for x: must be between 0 and 10 inches/);
      
      // Set valid path instead
      const validResult = await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 2.0, y: 1.5 },
          { x: 6.0, y: 1.5 }
        ]
      });
      expect(validResult.isError).toBeUndefined();
    });

    test('handle insufficient path points', async () => {
      // Attempt to set path with only one point
      const invalidResult = await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 2.0, y: 1.5 }
        ]
      });
      expect(invalidResult.isError).toBe(true);
      expect(invalidResult.content[0].text).toMatch(/must contain at least 2 points/);
    });

    test('handle malformed path points', async () => {
      // Attempt to set path with invalid point format
      const invalidResult = await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 2.0, y: 1.5 },
          { x: 'invalid', y: 1.5 }
        ]
      });
      expect(invalidResult.isError).toBe(true);
      expect(invalidResult.content[0].text).toMatch(/must be a finite number/);
    });
  });

  describe('Export workflow with custom paths', () => {
    test('export flowchart with mixed straight and curved connectors', async () => {
      // Set up mixed connector styles
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 2.0, y: 1.5 },
          { x: 6.0, y: 1.5 } // Straight
        ]
      });
      
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId2,
        pathPoints: [
          { x: 6.5, y: 1.5 },
          { x: 8.0, y: 3.0 },
          { x: 6.5, y: 5.5 } // Curved
        ]
      });
      
      // Leave connectionId3 without custom path (default straight line)
      
      // Export to PDF
      const pdfResult = await callTool('export_pdf', {
        flowchartId,
        filename: 'mixed-connectors'
      });
      expect(pdfResult.isError).toBeUndefined();
      expect(pdfResult.content[0].text).toContain('PDF generated successfully');
      
      // Export to SVG
      const svgResult = await callTool('export_svg', {
        flowchartId,
        filename: 'mixed-connectors'
      });
      expect(svgResult.isError).toBeUndefined();
      expect(svgResult.content[0].text).toContain('SVG generated successfully');
    });

    test('export flowchart with complex connector paths', async () => {
      // Set complex paths for all connectors
      const complexPaths = [
        {
          connectionId: connectionId1,
          pathPoints: [
            { x: 2.0, y: 1.5 },
            { x: 3.0, y: 0.5 },
            { x: 4.0, y: 0.2 },
            { x: 5.0, y: 0.5 },
            { x: 6.0, y: 1.5 }
          ]
        },
        {
          connectionId: connectionId2,
          pathPoints: [
            { x: 6.5, y: 1.5 },
            { x: 7.5, y: 2.0 },
            { x: 8.0, y: 3.0 },
            { x: 7.5, y: 4.0 },
            { x: 6.5, y: 5.5 }
          ]
        },
        {
          connectionId: connectionId3,
          pathPoints: [
            { x: 2.0, y: 1.5 },
            { x: 1.0, y: 3.0 },
            { x: 3.5, y: 4.0 },
            { x: 5.0, y: 6.0 },
            { x: 6.0, y: 5.5 }
          ]
        }
      ];
      
      // Set all complex paths
      for (const path of complexPaths) {
        const result = await callTool('set_connector_path', {
          flowchartId,
          connectionId: path.connectionId,
          pathPoints: path.pathPoints
        });
        expect(result.isError).toBeUndefined();
      }
      
      // Export with complex paths
      const exportResult = await callTool('export_pdf', {
        flowchartId,
        filename: 'complex-connectors'
      });
      expect(exportResult.isError).toBeUndefined();
      expect(exportResult.content[0].text).toContain('PDF generated successfully');
    });
  });

  describe('Performance and scale testing', () => {
    test('handle connector with many path points', async () => {
      // Create path with 50 points
      const manyPoints = [];
      for (let i = 0; i <= 50; i++) {
        const t = i / 50;
        manyPoints.push({
          x: 2.0 + t * 4.0, // Linear interpolation from 2 to 6
          y: 1.5 + Math.sin(t * Math.PI * 4) * 0.5 // Sine wave
        });
      }
      
      const result = await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: manyPoints
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toMatch(/with 51 points/);
      
      // Verify bounding box calculation works with many points
      const boundingBoxResult = await callTool('get_bounding_box', {
        flowchartId,
        elementId: connectionId1,
        elementType: 'connector'
      });
      expect(boundingBoxResult.isError).toBeUndefined();
      
      const boundingBox = JSON.parse(boundingBoxResult.content[0].text);
      expect(boundingBox.width).toBeCloseTo(4.0, 1);
      expect(boundingBox.height).toBeCloseTo(1.0, 1); // Sine wave amplitude
    });
  });
});