const ColorUtils = require('../../src/utils/color-utils');
const { ValidationError } = require('../../src/utils/errors');

describe('ColorUtils', () => {
  describe('hexToRgb', () => {
    test('converts 3-digit hex colors', () => {
      expect(ColorUtils.hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorUtils.hexToRgb('#0F0')).toEqual({ r: 0, g: 255, b: 0 });
      expect(ColorUtils.hexToRgb('#00F')).toEqual({ r: 0, g: 0, b: 255 });
      expect(ColorUtils.hexToRgb('#ABC')).toEqual({ r: 170, g: 187, b: 204 });
    });

    test('converts 6-digit hex colors', () => {
      expect(ColorUtils.hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorUtils.hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(ColorUtils.hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
      expect(ColorUtils.hexToRgb('#AABBCC')).toEqual({ r: 170, g: 187, b: 204 });
    });

    test('handles colors without # prefix', () => {
      expect(ColorUtils.hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorUtils.hexToRgb('F00')).toEqual({ r: 255, g: 0, b: 0 });
    });

    test('throws ValidationError for invalid hex colors', () => {
      expect(() => ColorUtils.hexToRgb('#GG0000')).toThrow(ValidationError);
      expect(() => ColorUtils.hexToRgb('#FF00')).toThrow(ValidationError);
      expect(() => ColorUtils.hexToRgb('#FF00000')).toThrow(ValidationError);
      expect(() => ColorUtils.hexToRgb('')).toThrow(ValidationError);
    });
  });

  describe('rgbToHex', () => {
    test('converts RGB values to hex', () => {
      expect(ColorUtils.rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(ColorUtils.rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(ColorUtils.rgbToHex(0, 0, 255)).toBe('#0000ff');
      expect(ColorUtils.rgbToHex(170, 187, 204)).toBe('#aabbcc');
    });

    test('handles edge values', () => {
      expect(ColorUtils.rgbToHex(0, 0, 0)).toBe('#000000');
      expect(ColorUtils.rgbToHex(255, 255, 255)).toBe('#ffffff');
    });

    test('clamps values outside 0-255 range', () => {
      expect(ColorUtils.rgbToHex(-10, 300, 128)).toBe('#00ff80');
      expect(ColorUtils.rgbToHex(256, -5, 999)).toBe('#ff00ff');
    });
  });

  describe('rgbToHsl', () => {
    test('converts RGB to HSL correctly', () => {
      expect(ColorUtils.rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
      expect(ColorUtils.rgbToHsl(0, 255, 0)).toEqual({ h: 120, s: 100, l: 50 });
      expect(ColorUtils.rgbToHsl(0, 0, 255)).toEqual({ h: 240, s: 100, l: 50 });
      expect(ColorUtils.rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 });
      expect(ColorUtils.rgbToHsl(255, 255, 255)).toEqual({ h: 0, s: 0, l: 100 });
    });

    test('handles gray colors', () => {
      expect(ColorUtils.rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 });
    });
  });

  describe('hslToRgb', () => {
    test('converts HSL to RGB correctly', () => {
      expect(ColorUtils.hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorUtils.hslToRgb(120, 100, 50)).toEqual({ r: 0, g: 255, b: 0 });
      expect(ColorUtils.hslToRgb(240, 100, 50)).toEqual({ r: 0, g: 0, b: 255 });
      expect(ColorUtils.hslToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
      expect(ColorUtils.hslToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
    });

    test('handles gray colors', () => {
      expect(ColorUtils.hslToRgb(0, 0, 50)).toEqual({ r: 128, g: 128, b: 128 });
    });
  });

  describe('adjustBrightness', () => {
    test('lightens colors', () => {
      const result = ColorUtils.adjustBrightness('#0277BD', 20);
      const originalHsl = ColorUtils.rgbToHsl(...Object.values(ColorUtils.hexToRgb('#0277BD')));
      const resultHsl = ColorUtils.rgbToHsl(...Object.values(ColorUtils.hexToRgb(result)));
      
      expect(resultHsl.l).toBeGreaterThan(originalHsl.l);
    });

    test('darkens colors', () => {
      const result = ColorUtils.adjustBrightness('#0277BD', -20);
      const originalHsl = ColorUtils.rgbToHsl(...Object.values(ColorUtils.hexToRgb('#0277BD')));
      const resultHsl = ColorUtils.rgbToHsl(...Object.values(ColorUtils.hexToRgb(result)));
      
      expect(resultHsl.l).toBeLessThan(originalHsl.l);
    });

    test('clamps brightness to valid range', () => {
      expect(ColorUtils.adjustBrightness('#000000', 200)).toBe('#ffffff');
      expect(ColorUtils.adjustBrightness('#ffffff', -200)).toBe('#000000');
    });
  });

  describe('lighten', () => {
    test('lightens color by default 20%', () => {
      const result = ColorUtils.lighten('#0277BD');
      const originalHsl = ColorUtils.rgbToHsl(...Object.values(ColorUtils.hexToRgb('#0277BD')));
      const resultHsl = ColorUtils.rgbToHsl(...Object.values(ColorUtils.hexToRgb(result)));
      
      expect(resultHsl.l).toBe(originalHsl.l + 20);
    });

    test('lightens color by custom percentage', () => {
      const result = ColorUtils.lighten('#0277BD', 30);
      const originalHsl = ColorUtils.rgbToHsl(...Object.values(ColorUtils.hexToRgb('#0277BD')));
      const resultHsl = ColorUtils.rgbToHsl(...Object.values(ColorUtils.hexToRgb(result)));
      
      expect(resultHsl.l).toBe(originalHsl.l + 30);
    });
  });

  describe('darken', () => {
    test('darkens color by default 20%', () => {
      const result = ColorUtils.darken('#0277BD');
      const originalHsl = ColorUtils.rgbToHsl(...Object.values(ColorUtils.hexToRgb('#0277BD')));
      const resultHsl = ColorUtils.rgbToHsl(...Object.values(ColorUtils.hexToRgb(result)));
      
      expect(resultHsl.l).toBe(originalHsl.l - 20);
    });

    test('darkens color by custom percentage', () => {
      const result = ColorUtils.darken('#0277BD', 30);
      const originalHsl = ColorUtils.rgbToHsl(...Object.values(ColorUtils.hexToRgb('#0277BD')));
      const resultHsl = ColorUtils.rgbToHsl(...Object.values(ColorUtils.hexToRgb(result)));
      
      expect(resultHsl.l).toBe(originalHsl.l - 30);
    });
  });

  describe('generateFillColor', () => {
    test('generates lighter fill color', () => {
      const fillColor = ColorUtils.generateFillColor('#0277BD');
      const primaryHsl = ColorUtils.rgbToHsl(...Object.values(ColorUtils.hexToRgb('#0277BD')));
      const fillHsl = ColorUtils.rgbToHsl(...Object.values(ColorUtils.hexToRgb(fillColor)));
      
      expect(fillHsl.l).toBeGreaterThan(primaryHsl.l);
    });
  });

  describe('generateBorderColor', () => {
    test('returns same color as primary', () => {
      expect(ColorUtils.generateBorderColor('#0277BD')).toBe('#0277BD');
    });
  });

  describe('isValidHex', () => {
    test('validates correct hex colors', () => {
      expect(ColorUtils.isValidHex('#FF0000')).toBe(true);
      expect(ColorUtils.isValidHex('#F00')).toBe(true);
      expect(ColorUtils.isValidHex('#abc123')).toBe(true);
      expect(ColorUtils.isValidHex('#ABC')).toBe(true);
    });

    test('rejects invalid hex colors', () => {
      expect(ColorUtils.isValidHex('FF0000')).toBe(false); // missing #
      expect(ColorUtils.isValidHex('#GG0000')).toBe(false); // invalid character
      expect(ColorUtils.isValidHex('#FF00')).toBe(false); // wrong length
      expect(ColorUtils.isValidHex('#FF00000')).toBe(false); // wrong length
      expect(ColorUtils.isValidHex('')).toBe(false); // empty
      expect(ColorUtils.isValidHex('#')).toBe(false); // just #
    });
  });

  describe('toPptxColor', () => {
    test('removes # and converts to uppercase', () => {
      expect(ColorUtils.toPptxColor('#ff0000')).toBe('FF0000');
      expect(ColorUtils.toPptxColor('#ABC123')).toBe('ABC123');
      expect(ColorUtils.toPptxColor('#f00')).toBe('F00');
    });
  });
});