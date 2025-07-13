const FlowchartPresentationGenerator = require('../../src/utils/pptx-generator');
const Flowchart = require('../../src/models/flowchart');
const FlowchartNode = require('../../src/models/node');

// Mock PptxGenJS
jest.mock('pptxgenjs');

describe('PowerPoint Generation Workflow Integration', () => {
  let generator, flowchart;

  beforeEach(() => {
    generator = new FlowchartPresentationGenerator();
    flowchart = new Flowchart('workflow-test', 'Complete Workflow Test', 12, 8);
    
    // Create a complex flowchart with multiple nodes and connection types
    const nodes = [
      new FlowchartNode('start', 'Start Process', 1, 1),
      new FlowchartNode('decision', 'Decision Point', 5, 1),
      new FlowchartNode('process1', 'Process A', 2, 4),
      new FlowchartNode('process2', 'Process B', 7, 4),
      new FlowchartNode('end', 'End Process', 4.5, 6.5)
    ];
    
    // Set proper sizes
    nodes[0].setSize(2, 1);
    nodes[1].setSize(2.5, 1);
    nodes[2].setSize(2, 1);
    nodes[3].setSize(2, 1);
    nodes[4].setSize(2, 1);
    
    nodes.forEach(node => flowchart.nodes.set(node.id, node));
  });

  test('generates complete presentation with mixed connection types', async () => {
    // Add straight connection
    const straightId = flowchart.addConnection('start', 'decision', 'evaluate');
    
    // Add custom path connections
    const customId1 = flowchart.addConnection('decision', 'process1', 'yes');
    const customConnection1 = flowchart.getConnection(customId1);
    customConnection1.pathPoints = [
      { x: 6.25, y: 1.5 },
      { x: 4.0, y: 2.5 },
      { x: 3.0, y: 4.5 }
    ];
    
    const customId2 = flowchart.addConnection('decision', 'process2', 'no');
    const customConnection2 = flowchart.getConnection(customId2);
    customConnection2.pathPoints = [
      { x: 6.25, y: 1.5 },
      { x: 8.0, y: 2.5 },
      { x: 8.0, y: 4.5 }
    ];
    
    // Add convergence connections
    const conv1Id = flowchart.addConnection('process1', 'end', 'complete');
    const conv2Id = flowchart.addConnection('process2', 'end', 'complete');
    
    // Generate the presentation
    const result = await generator.generatePresentation(flowchart, 'workflow-test');
    
    expect(result).toBeDefined();
    expect(result.filename).toBe('workflow-test.pptx');
    expect(result.buffer).toBeDefined();
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
  });

  test('handles presentation generation with all shape types', async () => {
    // Add connections to create various shape types
    const connections = [
      { source: 'start', target: 'decision', label: 'straight line' },
      { source: 'decision', target: 'process1', label: 'custom path 1' },
      { source: 'decision', target: 'process2', label: 'custom path 2' },
      { source: 'process1', target: 'end', label: 'convergence 1' },
      { source: 'process2', target: 'end', label: 'convergence 2' }
    ];
    
    connections.forEach((conn, index) => {
      const connectionId = flowchart.addConnection(conn.source, conn.target, conn.label);
      
      // Add custom paths to specific connections
      if (index === 1) {
        const connection = flowchart.getConnection(connectionId);
        connection.pathPoints = [
          { x: 6.25, y: 1.5 },
          { x: 4.0, y: 2.5 },
          { x: 3.0, y: 4.5 }
        ];
      } else if (index === 2) {
        const connection = flowchart.getConnection(connectionId);
        connection.pathPoints = [
          { x: 6.25, y: 1.5 },
          { x: 8.0, y: 2.5 },
          { x: 8.0, y: 4.5 }
        ];
      }
    });
    
    const pptx = generator.createPresentation('Complete Workflow', flowchart);
    const slide = generator.addFlowchartSlide(flowchart);
    
    // Verify all node shapes are created
    const nodeShapes = slide.shapes.filter(shape => shape.type === 'rect');
    expect(nodeShapes).toHaveLength(5);
    
    // Verify connection shapes are created
    const connectionShapes = slide.shapes.filter(shape => 
      shape.type === 'line' || shape.type === 'custGeom'
    );
    expect(connectionShapes).toHaveLength(5);
    
    // Verify we have both straight lines and custom geometry
    const straightLines = slide.shapes.filter(shape => shape.type === 'line');
    const customGeometry = slide.shapes.filter(shape => shape.type === 'custGeom');
    
    expect(straightLines.length).toBeGreaterThan(0);
    expect(customGeometry.length).toBeGreaterThan(0);
    
    // Verify all nodes have correct text properties
    const nodeTexts = slide.texts.filter(text => 
      ['Start Process', 'Decision Point', 'Process A', 'Process B', 'End Process'].includes(text.text)
    );
    expect(nodeTexts).toHaveLength(5);
    
    nodeTexts.forEach(textElement => {
      expect(textElement.options).toHaveProperty('shrinkText', true);
      expect(textElement.options).toHaveProperty('isTextBox', true);
      expect(textElement.options).toHaveProperty('fontSize', 12);
      expect(textElement.options).toHaveProperty('fontFace', 'Arial');
    });
  });

  test('validates arrow head positioning on all connection types', async () => {
    // Create connections with different orientations
    const testConnections = [
      { source: 'start', target: 'decision', label: 'horizontal' },
      { source: 'decision', target: 'process1', label: 'diagonal down-left' },
      { source: 'decision', target: 'process2', label: 'diagonal down-right' }
    ];
    
    testConnections.forEach((conn, index) => {
      const connectionId = flowchart.addConnection(conn.source, conn.target, conn.label);
      
      // Add custom path for diagonal connections
      if (index > 0) {
        const connection = flowchart.getConnection(connectionId);
        connection.pathPoints = [
          { x: 6.25, y: 1.5 },
          { x: index === 1 ? 4.0 : 8.0, y: 2.5 },
          { x: index === 1 ? 3.0 : 8.0, y: 4.5 }
        ];
      }
    });
    
    const pptx = generator.createPresentation('Arrow Test', flowchart);
    const slide = generator.addFlowchartSlide(flowchart);
    
    // Verify all connection shapes have arrow heads
    const connectionShapes = slide.shapes.filter(shape => 
      shape.type === 'line' || shape.type === 'custGeom'
    );
    
    connectionShapes.forEach(shape => {
      expect(shape.options).toHaveProperty('line');
      expect(shape.options.line).toHaveProperty('endArrowType', 'triangle');
      expect(shape.options.line).toHaveProperty('color', '666666');
      expect(shape.options.line).toHaveProperty('width', 2);
    });
  });

  test('handles edge cases and error conditions', async () => {
    // Test empty flowchart
    const emptyFlowchart = new Flowchart('empty', 'Empty Flowchart', 10, 7.5);
    const pptx = generator.createPresentation('Empty Test', emptyFlowchart);
    const slide = generator.addFlowchartSlide(emptyFlowchart);
    
    expect(slide.shapes).toHaveLength(0);
    expect(slide.texts).toHaveLength(2); // Title + "No nodes" message
    
    // Test single node
    const singleFlowchart = new Flowchart('single', 'Single Node', 10, 7.5);
    const singleNode = new FlowchartNode('only', 'Only Node', 4, 3);
    singleNode.setSize(2, 1);
    singleFlowchart.nodes.set('only', singleNode);
    
    const singlePptx = generator.createPresentation('Single Test', singleFlowchart);
    const singleSlide = generator.addFlowchartSlide(singleFlowchart);
    
    expect(singleSlide.shapes).toHaveLength(1);
    expect(singleSlide.shapes[0].type).toBe('rect');
    expect(singleSlide.texts).toHaveLength(2); // Title + node text
  });

  test('validates custom geometry path generation', async () => {
    // Add connection with complex path
    const connectionId = flowchart.addConnection('start', 'end', 'complex path');
    const connection = flowchart.getConnection(connectionId);
    
    // Create a complex curved path
    connection.pathPoints = [
      { x: 2.0, y: 1.5 },
      { x: 1.0, y: 3.0 },
      { x: 3.0, y: 5.0 },
      { x: 6.0, y: 6.0 },
      { x: 5.5, y: 7.0 }
    ];
    
    const pptx = generator.createPresentation('Complex Path Test', flowchart);
    const slide = generator.addFlowchartSlide(flowchart);
    
    const customShape = slide.shapes.find(shape => shape.type === 'custGeom');
    expect(customShape).toBeDefined();
    
    // Validate custom geometry structure
    expect(customShape.options).toHaveProperty('custGeom');
    expect(customShape.options.custGeom).toHaveProperty('pathLst');
    expect(customShape.options.custGeom.pathLst).toHaveLength(1);
    
    const pathDef = customShape.options.custGeom.pathLst[0];
    expect(pathDef).toHaveProperty('pathData');
    expect(pathDef.pathData).toMatch(/^M .* L .* L .* L .* L .*$/);
    
    // Validate bounding box
    expect(customShape.options.x).toBe(1.0); // min x
    expect(customShape.options.y).toBe(2.5); // min y + 1 (slide offset)
    expect(customShape.options.w).toBe(5.0); // max x - min x
    expect(customShape.options.h).toBe(5.5); // max y - min y
  });

  test('ensures consistent styling across all shape types', async () => {
    // Add various connection types
    const straightId = flowchart.addConnection('start', 'decision', 'straight');
    const customId = flowchart.addConnection('decision', 'process1', 'custom');
    
    const customConnection = flowchart.getConnection(customId);
    customConnection.pathPoints = [
      { x: 6.25, y: 1.5 },
      { x: 4.0, y: 2.5 },
      { x: 3.0, y: 4.5 }
    ];
    
    const pptx = generator.createPresentation('Styling Test', flowchart);
    const slide = generator.addFlowchartSlide(flowchart);
    
    // Check node styling consistency
    const nodeShapes = slide.shapes.filter(shape => shape.type === 'rect');
    nodeShapes.forEach(shape => {
      expect(shape.options.fill).toHaveProperty('color', '26AEFD');
      expect(shape.options.line).toHaveProperty('color', '0277BD');
      expect(shape.options.line).toHaveProperty('width', 1);
    });
    
    // Check connection styling consistency
    const connectionShapes = slide.shapes.filter(shape => 
      shape.type === 'line' || shape.type === 'custGeom'
    );
    connectionShapes.forEach(shape => {
      expect(shape.options.line).toHaveProperty('color', '666666');
      expect(shape.options.line).toHaveProperty('width', 2);
      expect(shape.options.line).toHaveProperty('endArrowType', 'triangle');
    });
    
    // Check text styling consistency
    const nodeTexts = slide.texts.filter(text => 
      ['Start Process', 'Decision Point', 'Process A', 'Process B', 'End Process'].includes(text.text)
    );
    nodeTexts.forEach(textElement => {
      expect(textElement.options.fontSize).toBe(12);
      expect(textElement.options.fontFace).toBe('Arial');
      expect(textElement.options.color).toBe('000000');
      expect(textElement.options.align).toBe('center');
      expect(textElement.options.valign).toBe('middle');
    });
  });

  test('handles performance with large flowcharts', async () => {
    // Create a large flowchart for performance testing
    const largeFlowchart = new Flowchart('large', 'Large Flowchart', 16, 12);
    
    // Add many nodes
    const nodeCount = 20;
    for (let i = 0; i < nodeCount; i++) {
      const node = new FlowchartNode(
        `node_${i}`,
        `Process ${i}`,
        (i % 5) * 3 + 1,
        Math.floor(i / 5) * 2 + 1
      );
      node.setSize(2, 1);
      largeFlowchart.nodes.set(`node_${i}`, node);
    }
    
    // Add many connections with mix of straight and custom paths
    for (let i = 0; i < nodeCount - 1; i++) {
      const connectionId = largeFlowchart.addConnection(`node_${i}`, `node_${i + 1}`, `conn_${i}`);
      
      // Add custom path to some connections
      if (i % 3 === 0) {
        const connection = largeFlowchart.getConnection(connectionId);
        connection.pathPoints = [
          { x: (i % 5) * 3 + 2, y: Math.floor(i / 5) * 2 + 1.5 },
          { x: (i % 5) * 3 + 2.5, y: Math.floor(i / 5) * 2 + 2.5 },
          { x: ((i + 1) % 5) * 3 + 2, y: Math.floor((i + 1) / 5) * 2 + 1.5 }
        ];
      }
    }
    
    const startTime = Date.now();
    const result = await generator.generatePresentation(largeFlowchart, 'large-test');
    const endTime = Date.now();
    
    expect(result).toBeDefined();
    expect(result.filename).toBe('large-test.pptx');
    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
  });

  test('validates final presentation structure', async () => {
    // Add a complete workflow
    const connections = [
      { source: 'start', target: 'decision', label: 'begin' },
      { source: 'decision', target: 'process1', label: 'path A' },
      { source: 'decision', target: 'process2', label: 'path B' },
      { source: 'process1', target: 'end', label: 'finish A' },
      { source: 'process2', target: 'end', label: 'finish B' }
    ];
    
    connections.forEach((conn, index) => {
      const connectionId = flowchart.addConnection(conn.source, conn.target, conn.label);
      
      // Add custom paths to create variety
      if (index === 1 || index === 2) {
        const connection = flowchart.getConnection(connectionId);
        connection.pathPoints = [
          { x: 6.25, y: 1.5 },
          { x: index === 1 ? 4.0 : 8.0, y: 2.5 },
          { x: index === 1 ? 3.0 : 8.0, y: 4.5 }
        ];
      }
    });
    
    const result = await generator.generatePresentation(flowchart, 'final-test');
    
    // Validate overall structure
    expect(result.filename).toBe('final-test.pptx');
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.length).toBeGreaterThan(0);
    
    // Validate presentation was created through the generator
    expect(generator.pptx).toBeDefined();
    expect(generator.pptx.slides).toHaveLength(2); // Title slide + flowchart slide
    
    const flowchartSlide = generator.pptx.slides[1];
    expect(flowchartSlide.shapes).toHaveLength(10); // 5 nodes + 5 connections
    expect(flowchartSlide.texts).toHaveLength(11); // Title + 5 node texts + 5 connection labels
  });
});