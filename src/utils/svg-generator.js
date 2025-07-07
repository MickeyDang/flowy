/**
 * SVG generator for flowcharts
 * Generates clean, scalable SVG output with proper styling
 */

class FlowchartSVGGenerator {
  constructor() {
    this.nodeWidth = 150;
    this.nodeHeight = 60;
    this.nodePadding = 20;
    this.connectionOffset = 10;
  }

  /**
   * Generate SVG for a flowchart
   * @param {Object} flowchart - The flowchart data (matches PDF generator expectations)
   * @param {number} width - The desired width for the SVG (default: 400)
   * @param {number} height - The desired height for the SVG (default: 600)
   * @returns {string} SVG markup
   */
  generateSVG(flowchart, width = 400, height = 600) {
    if (!flowchart) {
      throw new Error('Flowchart object is required');
    }

    if (!flowchart.nodes || !(flowchart.nodes instanceof Map)) {
      throw new Error('Invalid flowchart data - nodes must be a Map');
    }

    const nodesArray = Array.from(flowchart.nodes.values());
    const connections = flowchart.connections || [];
    const title = flowchart.title || 'Flowchart';
    
    if (nodesArray.length === 0) {
      throw new Error('No nodes found in flowchart');
    }

    // Calculate layout and bounds
    const layout = this.calculateLayout(nodesArray, connections, flowchart, width, height);
    const bounds = this.calculateBounds(layout);
    
    // Add padding to bounds
    const padding = 40;
    const svgWidth = width;
    const svgHeight = height;

    // Generate SVG content
    let svg = this.createSVGHeader(svgWidth, svgHeight);
    svg += this.createStyles();
    svg += this.createTitle(title, svgWidth, padding);
    svg += this.createConnections(connections, layout, bounds, padding, flowchart, svgWidth, svgHeight);
    svg += this.createNodes(layout, bounds, padding, svgWidth, svgHeight);
    svg += this.createSVGFooter();

    return svg;
  }

  /**
   * Calculate layout positions for nodes
   */
  calculateLayout(nodes, connections, flowchart, svgWidth, svgHeight) {
    const layout = {};
    const padding = 40;
    const titleHeight = 60;
    const availableWidth = svgWidth - (padding * 2);
    const availableHeight = svgHeight - (padding * 2) - titleHeight;
    
    // Use existing layout if available, otherwise create simple grid layout
    if (flowchart.layout) {
      // Use existing layout from flowchart
      nodes.forEach(node => {
        layout[node.id] = {
          x: node.x * 200, // Scale up for SVG
          y: node.y * 200 + titleHeight, // Offset for title
          width: this.nodeWidth,
          height: this.nodeHeight,
          text: node.text || `Node ${node.id}`,
          type: node.type || 'default'
        };
      });
    } else {
      // Simple grid layout for nodes without layout
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const rows = Math.ceil(nodes.length / cols);
      
      // Calculate node spacing to fit within available dimensions
      const nodeSpacingX = Math.max(this.nodeWidth + this.nodePadding, availableWidth / cols);
      const nodeSpacingY = Math.max(this.nodeHeight + this.nodePadding, availableHeight / rows);
      
      const startX = (availableWidth - ((cols - 1) * nodeSpacingX + this.nodeWidth)) / 2;
      const startY = (availableHeight - ((rows - 1) * nodeSpacingY + this.nodeHeight)) / 2 + titleHeight;
      
      nodes.forEach((node, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        layout[node.id] = {
          x: startX + col * nodeSpacingX,
          y: startY + row * nodeSpacingY,
          width: this.nodeWidth,
          height: this.nodeHeight,
          text: node.text || `Node ${node.id}`,
          type: node.type || 'default'
        };
      });
    }

    return layout;
  }

  /**
   * Calculate bounding box for the layout
   */
  calculateBounds(layout) {
    const positions = Object.values(layout);
    if (positions.length === 0) return { width: 0, height: 0, minX: 0, minY: 0 };

    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxX = Math.max(...positions.map(p => p.x + p.width));
    const maxY = Math.max(...positions.map(p => p.y + p.height));

    return {
      width: maxX - minX,
      height: maxY - minY,
      minX,
      minY
    };
  }

