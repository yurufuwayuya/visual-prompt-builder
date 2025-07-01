import { describe, it, expect } from 'vitest';

// Sample validation utilities to test
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidHexColor = (color: string): boolean => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};

export const sanitizeText = (text: string): string => {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
};

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('validates correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.jp')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidHexColor', () => {
    it('validates correct hex colors', () => {
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#FFFFFF')).toBe(true);
      expect(isValidHexColor('#abc123')).toBe(true);
      expect(isValidHexColor('#ABC')).toBe(true);
      expect(isValidHexColor('#123')).toBe(true);
    });

    it('rejects invalid hex colors', () => {
      expect(isValidHexColor('000000')).toBe(false);
      expect(isValidHexColor('#GGGGGG')).toBe(false);
      expect(isValidHexColor('#12345')).toBe(false);
      expect(isValidHexColor('#1234567')).toBe(false);
      expect(isValidHexColor('')).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    it('removes leading and trailing whitespace', () => {
      expect(sanitizeText('  hello  ')).toBe('hello');
      expect(sanitizeText('\t\nworld\r\n')).toBe('world');
    });

    it('normalizes multiple spaces', () => {
      expect(sanitizeText('hello    world')).toBe('hello world');
      expect(sanitizeText('multiple   spaces   here')).toBe('multiple spaces here');
    });

    it('removes potential HTML tags', () => {
      expect(sanitizeText('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeText('hello <b>world</b>')).toBe('hello bworld/b');
    });

    it('handles empty strings', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText('   ')).toBe('');
    });

    it('preserves Japanese characters', () => {
      expect(sanitizeText('こんにちは　世界')).toBe('こんにちは 世界');
      expect(sanitizeText('  日本語  ')).toBe('日本語');
    });
  });
});