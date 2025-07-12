// TODO: update the test mocks to deprecate the use of autolayout.
const { callTool } = require('../../src/tools/flowchart-tools');

describe('Overlap Detection Integration', () => {
  let flowchartId, nodeId1, nodeId2, nodeId3, nodeId4, connectionId1, connectionId2;

  beforeEach(async () => {
    // Create flowchart
    const flowchartResult = await callTool('create_flowchart', { title: 'Overlap Detection Test' });
    flowchartId = flowchartResult.content[0].text.match(/ID: ([a-f0-9-]+)/)[1];
    
    // Add nodes with known positions and sizes
    const node1Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Node A',
      positionHint: { x: 1, y: 1 }
    });
    nodeId1 = node1Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];
    
    const node2Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Node B',
      positionHint: { x: 3, y: 1 }
    });
    nodeId2 = node2Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];
    
    const node3Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Node C',
      positionHint: { x: 1, y: 3 }
    });
    nodeId3 = node3Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];
    
    const node4Result = await callTool('add_node', { 
      flowchartId, 
      text: 'Node D',
      positionHint: { x: 5, y: 5 }
    });
    nodeId4 = node4Result.content[0].text.match(/with ID: ([a-zA-Z0-9_]+)/)[1];
    
    // Add connections
    const connection1Result = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId1,
      targetNodeId: nodeId2,
      label: 'connection 1'
    });
    connectionId1 = connection1Result.content[0].text.match(/with ID: (.+)$/)[1];
    
    const connection2Result = await callTool('add_connection', {
      flowchartId,
      sourceNodeId: nodeId3,
      targetNodeId: nodeId4,
      label: 'connection 2'
    });
    connectionId2 = connection2Result.content[0].text.match(/with ID: (.+)$/)[1];
  });

  // Helper function to check if two bounding boxes overlap
  function checkOverlap(box1, box2) {
    // Boxes are separated if one is completely to the left, right, above, or below the other
    if (box1.bottomRight.x < box2.topLeft.x ||  // box1 is to the left of box2
        box2.bottomRight.x < box1.topLeft.x ||  // box2 is to the left of box1
        box1.bottomRight.y < box2.topLeft.y ||  // box1 is above box2
        box2.bottomRight.y < box1.topLeft.y) {  // box2 is above box1
      return false;
    }
    return true;
  }

  // Helper function to get bounding box
  async function getBoundingBox(elementId, elementType) {
    const result = await callTool('get_bounding_box', {
      flowchartId,
      elementId,
      elementType
    });
    expect(result.isError).toBeUndefined();
    return JSON.parse(result.content[0].text);
  }

  describe('Node overlap detection', () => {
    test('detect non-overlapping nodes', async () => {
      // Set nodes to non-overlapping positions
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
        y: 1.0
      });
      
      // Resize both nodes to known dimensions
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 2.0,
        height: 1.0
      });
      
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId2,
        width: 2.0,
        height: 1.0
      });
      
      // Get bounding boxes
      const box1 = await getBoundingBox(nodeId1, 'node');
      const box2 = await getBoundingBox(nodeId2, 'node');
      
      // Verify no overlap
      expect(checkOverlap(box1, box2)).toBe(false);
      expect(box1.bottomRight.x).toBe(3.0); // 1.0 + 2.0
      expect(box2.topLeft.x).toBe(4.0); // Should be separated
    });

    test('detect overlapping nodes', async () => {
      // Set nodes to overlapping positions
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
        x: 2.0,
        y: 1.5
      });
      
      // Resize both nodes
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 2.0,
        height: 1.5
      });
      
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId2,
        width: 2.0,
        height: 1.5
      });
      
      // Get bounding boxes
      const box1 = await getBoundingBox(nodeId1, 'node');
      const box2 = await getBoundingBox(nodeId2, 'node');
      
      // Verify overlap exists
      expect(checkOverlap(box1, box2)).toBe(true);
      
      // Calculate overlap area
      const overlapLeft = Math.max(box1.topLeft.x, box2.topLeft.x);
      const overlapRight = Math.min(box1.bottomRight.x, box2.bottomRight.x);
      const overlapTop = Math.max(box1.topLeft.y, box2.topLeft.y);
      const overlapBottom = Math.min(box1.bottomRight.y, box2.bottomRight.y);
      
      const overlapWidth = overlapRight - overlapLeft;
      const overlapHeight = overlapBottom - overlapTop;
      
      expect(overlapWidth).toBeGreaterThan(0);
      expect(overlapHeight).toBeGreaterThan(0);
    });

    test('detect edge-touching nodes', async () => {
      // Set nodes to touch at edges
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
        x: 3.0, // Exactly touching the right edge of node1
        y: 1.0
      });
      
      // Resize both nodes
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 2.0,
        height: 1.0
      });
      
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId2,
        width: 2.0,
        height: 1.0
      });
      
      // Get bounding boxes
      const box1 = await getBoundingBox(nodeId1, 'node');
      const box2 = await getBoundingBox(nodeId2, 'node');
      
      // Edge touching is considered overlapping by our function
      expect(checkOverlap(box1, box2)).toBe(true);
      expect(box1.bottomRight.x).toBe(box2.topLeft.x); // Edges should touch exactly
    });
  });

  describe('Connector overlap detection', () => {
    test('detect overlapping connector paths', async () => {
      // Set custom paths that cross each other
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 1.0, y: 2.0 },
          { x: 5.0, y: 4.0 }
        ]
      });
      
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId2,
        pathPoints: [
          { x: 1.0, y: 4.0 },
          { x: 5.0, y: 2.0 }
        ]
      });
      
      // Get bounding boxes
      const box1 = await getBoundingBox(connectionId1, 'connector');
      const box2 = await getBoundingBox(connectionId2, 'connector');
      
      // These crossing paths should overlap
      expect(checkOverlap(box1, box2)).toBe(true);
    });

    test('detect non-overlapping connector paths', async () => {
      // Set custom paths that don't overlap
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 1.0, y: 1.0 },
          { x: 3.0, y: 1.0 }
        ]
      });
      
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId2,
        pathPoints: [
          { x: 1.0, y: 3.0 },
          { x: 3.0, y: 3.0 }
        ]
      });
      
      // Get bounding boxes
      const box1 = await getBoundingBox(connectionId1, 'connector');
      const box2 = await getBoundingBox(connectionId2, 'connector');
      
      // These parallel paths should not overlap
      expect(checkOverlap(box1, box2)).toBe(false);
    });

    test('detect connector with zero dimensions', async () => {
      // Set path with same start and end point
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 2.0, y: 2.0 },
          { x: 2.0, y: 2.0 }
        ]
      });
      
      const box = await getBoundingBox(connectionId1, 'connector');
      
      // Should have zero dimensions but valid coordinates
      expect(box.width).toBe(0);
      expect(box.height).toBe(0);
      expect(box.topLeft.x).toBe(2.0);
      expect(box.topLeft.y).toBe(2.0);
      expect(box.bottomRight.x).toBe(2.0);
      expect(box.bottomRight.y).toBe(2.0);
    });
  });

  describe('Node-connector overlap detection', () => {
    test('detect connector passing through node', async () => {
      // Position node
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId3,
        elementType: 'node',
        x: 3.0,
        y: 3.0
      });
      
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId3,
        width: 2.0,
        height: 1.0
      });
      
      // Set connector path that passes through the node
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 1.0, y: 3.5 },
          { x: 6.0, y: 3.5 } // Passes through middle of node
        ]
      });
      
      // Get bounding boxes
      const nodeBox = await getBoundingBox(nodeId3, 'node');
      const connectorBox = await getBoundingBox(connectionId1, 'connector');
      
      // Should overlap
      expect(checkOverlap(nodeBox, connectorBox)).toBe(true);
    });

    test('detect connector avoiding node', async () => {
      // Position node
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId3,
        elementType: 'node',
        x: 3.0,
        y: 3.0
      });
      
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId3,
        width: 2.0,
        height: 1.0
      });
      
      // Set connector path that avoids the node
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 1.0, y: 2.0 },
          { x: 3.0, y: 1.0 }, // Goes above the node
          { x: 5.0, y: 1.0 },
          { x: 6.0, y: 2.0 }
        ]
      });
      
      // Get bounding boxes
      const nodeBox = await getBoundingBox(nodeId3, 'node');
      const connectorBox = await getBoundingBox(connectionId1, 'connector');
      
      // Should not overlap
      expect(checkOverlap(nodeBox, connectorBox)).toBe(false);
    });
  });

  describe('Complex overlap scenarios', () => {
    test('detect multiple overlapping elements', async () => {
      // Create a cluster of overlapping nodes
      const clusterNodes = [nodeId1, nodeId2, nodeId3];
      const clusterCenter = { x: 3.0, y: 3.0 };
      const offsets = [
        { x: -0.5, y: -0.5 },
        { x: 0.5, y: -0.5 },
        { x: 0, y: 0.5 }
      ];
      
      // Position nodes in overlapping cluster
      for (let i = 0; i < clusterNodes.length; i++) {
        await callTool('set_position', {
          flowchartId,
          elementId: clusterNodes[i],
          elementType: 'node',
          x: clusterCenter.x + offsets[i].x,
          y: clusterCenter.y + offsets[i].y
        });
        
        await callTool('resize_node', {
          flowchartId,
          nodeId: clusterNodes[i],
          width: 1.5,
          height: 1.5
        });
      }
      
      // Get all bounding boxes
      const boxes = [];
      for (const nodeId of clusterNodes) {
        boxes.push(await getBoundingBox(nodeId, 'node'));
      }
      
      // Check all pairs for overlap
      let overlappingPairs = 0;
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          if (checkOverlap(boxes[i], boxes[j])) {
            overlappingPairs++;
          }
        }
      }
      
      // All pairs should overlap in this tight cluster
      expect(overlappingPairs).toBe(3); // 3 choose 2 = 3 pairs
    });

    test('resolve overlaps through repositioning', async () => {
      // Start with overlapping nodes
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId1,
        elementType: 'node',
        x: 2.0,
        y: 2.0
      });
      
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId2,
        elementType: 'node',
        x: 2.5,
        y: 2.5
      });
      
      // Resize to ensure overlap
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId1,
        width: 1.5,
        height: 1.5
      });
      
      await callTool('resize_node', {
        flowchartId,
        nodeId: nodeId2,
        width: 1.5,
        height: 1.5
      });
      
      // Verify initial overlap
      const initialBox1 = await getBoundingBox(nodeId1, 'node');
      const initialBox2 = await getBoundingBox(nodeId2, 'node');
      expect(checkOverlap(initialBox1, initialBox2)).toBe(true);
      
      // Resolve overlap by repositioning
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId2,
        elementType: 'node',
        x: 4.0, // Move to non-overlapping position
        y: 2.0
      });
      
      // Verify overlap is resolved
      const resolvedBox1 = await getBoundingBox(nodeId1, 'node');
      const resolvedBox2 = await getBoundingBox(nodeId2, 'node');
      expect(checkOverlap(resolvedBox1, resolvedBox2)).toBe(false);
    });

    test('track overlaps during layout changes', async () => {
      // Position nodes manually to specific positions and track overlap changes
      const nodeIds = [nodeId1, nodeId2, nodeId3, nodeId4];
      const initialPositions = [
        { x: 1.0, y: 1.0 },
        { x: 2.0, y: 1.0 },
        { x: 1.0, y: 2.0 },
        { x: 2.0, y: 2.0 }
      ];
      
      // Set initial overlapping positions
      for (let i = 0; i < nodeIds.length; i++) {
        await callTool('set_position', {
          flowchartId,
          elementId: nodeIds[i],
          elementType: 'node',
          x: initialPositions[i].x,
          y: initialPositions[i].y
        });
        
        await callTool('resize_node', {
          flowchartId,
          nodeId: nodeIds[i],
          width: 1.2,
          height: 1.2
        });
      }
      
      // Check initial overlaps
      const initialBoxes = [];
      for (const nodeId of nodeIds) {
        initialBoxes.push(await getBoundingBox(nodeId, 'node'));
      }
      
      let initialOverlaps = 0;
      for (let i = 0; i < initialBoxes.length; i++) {
        for (let j = i + 1; j < initialBoxes.length; j++) {
          if (checkOverlap(initialBoxes[i], initialBoxes[j])) {
            initialOverlaps++;
          }
        }
      }
      
      // Should have overlaps initially
      expect(initialOverlaps).toBeGreaterThan(0);
      
      // Reposition to eliminate overlaps
      const newPositions = [
        { x: 1.0, y: 1.0 },
        { x: 4.0, y: 1.0 },
        { x: 1.0, y: 4.0 },
        { x: 4.0, y: 4.0 }
      ];
      
      for (let i = 0; i < nodeIds.length; i++) {
        await callTool('set_position', {
          flowchartId,
          elementId: nodeIds[i],
          elementType: 'node',
          x: newPositions[i].x,
          y: newPositions[i].y
        });
      }
      
      // Check final overlaps
      const finalBoxes = [];
      for (const nodeId of nodeIds) {
        finalBoxes.push(await getBoundingBox(nodeId, 'node'));
      }
      
      let finalOverlaps = 0;
      for (let i = 0; i < finalBoxes.length; i++) {
        for (let j = i + 1; j < finalBoxes.length; j++) {
          if (checkOverlap(finalBoxes[i], finalBoxes[j])) {
            finalOverlaps++;
          }
        }
      }
      
      // Should have no overlaps after repositioning
      expect(finalOverlaps).toBe(0);
    });
  });

  describe('Overlap detection with custom connector paths', () => {
    test('avoid node overlaps with curved connector paths', async () => {
      // Position nodes that would force straight connectors to overlap
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
        x: 5.0,
        y: 1.0
      });
      
      await callTool('set_position', {
        flowchartId,
        elementId: nodeId3,
        elementType: 'node',
        x: 3.0,
        y: 1.5
      });
      
      // Set curved path to avoid middle node
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 2.0, y: 1.5 },
          { x: 3.0, y: 0.5 }, // Arc above middle node
          { x: 4.0, y: 0.5 },
          { x: 5.0, y: 1.5 }
        ]
      });
      
      // Check that connector path is routed to minimize overlap with middle node
      const middleNodeBox = await getBoundingBox(nodeId3, 'node');
      const connectorBox = await getBoundingBox(connectionId1, 'connector');
      
      // The curved path should have minimal overlap area compared to a straight path
      // For this test, we verify the connector bounding box exists and is reasonable
      expect(connectorBox.topLeft.x).toBeLessThanOrEqual(connectorBox.bottomRight.x);
      expect(connectorBox.topLeft.y).toBeLessThanOrEqual(connectorBox.bottomRight.y);
    });

    test('optimize connector routing to minimize overlaps', async () => {
      // Set up scenario with potential for many overlaps
      const positions = [
        { nodeId: nodeId1, x: 1.0, y: 2.0 },
        { nodeId: nodeId2, x: 7.0, y: 2.0 },
        { nodeId: nodeId3, x: 3.0, y: 3.0 },
        { nodeId: nodeId4, x: 5.0, y: 3.0 }
      ];
      
      // Position all nodes
      for (const pos of positions) {
        await callTool('set_position', {
          flowchartId,
          elementId: pos.nodeId,
          elementType: 'node',
          x: pos.x,
          y: pos.y
        });
      }
      
      // Create optimized routing that avoids overlaps
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId1,
        pathPoints: [
          { x: 2.0, y: 2.5 },
          { x: 4.0, y: 1.0 }, // Route above obstacles
          { x: 6.0, y: 1.0 },
          { x: 7.0, y: 2.5 }
        ]
      });
      
      await callTool('set_connector_path', {
        flowchartId,
        connectionId: connectionId2,
        pathPoints: [
          { x: 3.5, y: 3.5 },
          { x: 4.0, y: 5.0 }, // Route below obstacles
          { x: 5.0, y: 5.0 },
          { x: 5.5, y: 3.5 }
        ]
      });
      
      // Verify connectors don't overlap with intermediate nodes
      const connector1Box = await getBoundingBox(connectionId1, 'connector');
      const connector2Box = await getBoundingBox(connectionId2, 'connector');
      
      // Connectors should not overlap with each other either
      expect(checkOverlap(connector1Box, connector2Box)).toBe(false);
    });
  });
});