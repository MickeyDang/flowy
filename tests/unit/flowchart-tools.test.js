const { getTools, callTool } = require('../../src/tools/flowchart-tools');
const { FlowchartNotFoundError, NodeNotFoundError, ValidationError } = require('../../src/utils/errors');

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

// Mock the LayoutEngine
jest.mock('../../src/tools/layout-engine', () => ({
  calculateLayout: jest.fn(() => ({
    nodes: new Map(),
    connections: [],
  })),
}));

describe('flowchart-tools', () => {
  describe('getTools', () => {
    test('returns array of tool definitions', () => {
      const tools = getTools();
      
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBe(5);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('create_flowchart');
      expect(toolNames).toContain('add_node');
      expect(toolNames).toContain('add_connection');
      expect(toolNames).toContain('auto_layout');
      expect(toolNames).toContain('export_pdf');
    });

    test('each tool has required properties', () => {
      const tools = getTools();
      
      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema).toHaveProperty('type');
        expect(tool.inputSchema).toHaveProperty('properties');
        expect(tool.inputSchema).toHaveProperty('required');
      });
    });
  });

  describe('create_flowchart', () => {
    test('creates flowchart with valid title', async () => {
      const result = await callTool('create_flowchart', { title: 'Test Flowchart' });
      
      expect(result.content[0].text).toMatch(/Flowchart created with ID:/);
      expect(result.isError).toBeUndefined();
    });

    test('handles validation errors', async () => {
      const result = await callTool('create_flowchart', { title: '' });
      
      expect(result.content[0].text).toMatch(/Error creating flowchart:/);
      expect(result.isError).toBe(true);
    });

    test('trims and validates title', async () => {
      const result = await callTool('create_flowchart', { title: '  Valid Title  ' });
      
      expect(result.content[0].text).toMatch(/Flowchart created with ID:/);
      expect(result.isError).toBeUndefined();
    });
  });

  describe('add_node', () => {
    let flowchartId;

    beforeEach(async () => {
      const result = await callTool('create_flowchart', { title: 'Test Flowchart' });
      flowchartId = result.content[0].text.match(/ID: (.+)$/)[1];
    });

    test('adds node to existing flowchart', async () => {
      const result = await callTool('add_node', {
        flowchartId,
        text: 'Test Node',
        positionHint: { x: 1, y: 2 },
      });
      
      expect(result.content[0].text).toMatch(/Node added with ID:/);
      expect(result.isError).toBeUndefined();
    });

    test('adds node without position hint', async () => {
      const result = await callTool('add_node', {
        flowchartId,
        text: 'Test Node',
      });
      
      expect(result.content[0].text).toMatch(/Node added with ID:/);
      expect(result.isError).toBeUndefined();
    });

    test('handles non-existent flowchart', async () => {
      const result = await callTool('add_node', {
        flowchartId: 'non-existent',
        text: 'Test Node',
      });
      
      expect(result.content[0].text).toMatch(/Error adding node:/);
      expect(result.isError).toBe(true);
    });

    test('handles invalid text', async () => {
      const result = await callTool('add_node', {
        flowchartId,
        text: '',
      });
      
      expect(result.content[0].text).toMatch(/Error adding node:/);
      expect(result.isError).toBe(true);
    });

    test('handles invalid position hint', async () => {
      const result = await callTool('add_node', {
        flowchartId,
        text: 'Test Node',
        positionHint: { x: 'invalid' },
      });
      
      expect(result.content[0].text).toMatch(/Error adding node:/);
      expect(result.isError).toBe(true);
    });
  });

  describe('add_connection', () => {
    let flowchartId, nodeId1, nodeId2;

    beforeEach(async () => {
      const flowchartResult = await callTool('create_flowchart', { title: 'Test Flowchart' });
      flowchartId = flowchartResult.content[0].text.match(/ID: (.+)$/)[1];
      
      const node1Result = await callTool('add_node', { flowchartId, text: 'Node 1' });
      nodeId1 = node1Result.content[0].text.match(/ID: (.+)$/)[1];
      
      const node2Result = await callTool('add_node', { flowchartId, text: 'Node 2' });
      nodeId2 = node2Result.content[0].text.match(/ID: (.+)$/)[1];
    });

    test('adds connection between existing nodes', async () => {
      const result = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
        label: 'test connection',
      });
      
      expect(result.content[0].text).toMatch(/Connection added from .+ to .+/);
      expect(result.isError).toBeUndefined();
    });

    test('adds connection without label', async () => {
      const result = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
      });
      
      expect(result.content[0].text).toMatch(/Connection added from .+ to .+/);
      expect(result.isError).toBeUndefined();
    });

    test('handles non-existent flowchart', async () => {
      const result = await callTool('add_connection', {
        flowchartId: 'non-existent',
        sourceNodeId: nodeId1,
        targetNodeId: nodeId2,
      });
      
      expect(result.content[0].text).toMatch(/Error adding connection:/);
      expect(result.isError).toBe(true);
    });

    test('handles non-existent source node', async () => {
      const result = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: 'non-existent',
        targetNodeId: nodeId2,
      });
      
      expect(result.content[0].text).toMatch(/Error adding connection:/);
      expect(result.isError).toBe(true);
    });

    test('handles non-existent target node', async () => {
      const result = await callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeId1,
        targetNodeId: 'non-existent',
      });
      
      expect(result.content[0].text).toMatch(/Error adding connection:/);
      expect(result.isError).toBe(true);
    });
  });

  describe('auto_layout', () => {
    let flowchartId;

    beforeEach(async () => {
      const result = await callTool('create_flowchart', { title: 'Test Flowchart' });
      flowchartId = result.content[0].text.match(/ID: (.+)$/)[1];
    });

    test('applies hierarchical layout', async () => {
      const result = await callTool('auto_layout', {
        flowchartId,
        algorithm: 'hierarchical',
      });
      
      expect(result.content[0].text).toMatch(/Layout applied to .+ using hierarchical algorithm/);
      expect(result.isError).toBeUndefined();
    });

    test('handles non-existent flowchart', async () => {
      const result = await callTool('auto_layout', {
        flowchartId: 'non-existent',
        algorithm: 'hierarchical',
      });
      
      expect(result.content[0].text).toMatch(/Error applying layout:/);
      expect(result.isError).toBe(true);
    });

    test('handles invalid algorithm', async () => {
      const result = await callTool('auto_layout', {
        flowchartId,
        algorithm: 'invalid',
      });
      
      expect(result.content[0].text).toMatch(/Error applying layout:/);
      expect(result.isError).toBe(true);
    });
  });

  describe('export_pdf', () => {
    let flowchartId;

    beforeEach(async () => {
      const result = await callTool('create_flowchart', { title: 'Test Flowchart' });
      flowchartId = result.content[0].text.match(/ID: (.+)$/)[1];
    });

    test('exports flowchart to PDF', async () => {
      const result = await callTool('export_pdf', {
        flowchartId,
        filename: 'test-output',
      });
      
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('PDF generated successfully');
      expect(result.content[0].text).toContain('test-output.pdf');
      expect(result.content[0].text).toContain('Download PDF');
      expect(result.isError).toBeUndefined();
    });

    test('handles non-existent flowchart', async () => {
      const result = await callTool('export_pdf', {
        flowchartId: 'non-existent',
        filename: 'test-output',
      });
      
      expect(result.content[0].text).toMatch(/Error exporting PDF:/);
      expect(result.isError).toBe(true);
    });

    test('handles invalid filename', async () => {
      const result = await callTool('export_pdf', {
        flowchartId,
        filename: 'invalid<>filename',
      });
      
      expect(result.content[0].text).toMatch(/Error exporting PDF:/);
      expect(result.isError).toBe(true);
    });
  });

  describe('callTool', () => {
    test('throws error for unknown tool', async () => {
      await expect(callTool('unknown_tool', {})).rejects.toThrow('Unknown tool: unknown_tool');
    });
  });
});