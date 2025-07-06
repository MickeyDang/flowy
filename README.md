# Flowy - Flowchart to PDF Generator

A Node.js application that creates flowcharts and exports them to PDF documents. Built with MCP (Model Context Protocol) integration for seamless use with Claude Desktop.

## Features

- **Create Flowcharts**: Build flowcharts with custom nodes and connections
- **Auto Layout**: Automatically arrange nodes using hierarchical layout algorithm
- **PDF Export**: Generate professional PDF documents (.pdf)
- **MCP Integration**: Use directly from Claude Desktop with the MCP server
- **Interactive Demo**: Run a complete user login flow example

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Clone or download the project:
   ```bash
   git clone <repository-url>
   cd flowy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the demo to test the installation:
   ```bash
   npm run demo
   ```

## Usage

### Command Line Demo

Run the interactive demo that creates a complete user login flow:

```bash
npm run demo
```

This demo will:
1. Create a new flowchart titled "User Login Flow"
2. Add 5 nodes (Login Screen, Validate Credentials, Success Page, Error Page, Forgot Password)
3. Connect the nodes with labeled arrows
4. Apply automatic hierarchical layout
5. Export to PDF (.pdf file)

### MCP Server Integration

The application includes an MCP server that can be integrated with Claude Desktop for interactive flowchart creation.

#### Available MCP Tools

- `create_flowchart` - Create a new empty flowchart
- `add_node` - Add a node to an existing flowchart
- `add_connection` - Add a connection between two nodes
- `auto_layout` - Apply automatic layout to a flowchart
- `export_pdf` - Export a flowchart to PDF

## Claude Desktop MCP Setup

To use Flowy with Claude Desktop, add the following configuration to your Claude Desktop settings:

### 1. Locate Claude Desktop Config

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

### 2. Add MCP Server Configuration

Add or update the `mcpServers` section in your config file:

```json
{
  "mcpServers": {
    "flowy": {
      "command": "node",
      "args": ["src/server.js"],
      "cwd": "/path/to/your/flowy/directory"
    }
  }
}
```

**Important**: Replace `/path/to/your/flowy/directory` with the actual absolute path to your Flowy installation directory.

### 3. Restart Claude Desktop

After saving the configuration, restart Claude Desktop completely for the changes to take effect.

### 4. Verify MCP Integration

In Claude Desktop, you should now be able to:

1. Create flowcharts by asking Claude to use the flowchart tools
2. Add nodes and connections interactively
3. Apply auto layout
4. Export to PDF

Example conversation:
```
You: Create a flowchart for a simple approval process
Claude: I'll create a flowchart for an approval process using the available tools...
```

## Example Usage with Claude Desktop

Once the MCP server is configured, you can interact with Claude Desktop like this:

```
Create a flowchart called "Order Processing" with these steps:
1. Receive Order
2. Check Inventory
3. Process Payment
4. Ship Order
5. Send Confirmation

Connect them in sequence and add a branch from Check Inventory to "Out of Stock" if inventory is low.
```

Claude will use the MCP tools to:
- Create the flowchart
- Add all the nodes
- Create the connections
- Apply auto layout
- Export to PDF

## API Reference

### Flowchart Tools

#### `create_flowchart(title)`
- **title**: String - Title of the flowchart
- **Returns**: Flowchart ID

#### `add_node(flowchartId, text, positionHint)`
- **flowchartId**: String - ID of the flowchart
- **text**: String - Text content of the node
- **positionHint**: Object - Optional position hint `{x: number, y: number}`
- **Returns**: Node ID

#### `add_connection(flowchartId, sourceNodeId, targetNodeId, label)`
- **flowchartId**: String - ID of the flowchart
- **sourceNodeId**: String - ID of the source node
- **targetNodeId**: String - ID of the target node
- **label**: String - Optional label for the connection

#### `auto_layout(flowchartId, algorithm)`
- **flowchartId**: String - ID of the flowchart
- **algorithm**: String - Layout algorithm ("hierarchical")

#### `export_pdf(flowchartId, filename)`
- **flowchartId**: String - ID of the flowchart
- **filename**: String - Output filename (without extension)
- **Returns**: Text response with PDF download link and base64 data

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Starting the MCP Server

```bash
# Start the MCP server
npm start

# Start with auto-reload for development
npm run dev
```

## File Structure

```
flowy/
├── src/
│   ├── models/
│   │   ├── flowchart.js      # Flowchart model
│   │   └── node.js           # Node model
│   ├── tools/
│   │   ├── flowchart-tools.js # MCP tool implementations
│   │   └── layout-engine.js   # Layout algorithm
│   ├── utils/
│   │   ├── pdf-generator.js   # PDF generation
│   │   ├── validation.js      # Input validation
│   │   └── errors.js          # Custom error classes
│   └── server.js              # MCP server entry point
├── tests/                     # Test files
├── demo.js                    # Interactive demo script
├── package.json
└── README.md
```

## Troubleshooting

### Common Issues

1. **MCP Server not connecting**: Ensure the path in `claude_desktop_config.json` is correct and absolute
2. **PDF generation fails**: Check that all required dependencies are installed
3. **Layout issues**: Verify that nodes are properly connected before applying layout

### Debug Mode

To enable debug logging, set the `DEBUG` environment variable:

```bash
DEBUG=flowy npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

ISC License - see LICENSE file for details.