const { ValidationError } = require('./errors');

class Validator {
  static validateId(id, fieldName = 'ID') {
    if (!id || typeof id !== 'string') {
      throw new ValidationError(fieldName, id, 'must be a non-empty string');
    }
    
    if (id.trim().length === 0) {
      throw new ValidationError(fieldName, id, 'cannot be empty or whitespace only');
    }
    
    if (id.length > 100) {
      throw new ValidationError(fieldName, id, 'cannot exceed 100 characters');
    }
    
    return id.trim();
  }
  
  static validateText(text, fieldName = 'text') {
    if (!text || typeof text !== 'string') {
      throw new ValidationError(fieldName, text, 'must be a non-empty string');
    }
    
    if (text.trim().length === 0) {
      throw new ValidationError(fieldName, text, 'cannot be empty or whitespace only');
    }
    
    if (text.length > 500) {
      throw new ValidationError(fieldName, text, 'cannot exceed 500 characters');
    }
    
    return text.trim();
  }
  
  static validateFilename(filename, fieldName = 'filename') {
    if (!filename || typeof filename !== 'string') {
      throw new ValidationError(fieldName, filename, 'must be a non-empty string');
    }
    
    const sanitized = filename.trim();
    
    if (sanitized.length === 0) {
      throw new ValidationError(fieldName, filename, 'cannot be empty or whitespace only');
    }
    
    if (sanitized.length > 100) {
      throw new ValidationError(fieldName, filename, 'cannot exceed 100 characters');
    }
    
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(sanitized)) {
      throw new ValidationError(fieldName, filename, 'contains invalid characters');
    }
    
    return sanitized;
  }
  
  static validatePositionHint(positionHint, fieldName = 'positionHint') {
    if (!positionHint) {
      return { x: 0, y: 0 };
    }
    
    if (typeof positionHint !== 'object' || Array.isArray(positionHint)) {
      throw new ValidationError(fieldName, positionHint, 'must be an object');
    }
    
    const { x = 0, y = 0 } = positionHint;
    
    if (typeof x !== 'number' || !Number.isFinite(x)) {
      throw new ValidationError(fieldName + '.x', x, 'must be a finite number');
    }
    
    if (typeof y !== 'number' || !Number.isFinite(y)) {
      throw new ValidationError(fieldName + '.y', y, 'must be a finite number');
    }
    
    if (x < 0 || x > 20) {
      throw new ValidationError(fieldName + '.x', x, 'must be between 0 and 20 inches');
    }
    
    if (y < 0 || y > 15) {
      throw new ValidationError(fieldName + '.y', y, 'must be between 0 and 15 inches');
    }
    
    return { x, y };
  }
  
  static validateAlgorithm(algorithm, fieldName = 'algorithm') {
    if (!algorithm || typeof algorithm !== 'string') {
      throw new ValidationError(fieldName, algorithm, 'must be a non-empty string');
    }
    
    const validAlgorithms = ['hierarchical'];
    if (!validAlgorithms.includes(algorithm)) {
      throw new ValidationError(fieldName, algorithm, `must be one of: ${validAlgorithms.join(', ')}`);
    }
    
    return algorithm;
  }
  
  static validateDimension(dimension, fieldName = 'dimension') {
    if (typeof dimension !== 'number' || !Number.isFinite(dimension)) {
      throw new ValidationError(fieldName, dimension, 'must be a finite number');
    }
    
    if (dimension <= 0) {
      throw new ValidationError(fieldName, dimension, 'must be greater than 0');
    }
    
    if (dimension > 50) {
      throw new ValidationError(fieldName, dimension, 'cannot exceed 50 inches');
    }
    
    return dimension;
  }
  
  static validatePositionCoordinate(coordinate, fieldName = 'coordinate') {
    if (typeof coordinate !== 'number' || !Number.isFinite(coordinate)) {
      throw new ValidationError(fieldName, coordinate, 'must be a finite number');
    }
    
    if (coordinate < 0) {
      throw new ValidationError(fieldName, coordinate, 'must be greater than or equal to 0');
    }
    
    if (coordinate > 100) {
      throw new ValidationError(fieldName, coordinate, 'cannot exceed 100 inches');
    }
    
    return coordinate;
  }
  
  static validateShapeType(shapeType, fieldName = 'shapeType') {
    if (!shapeType || typeof shapeType !== 'string') {
      throw new ValidationError(fieldName, shapeType, 'must be a non-empty string');
    }
    
    const validShapeTypes = ['rectangle', 'oval', 'diamond'];
    if (!validShapeTypes.includes(shapeType)) {
      throw new ValidationError(fieldName, shapeType, `must be one of: ${validShapeTypes.join(', ')}`);
    }
    
    return shapeType;
  }
}

module.exports = Validator;