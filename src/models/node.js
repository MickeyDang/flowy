class FlowchartNode {
  constructor(id, text, x = 0, y = 0, width = 1, height = 0.5, shapeType = 'rectangle', primaryColor = '#0277BD') {
    const Validator = require('../utils/validation');
    
    try {
      this.id = Validator.validateId(id, 'node ID');
      this.text = Validator.validateText(text, 'node text');
      this.x = typeof x === 'number' && Number.isFinite(x) ? x : 0;
      this.y = typeof y === 'number' && Number.isFinite(y) ? y : 0;
      this.width = typeof width === 'number' && Number.isFinite(width) ? width : 1;
      this.height = typeof height === 'number' && Number.isFinite(height) ? height : 0.5;
      this.shapeType = Validator.validateShapeType(shapeType);
      this.primaryColor = Validator.validateHexColor(primaryColor);
      this.properties = {};
      this.createdAt = new Date();
      this.calculateDimensions();
    } catch (error) {
      throw error;
    }
  }
  
  setText(text) {
    const Validator = require('../utils/validation');
    
    try {
      this.text = Validator.validateText(text, 'node text');
      this.calculateDimensions();
    } catch (error) {
      throw error;
    }
  }
  
  setShapeType(shapeType) {
    const Validator = require('../utils/validation');
    
    try {
      this.shapeType = Validator.validateShapeType(shapeType);
    } catch (error) {
      throw error;
    }
  }
  
  setPrimaryColor(primaryColor) {
    const Validator = require('../utils/validation');
    
    try {
      this.primaryColor = Validator.validateHexColor(primaryColor);
    } catch (error) {
      throw error;
    }
  }
  
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
  
  setSize(width, height) {
    this.width = width;
    this.height = height;
  }
  
  setProperty(key, value) {
    this.properties[key] = value;
  }
  
  getProperty(key) {
    return this.properties[key];
  }
  
  removeProperty(key) {
    delete this.properties[key];
  }
  
  calculateDimensions() {
    this.width = this.text.length * 0.15;
    this.height = 0.5;
  }
  
  toPptxShape() {
    const ColorUtils = require('../utils/color-utils');
    
    const fillColor = ColorUtils.toPptxColor(ColorUtils.generateFillColor(this.primaryColor));
    const borderColor = ColorUtils.toPptxColor(ColorUtils.generateBorderColor(this.primaryColor));
    
    const baseShape = {
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height,
      fill: { color: fillColor },
      line: { color: borderColor, width: 1 },
      text: this.text,
      options: {
        fontSize: 12,
        fontFace: 'Arial',
        color: '000000',
        align: 'center',
        valign: 'middle',
        shrinkText: true,
        isTextBox: true,
      },
    };

    switch (this.shapeType) {
      case 'rectangle':
        baseShape.shape = 'rect';
        break;
      case 'oval':
        baseShape.shape = 'ellipse';
        break;
      case 'diamond':
        baseShape.shape = 'custGeom';
        baseShape.custGeom = [
          { type: 'moveTo', pt: [0.5, 0] },
          { type: 'lnTo', pt: [1, 0.5] },
          { type: 'lnTo', pt: [0.5, 1] },
          { type: 'lnTo', pt: [0, 0.5] },
          { type: 'close' }
        ];
        break;
      default:
        baseShape.shape = 'rect';
    }

    return baseShape;
  }
  
  toJSON() {
    return {
      id: this.id,
      text: this.text,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      shapeType: this.shapeType,
      primaryColor: this.primaryColor,
      properties: this.properties,
      createdAt: this.createdAt,
    };
  }
  
  static fromJSON(data) {
    const node = new FlowchartNode(data.id, data.text, data.x, data.y, data.width, data.height, data.shapeType, data.primaryColor);
    node.properties = data.properties || {};
    
    if (data.createdAt) {
      node.createdAt = new Date(data.createdAt);
    }
    
    return node;
  }
}

module.exports = FlowchartNode;