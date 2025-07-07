class FlowchartNotFoundError extends Error {
  constructor(flowchartId) {
    super(`Flowchart with ID "${flowchartId}" not found`);
    this.name = 'FlowchartNotFoundError';
    this.flowchartId = flowchartId;
  }
}

class NodeNotFoundError extends Error {
  constructor(nodeId) {
    super(`Node with ID "${nodeId}" not found`);
    this.name = 'NodeNotFoundError';
    this.nodeId = nodeId;
  }
}

class FileGenerationError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'FileGenerationError';
    this.cause = cause;
  }
}

class ValidationError extends Error {
  constructor(field, value, message) {
    super(`Validation error for ${field}: ${message}`);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

class ConnectionNotFoundError extends Error {
  constructor(connectionId) {
    super(`Connection with ID "${connectionId}" not found`);
    this.name = 'ConnectionNotFoundError';
    this.connectionId = connectionId;
  }
}

module.exports = {
  FlowchartNotFoundError,
  NodeNotFoundError,
  FileGenerationError,
  ValidationError,
  ConnectionNotFoundError,
};