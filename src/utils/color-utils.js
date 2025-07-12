const { ValidationError } = require('./errors');

/**
 * Color utility functions for hex/RGB/HSL conversion and manipulation
 */
class ColorUtils {
  /**
   * Converts hex color to RGB values
   * @param {string} hex - Hex color string (#RGB or #RRGGBB)
   * @returns {Object} Object with r, g, b properties (0-255)
   */
  static hexToRgb(hex) {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    let r, g, b;
    
    if (cleanHex.length === 3) {
      // Short format #RGB -> #RRGGBB
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
      // Full format #RRGGBB
      r = parseInt(cleanHex.substr(0, 2), 16);
      g = parseInt(cleanHex.substr(2, 2), 16);
      b = parseInt(cleanHex.substr(4, 2), 16);
    } else {
      throw new ValidationError('hex color', hex, 'must be in format #RGB or #RRGGBB');
    }
    
    // Check for NaN values (invalid hex characters)
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      throw new ValidationError('hex color', hex, 'contains invalid hex characters');
    }
    
    return { r, g, b };
  }
  
  /**
   * Converts RGB values to hex color string
   * @param {number} r - Red value (0-255)
   * @param {number} g - Green value (0-255)
   * @param {number} b - Blue value (0-255)
   * @returns {string} Hex color string (#RRGGBB)
   */
  static rgbToHex(r, g, b) {
    const toHex = (value) => {
      const hex = Math.round(Math.max(0, Math.min(255, value))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  
  /**
   * Converts RGB values to HSL
   * @param {number} r - Red value (0-255)
   * @param {number} g - Green value (0-255)
   * @param {number} b - Blue value (0-255)
   * @returns {Object} Object with h (0-360), s (0-100), l (0-100) properties
   */
  static rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }
  
  /**
   * Converts HSL values to RGB
   * @param {number} h - Hue (0-360)
   * @param {number} s - Saturation (0-100)
   * @param {number} l - Lightness (0-100)
   * @returns {Object} Object with r, g, b properties (0-255)
   */
  static hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }
  
  /**
   * Adjusts the brightness of a hex color
   * @param {string} hex - Hex color string
   * @param {number} percentage - Brightness adjustment percentage (-100 to 100)
   * @returns {string} Adjusted hex color string
   */
  static adjustBrightness(hex, percentage) {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // Adjust lightness
    hsl.l = Math.max(0, Math.min(100, hsl.l + percentage));
    
    const adjustedRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
    return this.rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
  }
  
  /**
   * Lightens a hex color by a given percentage
   * @param {string} hex - Hex color string
   * @param {number} percentage - Percentage to lighten (0-100)
   * @returns {string} Lightened hex color string
   */
  static lighten(hex, percentage = 20) {
    return this.adjustBrightness(hex, percentage);
  }
  
  /**
   * Darkens a hex color by a given percentage
   * @param {string} hex - Hex color string
   * @param {number} percentage - Percentage to darken (0-100)
   * @returns {string} Darkened hex color string
   */
  static darken(hex, percentage = 20) {
    return this.adjustBrightness(hex, -percentage);
  }
  
  /**
   * Generates a complementary fill color (lighter) from a primary color
   * @param {string} primaryHex - Primary hex color
   * @returns {string} Complementary fill hex color
   */
  static generateFillColor(primaryHex) {
    return this.lighten(primaryHex, 20);
  }
  
  /**
   * Generates a border color from a primary color (same as primary)
   * @param {string} primaryHex - Primary hex color
   * @returns {string} Border hex color
   */
  static generateBorderColor(primaryHex) {
    return primaryHex;
  }
  
  /**
   * Validates if a string is a valid hex color
   * @param {string} hex - Hex color string to validate
   * @returns {boolean} True if valid hex color
   */
  static isValidHex(hex) {
    const hexRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
    return hexRegex.test(hex);
  }
  
  /**
   * Converts hex color to PowerPoint compatible format (removes #)
   * @param {string} hex - Hex color string
   * @returns {string} PowerPoint compatible color string
   */
  static toPptxColor(hex) {
    return hex.replace('#', '').toUpperCase();
  }
}

module.exports = ColorUtils;