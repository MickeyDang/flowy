const Validator = require('../../src/utils/validation');
const { ValidationError } = require('../../src/utils/errors');

describe('Validator', () => {
  describe('validateId', () => {
    test('validates correct ID', () => {
      expect(Validator.validateId('valid-id')).toBe('valid-id');
      expect(Validator.validateId('  valid-id  ')).toBe('valid-id');
    });

    test('throws ValidationError for invalid IDs', () => {
      expect(() => Validator.validateId('')).toThrow(ValidationError);
      expect(() => Validator.validateId('   ')).toThrow(ValidationError);
      expect(() => Validator.validateId(null)).toThrow(ValidationError);
      expect(() => Validator.validateId(123)).toThrow(ValidationError);
      expect(() => Validator.validateId('a'.repeat(101))).toThrow(ValidationError);
    });
  });

  describe('validateText', () => {
    test('validates correct text', () => {
      expect(Validator.validateText('valid text')).toBe('valid text');
      expect(Validator.validateText('  valid text  ')).toBe('valid text');
    });

    test('throws ValidationError for invalid text', () => {
      expect(() => Validator.validateText('')).toThrow(ValidationError);
      expect(() => Validator.validateText('   ')).toThrow(ValidationError);
      expect(() => Validator.validateText(null)).toThrow(ValidationError);
      expect(() => Validator.validateText(123)).toThrow(ValidationError);
      expect(() => Validator.validateText('a'.repeat(501))).toThrow(ValidationError);
    });
  });

  describe('validateFilename', () => {
    test('validates correct filename', () => {
      expect(Validator.validateFilename('valid-filename')).toBe('valid-filename');
      expect(Validator.validateFilename('  valid-filename  ')).toBe('valid-filename');
      expect(Validator.validateFilename('file_name.ext')).toBe('file_name.ext');
    });

    test('throws ValidationError for invalid filenames', () => {
      expect(() => Validator.validateFilename('')).toThrow(ValidationError);
      expect(() => Validator.validateFilename('   ')).toThrow(ValidationError);
      expect(() => Validator.validateFilename(null)).toThrow(ValidationError);
      expect(() => Validator.validateFilename('file<name')).toThrow(ValidationError);
      expect(() => Validator.validateFilename('file>name')).toThrow(ValidationError);
      expect(() => Validator.validateFilename('file:name')).toThrow(ValidationError);
      expect(() => Validator.validateFilename('file"name')).toThrow(ValidationError);
      expect(() => Validator.validateFilename('file/name')).toThrow(ValidationError);
      expect(() => Validator.validateFilename('file\\name')).toThrow(ValidationError);
      expect(() => Validator.validateFilename('file|name')).toThrow(ValidationError);
      expect(() => Validator.validateFilename('file?name')).toThrow(ValidationError);
      expect(() => Validator.validateFilename('file*name')).toThrow(ValidationError);
      expect(() => Validator.validateFilename('a'.repeat(101))).toThrow(ValidationError);
    });
  });

  describe('validatePositionHint', () => {
    test('validates correct position hint', () => {
      expect(Validator.validatePositionHint({ x: 1, y: 2 })).toEqual({ x: 1, y: 2 });
      expect(Validator.validatePositionHint({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
      expect(Validator.validatePositionHint({ x: 20, y: 15 })).toEqual({ x: 20, y: 15 });
    });

    test('provides defaults for missing values', () => {
      expect(Validator.validatePositionHint(null)).toEqual({ x: 0, y: 0 });
      expect(Validator.validatePositionHint(undefined)).toEqual({ x: 0, y: 0 });
      expect(Validator.validatePositionHint({})).toEqual({ x: 0, y: 0 });
      expect(Validator.validatePositionHint({ x: 5 })).toEqual({ x: 5, y: 0 });
      expect(Validator.validatePositionHint({ y: 3 })).toEqual({ x: 0, y: 3 });
    });

    test('throws ValidationError for invalid position hints', () => {
      expect(() => Validator.validatePositionHint([])).toThrow(ValidationError);
      expect(() => Validator.validatePositionHint('string')).toThrow(ValidationError);
      expect(() => Validator.validatePositionHint({ x: 'invalid' })).toThrow(ValidationError);
      expect(() => Validator.validatePositionHint({ y: 'invalid' })).toThrow(ValidationError);
      expect(() => Validator.validatePositionHint({ x: Infinity })).toThrow(ValidationError);
      expect(() => Validator.validatePositionHint({ y: NaN })).toThrow(ValidationError);
      expect(() => Validator.validatePositionHint({ x: -1 })).toThrow(ValidationError);
      expect(() => Validator.validatePositionHint({ y: -1 })).toThrow(ValidationError);
      expect(() => Validator.validatePositionHint({ x: 21 })).toThrow(ValidationError);
      expect(() => Validator.validatePositionHint({ y: 16 })).toThrow(ValidationError);
    });
  });

  describe('validateAlgorithm', () => {
    test('validates correct algorithm', () => {
      expect(Validator.validateAlgorithm('hierarchical')).toBe('hierarchical');
    });

    test('throws ValidationError for invalid algorithms', () => {
      expect(() => Validator.validateAlgorithm('')).toThrow(ValidationError);
      expect(() => Validator.validateAlgorithm(null)).toThrow(ValidationError);
      expect(() => Validator.validateAlgorithm(123)).toThrow(ValidationError);
      expect(() => Validator.validateAlgorithm('invalid')).toThrow(ValidationError);
      expect(() => Validator.validateAlgorithm('random')).toThrow(ValidationError);
    });
  });

  describe('validateShapeType', () => {
    test('validates correct shape types', () => {
      expect(Validator.validateShapeType('rectangle')).toBe('rectangle');
      expect(Validator.validateShapeType('oval')).toBe('oval');
      expect(Validator.validateShapeType('diamond')).toBe('diamond');
    });

    test('throws ValidationError for invalid shape types', () => {
      expect(() => Validator.validateShapeType('')).toThrow(ValidationError);
      expect(() => Validator.validateShapeType(null)).toThrow(ValidationError);
      expect(() => Validator.validateShapeType(123)).toThrow(ValidationError);
      expect(() => Validator.validateShapeType('invalid')).toThrow(ValidationError);
      expect(() => Validator.validateShapeType('circle')).toThrow(ValidationError);
      expect(() => Validator.validateShapeType('square')).toThrow(ValidationError);
    });
  });

  describe('validateHexColor', () => {
    test('validates correct hex colors', () => {
      expect(Validator.validateHexColor('#FF0000')).toBe('#FF0000');
      expect(Validator.validateHexColor('#F00')).toBe('#F00');
      expect(Validator.validateHexColor('#abc123')).toBe('#ABC123');
      expect(Validator.validateHexColor('#ABC')).toBe('#ABC');
      expect(Validator.validateHexColor('  #ff0000  ')).toBe('#FF0000');
    });

    test('converts to uppercase', () => {
      expect(Validator.validateHexColor('#ff0000')).toBe('#FF0000');
      expect(Validator.validateHexColor('#abc')).toBe('#ABC');
    });

    test('throws ValidationError for invalid hex colors', () => {
      expect(() => Validator.validateHexColor('')).toThrow(ValidationError);
      expect(() => Validator.validateHexColor(null)).toThrow(ValidationError);
      expect(() => Validator.validateHexColor(123)).toThrow(ValidationError);
      expect(() => Validator.validateHexColor('FF0000')).toThrow(ValidationError); // missing #
      expect(() => Validator.validateHexColor('#GG0000')).toThrow(ValidationError); // invalid character
      expect(() => Validator.validateHexColor('#FF00')).toThrow(ValidationError); // wrong length
      expect(() => Validator.validateHexColor('#FF00000')).toThrow(ValidationError); // wrong length
      expect(() => Validator.validateHexColor('#')).toThrow(ValidationError); // just #
    });
  });
});