  /**
   * Create SVG header with viewBox
   */
  createSVGHeader(width, height) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
`;
  }

  /**
   * Create CSS styles for the SVG
   */
  createStyles() {
    return `  <defs>
    <style>
      .node-rect {
        fill: #e3f2fd;
        stroke: #1976d2;
        stroke-width: 2;
        rx: 8;
        ry: 8;
      }
      .node-text {
        fill: #1565c0;
        font-family: Arial, sans-serif;
        font-size: 12px;
        font-weight: 500;
        text-anchor: middle;
        dominant-baseline: central;
      }
      .connection-line {
        stroke: #757575;
        stroke-width: 2;
        fill: none;
        marker-end: url(#arrowhead);
      }
      .connection-label {
        fill: #424242;
        font-family: Arial, sans-serif;
        font-size: 10px;
        text-anchor: middle;
        dominant-baseline: central;
        background: white;
      }
      .title-text {
        fill: #1565c0;
        font-family: Arial, sans-serif;
        font-size: 16px;
        font-weight: bold;
        text-anchor: middle;
        dominant-baseline: central;
      }
    </style>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#757575" />
    </marker>
  </defs>
`;
  }

  /**
   * Create title element
   */
  createTitle(title, svgWidth, padding) {
    return `  <text x="${svgWidth / 2}" y="25" class="title-text">${this.escapeXML(title)}</text>
`;
  }

  /**
   * Create connection lines and arrows
   */
  createConnections(connections, layout, bounds, padding, flowchart, svgWidth, svgHeight) {
    if (!connections || connections.length === 0) return '';

    let svg = '';
    const centerOffsetX = (svgWidth - bounds.width) / 2;
    const centerOffsetY = (svgHeight - bounds.height - 60) / 2; // Account for title height
    
    connections.forEach(connection => {
      // Use sourceId/targetId (matching PDF generator)
      const source = layout[connection.sourceId];
      const target = layout[connection.targetId];
      
      if (!source || !target) return;

      // Calculate connection points with centering
      const sourceX = source.x + source.width / 2 - bounds.minX + padding + centerOffsetX;
      const sourceY = source.y + source.height - bounds.minY + padding + centerOffsetY;
      const targetX = target.x + target.width / 2 - bounds.minX + padding + centerOffsetX;
      const targetY = target.y - bounds.minY + padding + centerOffsetY;

      // Create path
      svg += `  <path d="M ${sourceX} ${sourceY} L ${targetX} ${targetY}" class="connection-line" />
`;

      // Add label if exists
      if (connection.label) {
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        svg += `  <rect x="${midX - 20}" y="${midY - 8}" width="40" height="16" fill="white" stroke="none" />
`;
        svg += `  <text x="${midX}" y="${midY}" class="connection-label">${this.escapeXML(connection.label)}</text>
`;
      }
    });

    return svg;
  }

  /**
   * Create node rectangles and text
   */
  createNodes(layout, bounds, padding, svgWidth, svgHeight) {
    let svg = '';
    const centerOffsetX = (svgWidth - bounds.width) / 2;
    const centerOffsetY = (svgHeight - bounds.height - 60) / 2; // Account for title height
    
    Object.values(layout).forEach(node => {
      const x = node.x - bounds.minX + padding + centerOffsetX;
      const y = node.y - bounds.minY + padding + centerOffsetY;
      
      // Create node rectangle
      svg += `  <rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" class="node-rect" />
`;
      
      // Create node text (with word wrapping for long text)
      const lines = this.wrapText(node.text, node.width - 20, 12);
      const lineHeight = 14;
      const startY = y + node.height / 2 - ((lines.length - 1) * lineHeight) / 2;
      
      lines.forEach((line, index) => {
        svg += `  <text x="${x + node.width / 2}" y="${startY + index * lineHeight}" class="node-text">${this.escapeXML(line)}</text>
`;
      });
    });

    return svg;
  }

  /**
   * Create SVG footer
   */
  createSVGFooter() {
    return `</svg>`;
  }

  /**
   * Wrap text to fit within specified width
   */
  wrapText(text, maxWidth, fontSize) {
    if (!text) return [''];
    
    const words = text.toString().split(' ');
    const lines = [];
    let currentLine = '';
    
    // Approximate character width (this is a rough estimate)
    const charWidth = fontSize * 0.6;
    const maxChars = Math.floor(maxWidth / charWidth);
    
    words.forEach(word => {
      if ((currentLine + word).length <= maxChars) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    
    return lines.length > 0 ? lines : [''];
  }

  /**
   * Escape XML special characters
   */
  escapeXML(text) {
    if (!text) return '';
    return text.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

module.exports = { FlowchartSVGGenerator };