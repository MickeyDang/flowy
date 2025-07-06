class Flowchart {
  constructor(id, title) {
    this.id = id;
    this.title = title;
    this.nodes = new Map();
    this.connections = [];
    this.layout = null;
    this.slideWidth = 10;
    this.slideHeight = 7.5;
    this.createdAt = new Date();
  }
  
  setLayout(layout) {
    this.layout = layout;
  }
  
  getLayout() {
    return this.layout;
  }
  
  addNode(text, positionHint = { x: 0, y: 0 }) {
    const FlowchartNode = require('./node');
    const Validator = require('../utils/validation');
    
    try {
      const validatedText = Validator.validateText(text, 'node text');
      const validatedPosition = Validator.validatePositionHint(positionHint);
      
      const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const node = new FlowchartNode(nodeId, validatedText, validatedPosition.x, validatedPosition.y);
      this.nodes.set(nodeId, node);
      return nodeId;
    } catch (error) {
      throw error;
    }
  }
  
  removeNode(nodeId) {
    const Validator = require('../utils/validation');
    const { NodeNotFoundError } = require('../utils/errors');
    
    try {
      const validatedNodeId = Validator.validateId(nodeId, 'nodeId');
      
      if (!this.nodes.has(validatedNodeId)) {
        throw new NodeNotFoundError(validatedNodeId);
      }
      
      this.nodes.delete(validatedNodeId);
      this.connections = this.connections.filter(
        conn => conn.sourceId !== validatedNodeId && conn.targetId !== validatedNodeId
      );
    } catch (error) {
      throw error;
    }
  }
  
  addConnection(sourceId, targetId, label = '') {
    const Validator = require('../utils/validation');
    const { NodeNotFoundError } = require('../utils/errors');
    
    try {
      const validatedSourceId = Validator.validateId(sourceId, 'sourceId');
      const validatedTargetId = Validator.validateId(targetId, 'targetId');
      const validatedLabel = label ? Validator.validateText(label, 'connection label') : '';
      
      if (!this.nodes.has(validatedSourceId)) {
        throw new NodeNotFoundError(validatedSourceId);
      }
      
      if (!this.nodes.has(validatedTargetId)) {
        throw new NodeNotFoundError(validatedTargetId);
      }
      
      this.connections.push({ 
        sourceId: validatedSourceId, 
        targetId: validatedTargetId, 
        label: validatedLabel 
      });
    } catch (error) {
      throw error;
    }
  }
  
  removeConnection(sourceId, targetId) {
    this.connections = this.connections.filter(
      conn => !(conn.sourceId === sourceId && conn.targetId === targetId)
    );
  }
  
  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }
  
  getConnections() {
    return this.connections;
  }
  
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      nodes: Array.from(this.nodes.values()).map(node => node.toJSON()),
      connections: this.connections,
      layout: this.layout,
      slideWidth: this.slideWidth,
      slideHeight: this.slideHeight,
      createdAt: this.createdAt,
    };
  }
  
  static fromJSON(data) {
    const FlowchartNode = require('./node');
    const flowchart = new Flowchart(data.id, data.title);
    
    if (data.nodes && Array.isArray(data.nodes)) {
      data.nodes.forEach(nodeData => {
        const node = FlowchartNode.fromJSON(nodeData);
        flowchart.nodes.set(node.id, node);
      });
    }
    
    if (data.connections) {
      flowchart.connections = data.connections;
    }
    
    if (data.layout) {
      flowchart.setLayout(data.layout);
    }
    
    if (data.slideWidth !== undefined) {
      flowchart.slideWidth = data.slideWidth;
    }
    
    if (data.slideHeight !== undefined) {
      flowchart.slideHeight = data.slideHeight;
    }
    
    if (data.createdAt) {
      flowchart.createdAt = new Date(data.createdAt);
    }
    
    return flowchart;
  }
}

module.exports = Flowchart;