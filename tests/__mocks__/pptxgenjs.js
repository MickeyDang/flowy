// TODO: update the test mocks to deprecate the use of autolayout
class MockSlide {
  constructor() {
    this.shapes = [];
    this.texts = [];
  }

  addShape(type, options) {
    // Support for custom geometry shapes
    if (type === 'custGeom') {
      const shape = {
        type,
        options: {
          ...options,
          custGeom: options.custGeom || {
            pathLst: options.custGeom?.pathLst || []
          }
        }
      };
      this.shapes.push(shape);
    } else {
      this.shapes.push({ type, options });
    }
  }

  addText(text, options) {
    this.texts.push({ text, options: { ...options } });
  }
}

class MockPptxGenJS {
  constructor() {
    this.slides = [];
    this.author = '';
    this.company = '';
    this.title = '';
    this.subject = '';
    this.layout = '';
  }

  defineLayout(layout) {
    this.customLayout = layout;
  }

  addSlide() {
    const slide = new MockSlide();
    this.slides.push(slide);
    return slide;
  }

  async writeFile({ fileName }) {
    // Mock file writing - just return success
    return Promise.resolve();
  }

  async write({ outputType }) {
    // Mock buffer writing for nodebuffer output
    if (outputType === 'nodebuffer') {
      return Promise.resolve(Buffer.from('mock-pptx-data'));
    }
    return Promise.resolve();
  }
}

module.exports = MockPptxGenJS;