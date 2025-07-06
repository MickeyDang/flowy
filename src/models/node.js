class FlowchartNode {
  constructor(id, text, x = 0, y = 0, width = 1, height = 0.5) {
    const Validator = require('../utils/validation');
    
    try {
      this.id = Validator.validateId(id, 'node ID');
      this.text = Validator.validateText(text, 'node text');
      this.x = typeof x === 'number' && Number.isFinite(x) ? x : 0;
      this.y = typeof y === 'number' && Number.isFinite(y) ? y : 0;
      this.width = typeof width === 'number' && Number.isFinite(width) ? width : 1;
      this.height = typeof height === 'number' && Number.isFinite(height) ? height : 0.5;
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
    return {
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height,
      fill: { color: 'E1F5FE' },
      line: { color: '0277BD', width: 1 },
      text: this.text,
      options: {
        fontSize: 12,
        fontFace: 'Arial',
        color: '000000',
        align: 'center',
        valign: 'middle',
      },
    };
  }
  
  toJSON() {
    return {
      id: this.id,
      text: this.text,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      properties: this.properties,
      createdAt: this.createdAt,
    };
  }
  
  static fromJSON(data) {
    const node = new FlowchartNode(data.id, data.text, data.x, data.y, data.width, data.height);
    node.properties = data.properties || {};
    
    if (data.createdAt) {
      node.createdAt = new Date(data.createdAt);
    }
    
    return node;
  }
}

module.exports = FlowchartNode;