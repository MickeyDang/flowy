class Flowchart {
  constructor(id, title, width = 10, height = 7.5) {
    this.id = id;
    this.title = title;
    this.nodes = new Map();
    this.connections = [];
    this.layout = null;
    this.slideWidth = width;
    this.slideHeight = height;
    this.createdAt = new Date();
  }
  
  setLayout(layout) {
    this.layout = layout;
  }
  
  getLayout() {
    return this.layout;
  }
  
  addNode(text, positionHint = { x: 0, y: 0 }, shapeType = 'rectangle', primaryColor = '#0277BD') {
    const FlowchartNode = require('./node');
    const Validator = require('../utils/validation');
    
    try {
      const validatedText = Validator.validateText(text, 'node text');
      const validatedPosition = Validator.validatePositionHint(positionHint);
      const validatedShapeType = Validator.validateShapeType(shapeType);
      const validatedPrimaryColor = Validator.validateHexColor(primaryColor);
      
      const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const node = new FlowchartNode(nodeId, validatedText, validatedPosition.x, validatedPosition.y, 1, 0.5, validatedShapeType, validatedPrimaryColor);
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
      
      // Count connections to be removed
      const connectionsToRemove = this.connections.filter(
        conn => conn.sourceId === validatedNodeId || conn.targetId === validatedNodeId
      );
      const removedConnectionsCount = connectionsToRemove.length;
      
      this.nodes.delete(validatedNodeId);
      this.connections = this.connections.filter(
        conn => conn.sourceId !== validatedNodeId && conn.targetId !== validatedNodeId
      );
      
      return removedConnectionsCount;
    } catch (error) {
      throw error;
    }
  }
  
  addConnection(sourceId, targetId, label = '', pathPoints = null) {
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
      
      // Generate unique connection ID
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const connection = {
        id: connectionId,
        sourceId: validatedSourceId,
        targetId: validatedTargetId,
        label: validatedLabel,
        pathPoints: pathPoints
      };
      
      this.connections.push(connection);
      return connectionId;
    } catch (error) {
      throw error;
    }
  }
  
  removeConnection(sourceId, targetId) {
    this.connections = this.connections.filter(
      conn => !(conn.sourceId === sourceId && conn.targetId === targetId)
    );
  }
  
  removeConnectionById(connectionId) {
    const Validator = require('../utils/validation');
    const { ConnectionNotFoundError } = require('../utils/errors');
    
    try {
      const validatedConnectionId = Validator.validateId(connectionId, 'connectionId');
      
      const connectionIndex = this.connections.findIndex(conn => conn.id === validatedConnectionId);
      if (connectionIndex === -1) {
        throw new ConnectionNotFoundError(validatedConnectionId);
      }
      
      this.connections.splice(connectionIndex, 1);
    } catch (error) {
      throw error;
    }
  }
  
  getConnection(connectionId) {
    return this.connections.find(conn => conn.id === connectionId);
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
    const width = data.slideWidth !== undefined ? data.slideWidth : 10;
    const height = data.slideHeight !== undefined ? data.slideHeight : 7.5;
    const flowchart = new Flowchart(data.id, data.title, width, height);
    
    if (data.nodes && Array.isArray(data.nodes)) {
      data.nodes.forEach(nodeData => {
        const node = FlowchartNode.fromJSON(nodeData);
        flowchart.nodes.set(node.id, node);
      });
    }
    
    if (data.connections) {
      // Ensure backward compatibility with old connection format
      flowchart.connections = data.connections.map(conn => {
        if (!conn.id) {
          // Generate ID for legacy connections
          return {
            id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sourceId: conn.sourceId,
            targetId: conn.targetId,
            label: conn.label || '',
            pathPoints: conn.pathPoints || null
          };
        }
        return conn;
      });
    }
    
    if (data.layout) {
      flowchart.setLayout(data.layout);
    }
    
    if (data.createdAt) {
      flowchart.createdAt = new Date(data.createdAt);
    }
    
    return flowchart;
  }
}

module.exports = Flowchart;