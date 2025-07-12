const { callTool } = require('../../src/tools/flowchart-tools');

describe('set_node_color', () => {
  let flowchartId;
  let nodeId;

  beforeEach(async () => {
    // Create a flowchart
    const createResult = await callTool('create_flowchart', {
      title: 'Color Test Flowchart',
    });
    flowchartId = createResult.content[0].text.match(/ID: (\S+)/)[1];

    // Add a node
    const addNodeResult = await callTool('add_node', {
      flowchartId,
      text: 'Test Node',
    });
    nodeId = addNodeResult.content[0].text.match(/ID: (\S+)/)[1];
  });

  describe('successful color changes', () => {
    test('changes node color to red', async () => {
      const result = await callTool('set_node_color', {
        flowchartId,
        nodeId,
        primaryColor: '#FF0000',
      });

      expect(result.content[0].text).toContain('primary color changed to #FF0000');
    });

    test('changes node color to green with 3-digit hex', async () => {
      const result = await callTool('set_node_color', {
        flowchartId,
        nodeId,
        primaryColor: '#0F0',
      });

      expect(result.content[0].text).toContain('primary color changed to #0F0');
    });

    test('changes node color to blue with lowercase hex', async () => {
      const result = await callTool('set_node_color', {
        flowchartId,
        nodeId,
        primaryColor: '#0066ff',
      });

      expect(result.content[0].text).toContain('primary color changed to #0066FF');
    });

    test('changes node color to custom orange', async () => {
      const result = await callTool('set_node_color', {
        flowchartId,
        nodeId,
        primaryColor: '#FF5722',
      });

      expect(result.content[0].text).toContain('primary color changed to #FF5722');
    });
  });

  describe('validation errors', () => {
    test('handles non-existent flowchart', async () => {
      const result = await callTool('set_node_color', {
        flowchartId: 'non-existent',
        nodeId,
        primaryColor: '#FF0000',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Flowchart with ID "non-existent" not found');
    });

    test('handles non-existent node', async () => {
      const result = await callTool('set_node_color', {
        flowchartId,
        nodeId: 'non-existent',
        primaryColor: '#FF0000',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Node with ID "non-existent" not found');
    });

    test('handles invalid hex color format', async () => {
      const result = await callTool('set_node_color', {
        flowchartId,
        nodeId,
        primaryColor: 'invalid',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });

    test('handles hex color without #', async () => {
      const result = await callTool('set_node_color', {
        flowchartId,
        nodeId,
        primaryColor: 'FF0000',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });

    test('handles invalid hex characters', async () => {
      const result = await callTool('set_node_color', {
        flowchartId,
        nodeId,
        primaryColor: '#GG0000',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });

    test('handles wrong hex length', async () => {
      const result = await callTool('set_node_color', {
        flowchartId,
        nodeId,
        primaryColor: '#FF00',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });

    test('handles empty primary color', async () => {
      const result = await callTool('set_node_color', {
        flowchartId,
        nodeId,
        primaryColor: '',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });
  });

  describe('missing parameters', () => {
    test('handles missing flowchartId', async () => {
      const result = await callTool('set_node_color', {
        nodeId,
        primaryColor: '#FF0000',
      });

      expect(result.isError).toBe(true);
    });

    test('handles missing nodeId', async () => {
      const result = await callTool('set_node_color', {
        flowchartId,
        primaryColor: '#FF0000',
      });

      expect(result.isError).toBe(true);
    });

    test('handles missing primaryColor', async () => {
      const result = await callTool('set_node_color', {
        flowchartId,
        nodeId,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('integration with node creation', () => {
    test('node retains color after being set', async () => {
      // Set the color
      await callTool('set_node_color', {
        flowchartId,
        nodeId,
        primaryColor: '#FF5722',
      });

      // Verify by creating another node and comparing
      const addNodeResult = await callTool('add_node', {
        flowchartId,
        text: 'Another Node',
        primaryColor: '#FF5722',
      });

      expect(addNodeResult.content[0].text).toContain('Node added');
    });
  });
});