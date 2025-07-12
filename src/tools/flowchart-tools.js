// Import all handlers
const createFlowchartHandler = require('./handlers/create-flowchart');
const addNodeHandler = require('./handlers/add-node');
const removeNodeHandler = require('./handlers/remove-node');
const addConnectionHandler = require('./handlers/add-connection');
const removeConnectionHandler = require('./handlers/remove-connection');
const exportPdfHandler = require('./handlers/export-pdf');
const exportSvgHandler = require('./handlers/export-svg');
const setPositionHandler = require('./handlers/set-position');
const resizeNodeHandler = require('./handlers/resize-node');
const getBoundingBoxHandler = require('./handlers/get-bounding-box');
const getConnectorPointsHandler = require('./handlers/get-connector-points');
const setConnectorPathHandler = require('./handlers/set-connector-path');
const suggestConnectorPathHandler = require('./handlers/suggest-connector-path');
const setNodeShapeHandler = require('./handlers/set-node-shape');

// Maintain the flowcharts Map at module level for all handlers to access
const flowcharts = new Map();

// Aggregate all tool definitions
const tools = [
  createFlowchartHandler.toolDefinition,
  addNodeHandler.toolDefinition,
  removeNodeHandler.toolDefinition,
  addConnectionHandler.toolDefinition,
  removeConnectionHandler.toolDefinition,
  exportPdfHandler.toolDefinition,
  exportSvgHandler.toolDefinition,
  setPositionHandler.toolDefinition,
  resizeNodeHandler.toolDefinition,
  getBoundingBoxHandler.toolDefinition,
  getConnectorPointsHandler.toolDefinition,
  setConnectorPathHandler.toolDefinition,
  suggestConnectorPathHandler.toolDefinition,
  setNodeShapeHandler.toolDefinition,
];

// Create handler map for routing
const handlers = {
  'create_flowchart': createFlowchartHandler.handler,
  'add_node': addNodeHandler.handler,
  'remove_node': removeNodeHandler.handler,
  'add_connection': addConnectionHandler.handler,
  'remove_connection': removeConnectionHandler.handler,
  'export_pdf': exportPdfHandler.handler,
  'export_svg': exportSvgHandler.handler,
  'set_position': setPositionHandler.handler,
  'resize_node': resizeNodeHandler.handler,
  'get_bounding_box': getBoundingBoxHandler.handler,
  'get_connector_points': getConnectorPointsHandler.handler,
  'set_connector_path': setConnectorPathHandler.handler,
  'suggest_connector_path': suggestConnectorPathHandler.handler,
  'set_node_shape': setNodeShapeHandler.handler,
};

function getTools() {
  return tools;
}

async function callTool(name, args) {
  const handler = handlers[name];
  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }
  
  return await handler(args, flowcharts);
}

module.exports = {
  getTools,
  callTool,
};