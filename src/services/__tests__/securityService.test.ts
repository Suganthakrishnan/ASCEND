import {
  sanitizeText,
  sanitizeNumber,
  validateEmail,
} from '../securityService';

describe('securityService', () => {
  describe('sanitizeText', () => {
    it('should strip HTML tags', () => {
      expect(sanitizeText('<script>alert("xss")</script>Hello')).toBe('Hello');
      expect(sanitizeText('<b>Bold</b> text')).toBe('Bold text');
      expect(sanitizeText('<a href="http://evil.com">Link</a>')).toBe('Link');
    });

    it('should trim whitespace', () => {
      expect(sanitizeText('  hello world  ')).toBe('hello world');
      expect(sanitizeText('\t\n  test  \n\t')).toBe('test');
    });

    it('should limit length to maxLength', () => {
      expect(sanitizeText('a'.repeat(100), 10)).toBe('a'.repeat(10));
      expect(sanitizeText('short', 100)).toBe('short');
    });

    it('should use default maxLength of 1000', () => {
      const longText = 'a'.repeat(1500);
      expect(sanitizeText(longText).length).toBe(1000);
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeText(null as any)).toBe('');
      expect(sanitizeText(undefined as any)).toBe('');
      expect(sanitizeText(123 as any)).toBe('');
      expect(sanitizeText({} as any)).toBe('');
    });

    it('should handle empty strings', () => {
      expect(sanitizeText('')).toBe('');
    });
  });

  describe('sanitizeNumber', () => {
    it('should parse valid numbers', () => {
      expect(sanitizeNumber('123')).toBe(123);
      expect(sanitizeNumber('45.67')).toBe(45.67);
      expect(sanitizeNumber(789)).toBe(789);
      expect(sanitizeNumber('0')).toBe(0);
    });

    it('should clamp to min value', () => {
      expect(sanitizeNumber(-5, 0)).toBe(0);
      expect(sanitizeNumber(-100, 10)).toBe(10);
    });

    it('should clamp to max value', () => {
      expect(sanitizeNumber(150, 0, 100)).toBe(100);
      expect(sanitizeNumber(999, 0, 50)).toBe(50);
    });

    it('should return min for invalid input', () => {
      expect(sanitizeNumber('abc')).toBe(0);
      expect(sanitizeNumber(null)).toBe(0);
      expect(sanitizeNumber(undefined)).toBe(0);
      expect(sanitizeNumber(NaN)).toBe(0);
    });

    it('should use default min of 0 and max of MAX_SAFE_INTEGER', () => {
      expect(sanitizeNumber('1000')).toBe(1000);
      expect(sanitizeNumber('-5')).toBe(0);
    });
  });

  describe('validateEmail', () => {
    it('should validate valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('user@sub.domain.com')).toBe(true);
      expect(validateEmail('a@b.c')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('user domain@com')).toBe(false);
      expect(validateEmail('user@domain..com')).toBe(false);
    });

    it('should handle non-string input', () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
      expect(validateEmail(123 as any)).toBe(false);
      expect(validateEmail({} as any)).toBe(false);
    });

    it('should reject emails with invalid characters', () => {
      expect(validateEmail('user name@example.com')).toBe(false);
      expect(validateEmail('user@exa$mple.com')).toBe(false);
    });
  });
});
