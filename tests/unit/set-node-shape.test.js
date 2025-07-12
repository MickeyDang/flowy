const { callTool } = require('../../src/tools/flowchart-tools');

describe('set_node_shape', () => {
  let flowchartId;
  let nodeId;

  beforeEach(async () => {
    // Create a flowchart
    const createResult = await callTool('create_flowchart', {
      title: 'Shape Test Flowchart',
    });
    flowchartId = createResult.content[0].text.match(/ID: (\S+)/)[1];

    // Add a node
    const addNodeResult = await callTool('add_node', {
      flowchartId,
      text: 'Test Node',
    });
    nodeId = addNodeResult.content[0].text.match(/ID: (\S+)/)[1];
  });

  describe('successful shape changes', () => {
    test('changes node shape to oval', async () => {
      const result = await callTool('set_node_shape', {
        flowchartId,
        nodeId,
        shapeType: 'oval',
      });

      expect(result.content[0].text).toContain('shape changed to oval');
    });

    test('changes node shape to diamond', async () => {
      const result = await callTool('set_node_shape', {
        flowchartId,
        nodeId,
        shapeType: 'diamond',
      });

      expect(result.content[0].text).toContain('shape changed to diamond');
    });

    test('changes node shape to rectangle', async () => {
      const result = await callTool('set_node_shape', {
        flowchartId,
        nodeId,
        shapeType: 'rectangle',
      });

      expect(result.content[0].text).toContain('shape changed to rectangle');
    });
  });

  describe('validation errors', () => {
    test('handles non-existent flowchart', async () => {
      const result = await callTool('set_node_shape', {
        flowchartId: 'non-existent',
        nodeId,
        shapeType: 'oval',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Flowchart with ID "non-existent" not found');
    });

    test('handles non-existent node', async () => {
      const result = await callTool('set_node_shape', {
        flowchartId,
        nodeId: 'non-existent',
        shapeType: 'oval',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Node with ID "non-existent" not found');
    });

    test('handles invalid shape type', async () => {
      const result = await callTool('set_node_shape', {
        flowchartId,
        nodeId,
        shapeType: 'invalid',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });

    test('handles empty shape type', async () => {
      const result = await callTool('set_node_shape', {
        flowchartId,
        nodeId,
        shapeType: '',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });
  });

  describe('missing parameters', () => {
    test('handles missing flowchartId', async () => {
      const result = await callTool('set_node_shape', {
        nodeId,
        shapeType: 'oval',
      });

      expect(result.isError).toBe(true);
    });

    test('handles missing nodeId', async () => {
      const result = await callTool('set_node_shape', {
        flowchartId,
        shapeType: 'oval',
      });

      expect(result.isError).toBe(true);
    });

    test('handles missing shapeType', async () => {
      const result = await callTool('set_node_shape', {
        flowchartId,
        nodeId,
      });

      expect(result.isError).toBe(true);
    });
  });
});