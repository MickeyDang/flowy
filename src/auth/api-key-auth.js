const crypto = require('crypto');
require('dotenv').config();

class ApiKeyAuth {
  static validateApiKey(providedKey) {
    try {
      // Get the configured API key from environment
      const configuredKey = process.env.FLOWY_API_KEY;
      
      // Check if API key is configured
      if (!configuredKey) {
        return {
          valid: false,
          error: 'API key not configured. Please set FLOWY_API_KEY environment variable.'
        };
      }
      
      // Check if API key was provided
      if (!providedKey) {
        return {
          valid: false,
          error: 'API key not provided. Include API key in request headers or body.'
        };
      }
      
      // Ensure both keys are strings
      if (typeof providedKey !== 'string' || typeof configuredKey !== 'string') {
        return {
          valid: false,
          error: 'Invalid API key format.'
        };
      }
      
      // Use constant-time comparison to prevent timing attacks
      const isValid = this._constantTimeCompare(providedKey, configuredKey);
      
      return {
        valid: isValid,
        error: isValid ? null : 'Invalid API key.'
      };
      
    } catch (error) {
      return {
        valid: false,
        error: 'API key validation error: ' + error.message
      };
    }
  }
  
  /**
   * Constant-time string comparison to prevent timing attacks
   * @param {string} a - First string to compare
   * @param {string} b - Second string to compare
   * @returns {boolean} - True if strings are equal
   */
  static _constantTimeCompare(a, b) {
    // If lengths are different, they can't be equal
    // But we still need to do a comparison to maintain constant time
    if (a.length !== b.length) {
      // Compare against a string of the same length as 'a' to maintain timing
      crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
      return false;
    }
    
    try {
      // Use Node.js built-in timing-safe comparison
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch (error) {
      // If there's an error in comparison, return false
      return false;
    }
  }
}

module.exports = ApiKeyAuth;