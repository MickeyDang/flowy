const PptxGenJS = require('pptxgenjs');
const Positioning = require('./positioning');

class FlowchartPresentationGenerator {
  constructor() {
    this.pptx = null;
  }
  
  createPresentation(title, flowchart) {
    this.pptx = new PptxGenJS();
    
    this.pptx.author = 'Flowchart Generator';
    this.pptx.company = 'MCP Server';
    this.pptx.title = title;
    this.pptx.subject = 'Generated Flowchart';
    
    // Use flowchart dimensions for layout
    const layoutName = `LAYOUT_${flowchart.slideWidth}x${flowchart.slideHeight}`;
    this.pptx.defineLayout({
      name: layoutName,
      width: flowchart.slideWidth,
      height: flowchart.slideHeight,
    });
    
    this.pptx.layout = layoutName;
    
    const titleSlide = this.pptx.addSlide();
    titleSlide.addText(title, {
      x: 0.5,
      y: flowchart.slideHeight / 2 - 0.75,
      w: flowchart.slideWidth - 1,
      h: 1.5,
      fontSize: 32,
      bold: true,
      align: 'center',
      color: '363636',
    });
    
    return this.pptx;
  }
  
  addFlowchartSlide(flowchart) {
    const { FileGenerationError } = require('./errors');
    
    try {
      if (!this.pptx) {
        throw new FileGenerationError('Presentation not initialized. Call createPresentation first.');
      }
      
      if (!flowchart || !flowchart.nodes) {
        throw new FileGenerationError('Invalid flowchart object provided');
      }
      
      const slide = this.pptx.addSlide();
      
      slide.addText(flowchart.title || 'Untitled Flowchart', {
        x: 0.5,
        y: 0.2,
        w: flowchart.slideWidth - 1,
        h: 0.6,
        fontSize: 20,
        bold: true,
        align: 'center',
        color: '363636',
      });
      
      if (flowchart.nodes.size === 0) {
        slide.addText('No nodes in flowchart', {
          x: flowchart.slideWidth / 2 - 3,
          y: flowchart.slideHeight / 2 - 0.5,
          w: 6,
          h: 1,
          fontSize: 14,
          align: 'center',
          color: '666666',
        });
        return slide;
      }
      
      flowchart.nodes.forEach(node => {
        try {
          this.addNodeShape(slide, node);
        } catch (error) {
          console.error(`Error adding node ${node.id}:`, error.message);
        }
      });
      
      if (flowchart.connections && flowchart.connections.length > 0) {
        flowchart.connections.forEach(connection => {
          try {
            const sourceNode = flowchart.getNode(connection.sourceId);
            const targetNode = flowchart.getNode(connection.targetId);
            
            if (sourceNode && targetNode) {
              this.addArrowShape(slide, sourceNode, targetNode, connection.label, connection.pathPoints);
            }
          } catch (error) {
            console.error(`Error adding connection ${connection.sourceId} -> ${connection.targetId}:`, error.message);
          }
        });
      }
      
      return slide;
    } catch (error) {
      throw new FileGenerationError(`Failed to add flowchart slide: ${error.message}`, error);
    }
  }
  
  addNodeShape(slide, node) {
    const shapeConfig = node.toPptxShape();
    
    const shapeOptions = {
      x: shapeConfig.x,
      y: shapeConfig.y + 1,
      w: shapeConfig.w,
      h: shapeConfig.h,
      fill: shapeConfig.fill,
      line: shapeConfig.line,
    };

    if (shapeConfig.custGeom) {
      shapeOptions.custGeom = shapeConfig.custGeom;
    }
    
    slide.addShape(shapeConfig.shape, shapeOptions);
    
    slide.addText(shapeConfig.text, {
      x: shapeConfig.x,
      y: shapeConfig.y + 1,
      w: shapeConfig.w,
      h: shapeConfig.h,
      fontSize: shapeConfig.options.fontSize,
      fontFace: shapeConfig.options.fontFace,
      color: shapeConfig.options.color,
      align: shapeConfig.options.align,
      valign: shapeConfig.options.valign,
      shrinkText: shapeConfig.options.shrinkText,
      isTextBox: shapeConfig.options.isTextBox,
    });
  }
  
