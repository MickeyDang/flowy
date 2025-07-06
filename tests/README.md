# Test Suite Documentation

This directory contains comprehensive tests for the Flowchart PowerPoint Generator MCP server.

## Test Structure

### Unit Tests (`tests/unit/`)

1. **FlowchartNode.test.js** - Tests for the FlowchartNode model
   - Constructor validation and defaults
   - Text setting and dimension calculation
   - Position and size manipulation
   - PPTX shape configuration
   - JSON serialization/deserialization

2. **Flowchart.test.js** - Tests for the Flowchart model
   - Flowchart creation and initialization
   - Node management (add/remove)
   - Connection management (add/remove)
   - Input validation and error handling
   - JSON serialization/deserialization

3. **Positioning.test.js** - Tests for positioning and layout algorithms
   - Hierarchical layout calculation
   - Root node identification
   - Level assignment for nodes
   - Connection point calculation
   - Node positioning within levels

4. **LayoutEngine.test.js** - Tests for the layout engine
   - Layout calculation orchestration
   - Error handling for invalid inputs
   - Connection path generation
   - Integration with positioning utilities

5. **flowchart-tools.test.js** - Tests for MCP tool handlers
   - Tool definition validation
   - All 5 MCP tools (create, add_node, add_connection, auto_layout, export_pptx)
   - Error handling and MCP response format
   - Input validation for all parameters

6. **validation.test.js** - Tests for input validation utilities
   - ID validation (string, length, trimming)
   - Text validation (content, length limits)
   - Filename validation (characters, sanitization)
   - Position hint validation (numeric bounds)
   - Algorithm validation (allowed values)

### Integration Tests (`tests/integration/`)

1. **complete-workflow.test.js** - End-to-end workflow tests
   - Complete flowchart creation process
   - Multi-step workflow with all tools
   - Error recovery and graceful degradation
   - Edge cases (empty flowcharts, single nodes)
   - Structure validation after creation

### Test Infrastructure

1. **__mocks__/pptxgenjs.js** - Mock implementation of PptxGenJS library
   - Simulates PowerPoint generation without file system operations
   - Tracks slide creation and content addition
   - Enables testing of PPTX generation logic

2. **setup.js** - Global test setup and teardown
   - Mock management between tests
   - Console output suppression during tests

3. **jest.config.js** - Jest configuration
   - Test environment setup
   - Coverage reporting
   - Test matching patterns

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

Current coverage metrics:
- **Overall**: 91.2% statement coverage
- **Models**: 96% statement coverage
- **Tools**: 100% statement coverage
- **Utils**: 85.3% statement coverage

## Test Features

### Mocking Strategy
- **PptxGenJS**: Fully mocked for file generation testing
- **Console**: Suppressed during tests to reduce noise
- **Positioning**: Partially mocked in layout engine tests

### Error Testing
- Custom error classes (FlowchartNotFoundError, NodeNotFoundError, etc.)
- Validation error scenarios
- File generation error handling
- MCP error response format validation

### Edge Cases
- Empty flowcharts
- Single node flowcharts
- Invalid input handling
- Missing node references
- Network-like flowchart structures

### Integration Testing
- Complete workflow from creation to export
- Multi-tool interactions
- State management across tool calls
- Error recovery scenarios

## Best Practices

1. **Test Organization**: Tests are organized by functionality and layer
2. **Mocking**: External dependencies are properly mocked
3. **Error Coverage**: Both happy path and error scenarios are tested
4. **Real-world Scenarios**: Integration tests simulate actual usage
5. **Performance**: Tests run quickly with proper mocking
6. **Maintainability**: Clear test descriptions and organized structure

## Adding New Tests

When adding new functionality:

1. Add unit tests for individual components
2. Update integration tests for end-to-end workflows
3. Mock external dependencies appropriately
4. Test both success and error scenarios
5. Maintain test coverage above 90%