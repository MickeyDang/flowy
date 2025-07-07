#!/usr/bin/env node

const flowchartTools = require('./src/tools/flowchart-tools');

async function runDemo() {
  console.log('🚀 Starting Flowy Demo - User Login Flow');
  console.log('=====================================\n');

  try {
    // Step 1: Create a new flowchart
    console.log('1. Creating flowchart...');
    const createResult = await flowchartTools.callTool('create_flowchart', {
      title: 'User Login Flow'
    });
    
    if (createResult.isError) {
      throw new Error(createResult.content[0].text);
    }
    
    const flowchartId = createResult.content[0].text.match(/ID: (.+)/)[1];
    console.log(`   ✓ Created flowchart: ${flowchartId}\n`);

    // Step 2: Add nodes representing the user login flow
    console.log('2. Adding login flow nodes...');
    
    const nodes = [
      { text: 'Login Screen', position: { x: 2, y: 7 } },
      { text: 'Validate Credentials', position: { x: 8, y: 7 } },
      { text: 'Success Page', position: { x: 14, y: 4 } },
      { text: 'Error Page', position: { x: 14, y: 10 } },
      { text: 'Forgot Password', position: { x: 8, y: 12 } }
    ];
    
    const nodeIds = [];
    
    for (const node of nodes) {
      const nodeResult = await flowchartTools.callTool('add_node', {
        flowchartId,
        text: node.text,
        positionHint: node.position
      });
      
      if (nodeResult.isError) {
        throw new Error(nodeResult.content[0].text);
      }
      
      const nodeId = nodeResult.content[0].text.match(/ID: (.+)/)[1];
      nodeIds.push(nodeId);
      console.log(`   ✓ Added node: ${node.text} (${nodeId})`);
    }
    console.log();

    // Step 3: Add connections between nodes
    console.log('3. Adding connections...');
    
    const connections = [
      { from: 0, to: 1, label: 'Submit' },
      { from: 1, to: 2, label: 'Valid' },
      { from: 1, to: 3, label: 'Invalid' },
      { from: 0, to: 4, label: 'Forgot Password' },
      { from: 3, to: 0, label: 'Try Again' }
    ];
    
    for (const conn of connections) {
      const connResult = await flowchartTools.callTool('add_connection', {
        flowchartId,
        sourceNodeId: nodeIds[conn.from],
        targetNodeId: nodeIds[conn.to],
        label: conn.label
      });
      
      if (connResult.isError) {
        throw new Error(connResult.content[0].text);
      }
      
      console.log(`   ✓ Connected: ${nodes[conn.from].text} → ${nodes[conn.to].text} (${conn.label})`);
    }
    console.log();

    // Step 4: Position nodes manually (nodes already positioned via positionHint)
    console.log('4. Nodes positioned via manual positioning...');
    console.log('   ✓ Nodes positioned using set coordinates\n');

    // Step 5: Export to PDF
    console.log('5. Exporting to PDF...');
    const exportResult = await flowchartTools.callTool('export_pdf', {
      flowchartId,
      filename: 'user-login-flow-demo'
    });
    
    if (exportResult.isError) {
      throw new Error(exportResult.content[0].text);
    }
    
    console.log('   ✓ PDF document generated');
    console.log('   📄 Response includes download link and base64 data');
    
    console.log('\n🎉 Demo completed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Flowchart ID: ${flowchartId}`);
    console.log(`   - Nodes created: ${nodes.length}`);
    console.log(`   - Connections added: ${connections.length}`);
    console.log('   - Positioning: manual coordinates');
    console.log('   - Export format: PDF (.pdf)');
    console.log('\n💡 You can now download the generated PDF file to view your flowchart!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runDemo();
}

module.exports = { runDemo };