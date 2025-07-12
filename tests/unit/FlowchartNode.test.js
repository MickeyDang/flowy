const FlowchartNode = require('../../src/models/node');
const { ValidationError } = require('../../src/utils/errors');

describe('FlowchartNode', () => {
  describe('constructor', () => {
    test('creates node with valid parameters', () => {
      const node = new FlowchartNode('test-id', 'Test Node', 1, 2);
      
      expect(node.id).toBe('test-id');
      expect(node.text).toBe('Test Node');
      expect(node.x).toBe(1);
      expect(node.y).toBe(2);
      expect(node.width).toBeCloseTo(1.35, 2); // text.length * 0.15 = 9 * 0.15 = 1.35
      expect(node.height).toBe(0.5);
      expect(node.shapeType).toBe('rectangle'); // default
      expect(node.createdAt).toBeInstanceOf(Date);
    });

    test('creates node with custom shape type', () => {
      const node = new FlowchartNode('test-id', 'Test Node', 1, 2, 1, 0.5, 'oval');
      
      expect(node.shapeType).toBe('oval');
    });

    test('creates node with custom primary color', () => {
      const node = new FlowchartNode('test-id', 'Test Node', 1, 2, 1, 0.5, 'rectangle', '#FF5722');
      
      expect(node.primaryColor).toBe('#FF5722');
    });

    test('uses default primary color when not specified', () => {
      const node = new FlowchartNode('test-id', 'Test Node');
      
      expect(node.primaryColor).toBe('#0277BD');
    });

    test('applies default position values', () => {
      const node = new FlowchartNode('test-id', 'Test');
      
      expect(node.x).toBe(0);
      expect(node.y).toBe(0);
      expect(node.width).toBe(0.6); // 4 * 0.15
      expect(node.height).toBe(0.5);
    });

    test('throws ValidationError for invalid ID', () => {
      expect(() => new FlowchartNode('', 'Test')).toThrow(ValidationError);
      expect(() => new FlowchartNode(null, 'Test')).toThrow(ValidationError);
      expect(() => new FlowchartNode(123, 'Test')).toThrow(ValidationError);
    });

    test('throws ValidationError for invalid text', () => {
      expect(() => new FlowchartNode('test-id', '')).toThrow(ValidationError);
      expect(() => new FlowchartNode('test-id', null)).toThrow(ValidationError);
      expect(() => new FlowchartNode('test-id', 123)).toThrow(ValidationError);
    });

    test('throws ValidationError for invalid shape type', () => {
      expect(() => new FlowchartNode('test-id', 'Test', 0, 0, 1, 0.5, 'invalid')).toThrow(ValidationError);
      expect(() => new FlowchartNode('test-id', 'Test', 0, 0, 1, 0.5, '')).toThrow(ValidationError);
      expect(() => new FlowchartNode('test-id', 'Test', 0, 0, 1, 0.5, null)).toThrow(ValidationError);
    });

    test('throws ValidationError for invalid primary color', () => {
      expect(() => new FlowchartNode('test-id', 'Test', 0, 0, 1, 0.5, 'rectangle', 'invalid')).toThrow(ValidationError);
      expect(() => new FlowchartNode('test-id', 'Test', 0, 0, 1, 0.5, 'rectangle', '')).toThrow(ValidationError);
      expect(() => new FlowchartNode('test-id', 'Test', 0, 0, 1, 0.5, 'rectangle', 'FF0000')).toThrow(ValidationError);
    });

    test('handles invalid numeric values gracefully', () => {
      const node = new FlowchartNode('test-id', 'Test', 'invalid', null);
      
      expect(node.x).toBe(0);
      expect(node.y).toBe(0);
    });
  });

  describe('setText', () => {
    test('updates text and recalculates dimensions', () => {
      const node = new FlowchartNode('test-id', 'Original');
      const originalWidth = node.width;
      
      node.setText('New longer text');
      
      expect(node.text).toBe('New longer text');
      expect(node.width).toBeGreaterThan(originalWidth);
      expect(node.height).toBe(0.5);
    });

    test('throws ValidationError for invalid text', () => {
      const node = new FlowchartNode('test-id', 'Original');
      
      expect(() => node.setText('')).toThrow(ValidationError);
      expect(() => node.setText(null)).toThrow(ValidationError);
    });

    test('trims whitespace from text', () => {
      const node = new FlowchartNode('test-id', 'Original');
      
      node.setText('  Trimmed Text  ');
      
      expect(node.text).toBe('Trimmed Text');
    });
  });

  describe('setShapeType', () => {
    test('updates shape type to valid values', () => {
      const node = new FlowchartNode('test-id', 'Test');
      expect(node.shapeType).toBe('rectangle');
      
      node.setShapeType('oval');
      expect(node.shapeType).toBe('oval');
      
      node.setShapeType('diamond');
      expect(node.shapeType).toBe('diamond');
      
      node.setShapeType('rectangle');
      expect(node.shapeType).toBe('rectangle');
    });

    test('throws ValidationError for invalid shape type', () => {
      const node = new FlowchartNode('test-id', 'Test');
      
      expect(() => node.setShapeType('invalid')).toThrow(ValidationError);
      expect(() => node.setShapeType('')).toThrow(ValidationError);
      expect(() => node.setShapeType(null)).toThrow(ValidationError);
    });
  });

  describe('setPrimaryColor', () => {
    test('updates primary color to valid hex colors', () => {
      const node = new FlowchartNode('test-id', 'Test');
      expect(node.primaryColor).toBe('#0277BD');
      
      node.setPrimaryColor('#FF5722');
      expect(node.primaryColor).toBe('#FF5722');
      
      node.setPrimaryColor('#F00');
      expect(node.primaryColor).toBe('#F00');
      
      node.setPrimaryColor('#abc123');
      expect(node.primaryColor).toBe('#ABC123');
    });

    test('throws ValidationError for invalid primary color', () => {
      const node = new FlowchartNode('test-id', 'Test');
      
      expect(() => node.setPrimaryColor('invalid')).toThrow(ValidationError);
      expect(() => node.setPrimaryColor('')).toThrow(ValidationError);
      expect(() => node.setPrimaryColor('FF0000')).toThrow(ValidationError);
      expect(() => node.setPrimaryColor(null)).toThrow(ValidationError);
    });
  });

  describe('setPosition', () => {
    test('updates position coordinates', () => {
      const node = new FlowchartNode('test-id', 'Test');
      
      node.setPosition(5, 10);
      
      expect(node.x).toBe(5);
      expect(node.y).toBe(10);
    });
  });

  describe('setSize', () => {
    test('updates size dimensions', () => {
      const node = new FlowchartNode('test-id', 'Test');
      
      node.setSize(3, 1.5);
      
      expect(node.width).toBe(3);
      expect(node.height).toBe(1.5);
    });
  });

  describe('calculateDimensions', () => {
    test('calculates width based on text length', () => {
      const node = new FlowchartNode('test-id', 'Short');
      expect(node.width).toBe(0.75); // 5 * 0.15
      
      node.text = 'Much longer text content';
      node.calculateDimensions();
      expect(node.width).toBeCloseTo(3.6, 1); // 24 * 0.15
    });

    test('always sets height to 0.5', () => {
      const node = new FlowchartNode('test-id', 'Any text length here');
      expect(node.height).toBe(0.5);
      
      node.calculateDimensions();
      expect(node.height).toBe(0.5);
    });
  });

  describe('toPptxShape', () => {
    test('returns correct PPTX shape configuration for rectangle with default color', () => {
      const node = new FlowchartNode('test-id', 'Test Node', 2, 3);
      const shape = node.toPptxShape();
      
      expect(shape.x).toBe(2);
      expect(shape.y).toBe(3);
      expect(shape.w).toBeCloseTo(1.35, 2);
      expect(shape.h).toBe(0.5);
      expect(shape.shape).toBe('rect');
      expect(shape.text).toBe('Test Node');
      expect(shape.fill.color).toBe('26AEFD'); // Lightened version of #0277BD
      expect(shape.line.color).toBe('0277BD'); // Primary color
      expect(shape.line.width).toBe(1);
    });

    test('returns correct PPTX shape configuration with custom color', () => {
      const node = new FlowchartNode('test-id', 'Test Node', 2, 3, 1, 0.5, 'rectangle', '#FF5722');
      const shape = node.toPptxShape();
      
      expect(shape.fill.color).toBe('FFA58A'); // Lightened version of #FF5722
      expect(shape.line.color).toBe('FF5722'); // Primary color
    });

    test('returns correct PPTX shape configuration for oval', () => {
      const node = new FlowchartNode('test-id', 'Test Node', 2, 3, 1, 0.5, 'oval');
      const shape = node.toPptxShape();
      
      expect(shape.shape).toBe('ellipse');
      expect(shape.x).toBe(2);
      expect(shape.y).toBe(3);
    });

    test('returns correct PPTX shape configuration for diamond', () => {
      const node = new FlowchartNode('test-id', 'Test Node', 2, 3, 1, 0.5, 'diamond');
      const shape = node.toPptxShape();
      
      expect(shape.shape).toBe('custGeom');
      expect(shape.custGeom).toBeDefined();
      expect(shape.custGeom).toEqual([
        { type: 'moveTo', pt: [0.5, 0] },
        { type: 'lnTo', pt: [1, 0.5] },
        { type: 'lnTo', pt: [0.5, 1] },
        { type: 'lnTo', pt: [0, 0.5] },
        { type: 'close' }
      ]);
    });
  });

  describe('toJSON', () => {
    test('serializes node to JSON object', () => {
      const node = new FlowchartNode('test-id', 'Test Node', 1, 2);
      const json = node.toJSON();
      
      expect(json).toEqual({
        id: 'test-id',
        text: 'Test Node',
        x: 1,
        y: 2,
        width: expect.closeTo(1.35, 2),
        height: 0.5,
        shapeType: 'rectangle',
        primaryColor: '#0277BD',
        properties: {},
        createdAt: node.createdAt,
      });
    });

    test('serializes node with custom shape type', () => {
      const node = new FlowchartNode('test-id', 'Test Node', 1, 2, 1, 0.5, 'oval');
      const json = node.toJSON();
      
      expect(json.shapeType).toBe('oval');
    });

    test('serializes node with custom primary color', () => {
      const node = new FlowchartNode('test-id', 'Test Node', 1, 2, 1, 0.5, 'rectangle', '#FF5722');
      const json = node.toJSON();
      
      expect(json.primaryColor).toBe('#FF5722');
    });
  });

  describe('fromJSON', () => {
    test('creates node from JSON data', () => {
      const data = {
        id: 'test-id',
        text: 'Test Node',
        x: 1,
        y: 2,
        width: 1.5,
        height: 0.5,
        shapeType: 'oval',
        primaryColor: '#FF5722',
        properties: { custom: 'value' },
        createdAt: new Date().toISOString(),
      };
      
      const node = FlowchartNode.fromJSON(data);
      
      expect(node.id).toBe('test-id');
      expect(node.text).toBe('Test Node');
      expect(node.x).toBe(1);
      expect(node.y).toBe(2);
      expect(node.shapeType).toBe('oval');
      expect(node.primaryColor).toBe('#FF5722');
      expect(node.properties.custom).toBe('value');
      expect(node.createdAt).toBeInstanceOf(Date);
    });

    test('creates node with default shape type when not provided', () => {
      const data = {
        id: 'test-id',
        text: 'Test Node',
        x: 1,
        y: 2,
        width: 1.5,
        height: 0.5,
        properties: {},
        createdAt: new Date().toISOString(),
      };
      
      const node = FlowchartNode.fromJSON(data);
      
      expect(node.shapeType).toBe('rectangle');
    });

    test('creates node with default primary color when not provided', () => {
      const data = {
        id: 'test-id',
        text: 'Test Node',
        x: 1,
        y: 2,
        width: 1.5,
        height: 0.5,
        shapeType: 'rectangle',
        properties: {},
        createdAt: new Date().toISOString(),
      };
      
      const node = FlowchartNode.fromJSON(data);
      
      expect(node.primaryColor).toBe('#0277BD');
    });
  });
});