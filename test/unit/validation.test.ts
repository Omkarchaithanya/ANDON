import {
  isNonEmptyString,
  isValidISODate,
  sanitizeForDisplay,
  truncateForStorage,
} from '../../src/utils/validation';
import {
  validateConditionSchema,
  validateConfirmationInput,
  validateDismissalInput,
} from '../../src/models/schemas';

describe('Validation Utilities & Schemas', () => {
  describe('isNonEmptyString', () => {
    it('accepts valid non-empty string', () => {
      expect(isNonEmptyString('Aisle 7')).toBe(true);
    });

    it('rejects empty or whitespace-only string', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
    });
  });

  describe('isValidISODate', () => {
    it('validates ISO-8601 strings', () => {
      expect(isValidISODate('2026-11-07T14:33:52Z')).toBe(true);
      expect(isValidISODate('invalid-date')).toBe(false);
    });
  });

  describe('sanitizeForDisplay', () => {
    it('strips HTML/script tags', () => {
      const dirty = '<script>alert(1)</script>Aisle 7';
      expect(sanitizeForDisplay(dirty)).toBe('alert(1)Aisle 7');
    });
  });

  describe('truncateForStorage', () => {
    it('truncates strings longer than max length with ellipsis', () => {
      const long = 'This is a very long string that should be safely truncated';
      const truncated = truncateForStorage(long, 20);
      expect(truncated.length).toBe(20);
      expect(truncated.endsWith('...')).toBe(true);
    });
  });

  describe('validateConditionSchema', () => {
    it('approves supported attributes and values', () => {
      const res = validateConditionSchema('surface_finish', 'matte_epoxy');
      expect(res.isValid).toBe(true);
    });

    it('rejects unsupported attributes', () => {
      const res = validateConditionSchema('unsupported_robot_color', 'blue');
      expect(res.isValid).toBe(false);
    });
  });

  describe('validateConfirmationInput', () => {
    it('rejects missing parameters', () => {
      expect(() => {
        validateConfirmationInput({ changeIntentId: '' });
      }).toThrow();
    });
  });

  describe('validateDismissalInput', () => {
    it('requires a non-empty dismissal reason', () => {
      expect(() => {
        validateDismissalInput({ changeIntentId: 'ci-1', reason: '   ' });
      }).toThrow('A non-empty dismissal reason is required.');
    });
  });
});

