const { jsPDF } = require('jspdf');
const Positioning = require('./positioning');

class FlowchartPDFGenerator {
  constructor() {
    this.pdf = null;
    this.pageWidth = 210; // Default A4 width in mm
    this.pageHeight = 297; // Default A4 height in mm
    this.scale = 20; // Scale factor for converting logical units to mm
    this.margin = 20; // Margin in mm
  }
  
  createPDF(title, flowchart) {
    // Use flowchart dimensions converted to mm (1 inch = 25.4 mm)
    this.pageWidth = flowchart.slideWidth * 25.4;
    this.pageHeight = flowchart.slideHeight * 25.4;
    
    this.pdf = new jsPDF('p', 'mm', [this.pageWidth, this.pageHeight]);
    
    // Set document properties
    this.pdf.setProperties({
      title: title,
      subject: 'Generated Flowchart',
      author: 'Flowchart Generator',
      creator: 'MCP Server'
    });
    
    // Add title
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.pageWidth / 2, 20, { align: 'center' });
    
    return this.pdf;
  }
  
  addFlowchartPage(flowchart) {
    const { FileGenerationError } = require('./errors');
    
    try {
      if (!this.pdf) {
        throw new FileGenerationError('PDF not initialized. Call createPDF first.');
      }
      
      if (!flowchart || !flowchart.nodes) {
        throw new FileGenerationError('Invalid flowchart object provided');
      }
      
      if (flowchart.nodes.size === 0) {
        this.pdf.setFontSize(12);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.text('No nodes in flowchart', this.pageWidth / 2, this.pageHeight / 2, { align: 'center' });
        return;
      }
      
      // Calculate layout bounds
      const nodes = Array.from(flowchart.nodes.values());
      const bbox = Positioning.calculateBoundingBox(nodes);
      
      // Calculate scale to fit content on page
      const availableWidth = this.pageWidth - 2 * this.margin;
      const availableHeight = this.pageHeight - 2 * this.margin - 40; // Account for title space
      
      const contentWidth = bbox.maxX - bbox.minX;
      const contentHeight = bbox.maxY - bbox.minY;
      
      const scaleX = contentWidth > 0 ? availableWidth / (contentWidth * this.scale) : 1;
      const scaleY = contentHeight > 0 ? availableHeight / (contentHeight * this.scale) : 1;
      this.currentScale = Math.min(scaleX, scaleY, 1); // Don't scale up
      
      // Center the content
      const scaledWidth = contentWidth * this.scale * this.currentScale;
      const scaledHeight = contentHeight * this.scale * this.currentScale;
      
      this.offsetX = this.margin + (availableWidth - scaledWidth) / 2 - bbox.minX * this.scale * this.currentScale;
      this.offsetY = this.margin + 40 + (availableHeight - scaledHeight) / 2 - bbox.minY * this.scale * this.currentScale;
      
      // Draw nodes
      flowchart.nodes.forEach(node => {
        try {
          this.drawNode(node);
        } catch (error) {
          console.error(`Error drawing node ${node.id}:`, error.message);
        }
      });
      
      // Draw connections
      if (flowchart.connections && flowchart.connections.length > 0) {
        flowchart.connections.forEach(connection => {
          try {
            const sourceNode = flowchart.getNode(connection.sourceId);
            const targetNode = flowchart.getNode(connection.targetId);
            
            if (sourceNode && targetNode) {
              this.drawConnection(sourceNode, targetNode, connection.label);
            }
          } catch (error) {
            console.error(`Error drawing connection ${connection.sourceId} -> ${connection.targetId}:`, error.message);
          }
        });
      }
      
    } catch (error) {
      throw new FileGenerationError(`Failed to add flowchart page: ${error.message}`, error);
    }
  }
  
  drawNode(node) {
    const x = this.offsetX + node.x * this.scale * this.currentScale;
    const y = this.offsetY + node.y * this.scale * this.currentScale;
    const width = node.width * this.scale * this.currentScale;
    const height = node.height * this.scale * this.currentScale;
    
    // Draw rectangle
    this.pdf.setFillColor(225, 245, 254); // Light blue background
    this.pdf.setDrawColor(2, 119, 189); // Blue border
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(x, y, width, height, 'FD'); // Fill and Draw
    
    // Draw text
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    // Center text in rectangle
    const textX = x + width / 2;
    const textY = y + height / 2 + 2; // Slight offset for vertical centering
    
    this.pdf.text(node.text, textX, textY, { align: 'center' });
  }
  
  drawConnection(sourceNode, targetNode, label = '') {
    const connectionPoints = Positioning.calculateConnectionPoints(sourceNode, targetNode);
    
    const startX = this.offsetX + connectionPoints.startX * this.scale * this.currentScale;
    const startY = this.offsetY + connectionPoints.startY * this.scale * this.currentScale;
    const endX = this.offsetX + connectionPoints.endX * this.scale * this.currentScale;
    const endY = this.offsetY + connectionPoints.endY * this.scale * this.currentScale;
    
    // Draw line
    this.pdf.setDrawColor(102, 102, 102); // Gray color
    this.pdf.setLineWidth(1);
    this.pdf.line(startX, startY, endX, endY);
    
    // Draw arrow head
    this.drawArrowHead(startX, startY, endX, endY);
    
    // Draw label if provided
    if (label) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(102, 102, 102);
      this.pdf.text(label, midX, midY, { align: 'center' });
    }
  }
  
  drawArrowHead(startX, startY, endX, endY) {
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowLength = 3;
    const arrowWidth = 1.5;
    
    // Calculate arrow head points
    const x1 = endX - arrowLength * Math.cos(angle - Math.PI / 6);
    const y1 = endY - arrowLength * Math.sin(angle - Math.PI / 6);
    const x2 = endX - arrowLength * Math.cos(angle + Math.PI / 6);
    const y2 = endY - arrowLength * Math.sin(angle + Math.PI / 6);
    
    // Draw arrow head
    this.pdf.setFillColor(102, 102, 102);
    this.pdf.triangle(endX, endY, x1, y1, x2, y2, 'F');
  }
  
  async generatePDF(flowchart, filename) {
    const { FileGenerationError } = require('./errors');
    const Validator = require('./validation');
    
    try {
      if (!flowchart) {
        throw new FileGenerationError('Flowchart object is required');
      }
      
      const validatedFilename = Validator.validateFilename(filename);
      
      this.createPDF(flowchart.title || 'Untitled Flowchart', flowchart);
      this.addFlowchartPage(flowchart);
      
      try {
        const buffer = Buffer.from(this.pdf.output('arraybuffer'));
        return {
          filename: `${validatedFilename}.pdf`,
          buffer: buffer
        };
      } catch (generateError) {
        throw new FileGenerationError(`Failed to generate PDF buffer: ${generateError.message}`, generateError);
      }
    } catch (error) {
      if (error instanceof FileGenerationError) {
        throw error;
      }
      throw new FileGenerationError(`Failed to generate PDF: ${error.message}`, error);
    }
  }
}

module.exports = FlowchartPDFGenerator;