  addArrowShape(slide, sourceNode, targetNode, label = '', pathPoints = null) {
    if (pathPoints && pathPoints.length >= 2) {
      // Use custom path with geometry
      this.addCustomPathArrow(slide, pathPoints, label);
    } else {
      // Use default straight line logic
      const connectionPoints = Positioning.calculateConnectionPoints(sourceNode, targetNode);
      
      const startX = connectionPoints.startX;
      const startY = connectionPoints.startY + 1;
      const endX = connectionPoints.endX;
      const endY = connectionPoints.endY + 1;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      slide.addShape('line', {
        x: startX,
        y: startY,
        w: deltaX,
        h: deltaY,
        line: { 
          color: '666666', 
          width: 2,
          endArrowType: 'triangle',
        },
      });
      
      if (label) {
        const midX = startX + deltaX / 2;
        const midY = startY + deltaY / 2;
        
        slide.addText(label, {
          x: midX - 0.5,
          y: midY - 0.15,
          w: 1,
          h: 0.3,
          fontSize: 10,
          color: '666666',
          align: 'center',
          fill: { color: 'FFFFFF' },
        });
      }
    }
  }
  
  addCustomPathArrow(slide, pathPoints, label = '') {
    // Calculate bounding box for the path
    const minX = Math.min(...pathPoints.map(p => p.x));
    const maxX = Math.max(...pathPoints.map(p => p.x));
    const minY = Math.min(...pathPoints.map(p => p.y));
    const maxY = Math.max(...pathPoints.map(p => p.y));
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Convert path points to relative coordinates within the bounding box
    const relativePoints = pathPoints.map(point => ({
      x: width > 0 ? (point.x - minX) / width : 0,
      y: height > 0 ? (point.y - minY) / height : 0
    }));
    
    // Create custom geometry path
    let pathData = '';
    relativePoints.forEach((point, index) => {
      if (index === 0) {
        pathData += `M ${point.x} ${point.y} `;
      } else {
        pathData += `L ${point.x} ${point.y} `;
      }
    });
    
    // Add the custom path shape
    slide.addShape('custGeom', {
      x: minX,
      y: minY + 1,
      w: width || 0.1,
      h: height || 0.1,
      line: { 
        color: '666666', 
        width: 2,
        endArrowType: 'triangle',
      },
      fill: { type: 'solid', color: 'FFFFFF', alpha: 0 },
      custGeom: {
        pathLst: [{
          w: width || 0.1,
          h: height || 0.1,
          pathData: pathData.trim()
        }]
      }
    });
    
    if (label) {
      // Position label at the midpoint of the path
      const midIndex = Math.floor(pathPoints.length / 2);
      const midPoint = pathPoints[midIndex];
      
      slide.addText(label, {
        x: midPoint.x - 0.5,
        y: midPoint.y - 0.15,
        w: 1,
        h: 0.3,
        fontSize: 10,
        color: '666666',
        align: 'center',
        fill: { color: 'FFFFFF' },
      });
    }
  }
  
  async generatePresentation(flowchart, filename) {
    const { FileGenerationError } = require('./errors');
    const Validator = require('./validation');
    
    try {
      if (!flowchart) {
        throw new FileGenerationError('Flowchart object is required');
      }
      
      const validatedFilename = Validator.validateFilename(filename);
      
      this.createPresentation(flowchart.title || 'Untitled Flowchart', flowchart);
      this.addFlowchartSlide(flowchart);
      
      try {
        const buffer = await this.pptx.write({ outputType: 'nodebuffer' });
        return {
          filename: `${validatedFilename}.pptx`,
          buffer: buffer
        };
      } catch (writeError) {
        throw new FileGenerationError(`Failed to generate PowerPoint buffer: ${writeError.message}`, writeError);
      }
    } catch (error) {
      if (error instanceof FileGenerationError) {
        throw error;
      }
      throw new FileGenerationError(`Failed to generate presentation: ${error.message}`, error);
    }
  }
}

module.exports = FlowchartPresentationGenerator;