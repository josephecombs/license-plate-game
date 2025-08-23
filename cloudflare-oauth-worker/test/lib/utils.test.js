import { describe, it, expect } from 'vitest';
import { anonymizeEmail, detectStateFromPlate } from '../../src/lib/utils.js';

describe('Utils Library', () => {
  describe('anonymizeEmail', () => {
    describe('happy path', () => {
      it('should anonymize standard email addresses', () => {
        expect(anonymizeEmail('john.doe@example.com')).toBe('j***.d**@example.com');
        expect(anonymizeEmail('user@domain.org')).toBe('u***@domain.org');
        expect(anonymizeEmail('test123@company.co.uk')).toBe('t******@company.co.uk');
      });

      it('should handle single character usernames', () => {
        expect(anonymizeEmail('a@example.com')).toBe('a@example.com');
        expect(anonymizeEmail('b@test.org')).toBe('b@test.org');
      });

      it('should handle two character usernames', () => {
        expect(anonymizeEmail('ab@example.com')).toBe('a*@example.com');
        expect(anonymizeEmail('xy@test.org')).toBe('x*@test.org');
      });

      it('should handle three character usernames', () => {
        expect(anonymizeEmail('abc@example.com')).toBe('a**@example.com');
        expect(anonymizeEmail('xyz@test.org')).toBe('x**@test.org');
      });

      it('should preserve domain completely', () => {
        expect(anonymizeEmail('user@example.com')).toBe('u***@example.com');
        expect(anonymizeEmail('admin@subdomain.example.co.uk')).toBe('a****@subdomain.example.co.uk');
      });
    });

    describe('edge cases', () => {
      it('should handle empty string', () => {
        expect(anonymizeEmail('')).toBe('');
      });

      it('should handle null input', () => {
        expect(anonymizeEmail(null)).toBe('');
      });

      it('should handle undefined input', () => {
        expect(anonymizeEmail(undefined)).toBe('');
      });

      it('should handle email without @ symbol', () => {
        expect(anonymizeEmail('invalid-email')).toBe('invalid-email');
      });

      it('should handle email with multiple @ symbols', () => {
        expect(anonymizeEmail('user@domain@example.com')).toBe('u***@domain@example.com');
      });

      it('should handle email with no username', () => {
        expect(anonymizeEmail('@example.com')).toBe('@example.com');
      });

      it('should handle email with no domain', () => {
        expect(anonymizeEmail('user@')).toBe('u***@');
      });

      it('should handle very long usernames', () => {
        const longUsername = 'a'.repeat(100);
        const email = `${longUsername}@example.com`;
        const expected = `${longUsername[0]}${'*'.repeat(99)}@example.com`;
        expect(anonymizeEmail(email)).toBe(expected);
      });

      it('should handle special characters in username', () => {
        expect(anonymizeEmail('user-name@example.com')).toBe('u****-****@example.com');
        expect(anonymizeEmail('user_name@example.com')).toBe('u****_****@example.com');
        expect(anonymizeEmail('user+tag@example.com')).toBe('u****+***@example.com');
        expect(anonymizeEmail('user.tag@example.com')).toBe('u****.t**@example.com');
      });

      it('should handle numbers in username', () => {
        expect(anonymizeEmail('user123@example.com')).toBe('u*******@example.com');
        expect(anonymizeEmail('123user@example.com')).toBe('1*******@example.com');
      });
    });
  });

  describe('detectStateFromPlate', () => {
    describe('happy path', () => {
      it('should detect state from valid license plate', () => {
        expect(detectStateFromPlate('ABC123')).toBe('CA');
        expect(detectStateFromPlate('XYZ789')).toBe('NY');
        expect(detectStateFromPlate('DEF456')).toBe('TX');
      });

      it('should handle plates with different formats', () => {
        expect(detectStateFromPlate('123ABC')).toBe('CA');
        expect(detectStateFromPlate('ABC-123')).toBe('CA');
        expect(detectStateFromPlate('ABC 123')).toBe('CA');
      });

      it('should return null for unrecognized plates', () => {
        expect(detectStateFromPlate('UNKNOWN')).toBeNull();
        expect(detectStateFromPlate('123456')).toBeNull();
        expect(detectStateFromPlate('ABCDEF')).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should handle empty string', () => {
        expect(detectStateFromPlate('')).toBeNull();
      });

      it('should handle null input', () => {
        expect(detectStateFromPlate(null)).toBeNull();
      });

      it('should handle undefined input', () => {
        expect(detectStateFromPlate(undefined)).toBeNull();
      });

      it('should handle very long plates', () => {
        const longPlate = 'A'.repeat(1000);
        expect(detectStateFromPlate(longPlate)).toBeNull();
      });

      it('should handle plates with special characters', () => {
        expect(detectStateFromPlate('ABC@123')).toBeNull();
        expect(detectStateFromPlate('ABC#123')).toBeNull();
        expect(detectStateFromPlate('ABC$123')).toBeNull();
      });

      it('should handle plates with spaces and dashes', () => {
        expect(detectStateFromPlate('ABC - 123')).toBeNull();
        expect(detectStateFromPlate('ABC--123')).toBeNull();
        expect(detectStateFromPlate('ABC  123')).toBeNull();
      });

      it('should handle case sensitivity', () => {
        expect(detectStateFromPlate('abc123')).toBe('CA');
        expect(detectStateFromPlate('AbC123')).toBe('CA');
        expect(detectStateFromPlate('ABC123')).toBe('CA');
      });

      it('should handle plates with only numbers', () => {
        expect(detectStateFromPlate('123456')).toBeNull();
        expect(detectStateFromPlate('000000')).toBeNull();
        expect(detectStateFromPlate('999999')).toBeNull();
      });

      it('should handle plates with only letters', () => {
        expect(detectStateFromPlate('ABCDEF')).toBeNull();
        expect(detectStateFromPlate('AAAAAA')).toBeNull();
        expect(detectStateFromPlate('ZZZZZZ')).toBeNull();
      });
    });
  });
});
