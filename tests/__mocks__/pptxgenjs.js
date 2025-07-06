class MockSlide {
  constructor() {
    this.shapes = [];
    this.texts = [];
  }

  addShape(type, options) {
    this.shapes.push({ type, options });
  }

  addText(text, options) {
    this.texts.push({ text, options });
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
}

module.exports = MockPptxGenJS;