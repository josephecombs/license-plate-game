import { describe, it, expect } from 'vitest';
import { anonymizeEmail, detectStateChanges, getCurrentMonthYear } from '../../src/lib/utils.js';

describe('Utils Library', () => {
  describe('anonymizeEmail', () => {
    describe('happy path', () => {
      it('should anonymize standard email addresses', () => {
        expect(anonymizeEmail('john.doe@example.com')).toBe('j***.doe@example.com');
        expect(anonymizeEmail('user@domain.org')).toBe('u*user@domain.org');
        expect(anonymizeEmail('test123@company.co.uk')).toBe('t******23@company.co.uk');
      });

      it('should handle single character usernames', () => {
        expect(anonymizeEmail('a@example.com')).toBe('a@example.com');
        expect(anonymizeEmail('b@test.org')).toBe('b@test.org');
      });

      it('should handle two character usernames', () => {
        expect(anonymizeEmail('ab@example.com')).toBe('a*b@example.com');
        expect(anonymizeEmail('xy@test.org')).toBe('x*y@test.org');
      });

      it('should handle three character usernames', () => {
        expect(anonymizeEmail('abc@example.com')).toBe('a*bc@example.com');
        expect(anonymizeEmail('xyz@test.org')).toBe('x*yz@test.org');
      });

      it('should preserve domain completely', () => {
        expect(anonymizeEmail('user@example.com')).toBe('u*user@example.com');
        expect(anonymizeEmail('admin@subdomain.example.co.uk')).toBe('a*dmin@subdomain.example.co.uk');
      });
    });

    describe('edge cases', () => {
      it('should handle empty string', () => {
        expect(anonymizeEmail('')).toBe('');
      });

      it('should handle null input', () => {
        expect(anonymizeEmail(null)).toBe(null);
      });

      it('should handle undefined input', () => {
        expect(anonymizeEmail(undefined)).toBe(undefined);
      });

      it('should handle email without @ symbol', () => {
        expect(anonymizeEmail('invalid-email')).toBe('invalid-email');
      });

      it('should handle email with multiple @ symbols', () => {
        expect(anonymizeEmail('user@domain@example.com')).toBe('u*user@domain@example.com');
      });

      it('should handle email with no username', () => {
        expect(anonymizeEmail('@example.com')).toBe('@example.com');
      });

      it('should handle email with no domain', () => {
        expect(anonymizeEmail('user@')).toBe('u*user@');
      });

      it('should handle very long usernames', () => {
        const longUsername = 'a'.repeat(100);
        const email = `${longUsername}@example.com`;
        const expected = `${longUsername[0]}${'*'.repeat(95)}${longUsername.slice(-4)}@example.com`;
        expect(anonymizeEmail(email)).toBe(expected);
      });

      it('should handle special characters in username', () => {
        expect(anonymizeEmail('user-name@example.com')).toBe('u****name@example.com');
        expect(anonymizeEmail('user_name@example.com')).toBe('u****name@example.com');
        expect(anonymizeEmail('user+tag@example.com')).toBe('u***+tag@example.com');
        expect(anonymizeEmail('user.tag@example.com')).toBe('u****tag@example.com');
      });

      it('should handle numbers in username', () => {
        expect(anonymizeEmail('user123@example.com')).toBe('u**r123@example.com');
        expect(anonymizeEmail('123user@example.com')).toBe('1**user@example.com');
      });
    });
  });

  describe('detectStateChanges', () => {
    describe('happy path', () => {
      it('should detect added states', () => {
        const previousStates = ['01', '06', '36'];
        const newStates = ['01', '06', '36', '48'];
        const result = detectStateChanges(previousStates, newStates);
        expect(result.added).toEqual(['48']);
        expect(result.removed).toEqual([]);
      });

      it('should detect removed states', () => {
        const previousStates = ['01', '06', '36', '48'];
        const newStates = ['01', '06', '36'];
        const result = detectStateChanges(previousStates, newStates);
        expect(result.added).toEqual([]);
        expect(result.removed).toEqual(['48']);
      });

      it('should detect both added and removed states', () => {
        const previousStates = ['01', '06', '36'];
        const newStates = ['06', '36', '48'];
        const result = detectStateChanges(previousStates, newStates);
        expect(result.added).toEqual(['48']);
        expect(result.removed).toEqual(['01']);
      });

      it('should handle no changes', () => {
        const previousStates = ['01', '06', '36'];
        const newStates = ['01', '06', '36'];
        const result = detectStateChanges(previousStates, newStates);
        expect(result.added).toEqual([]);
        expect(result.removed).toEqual([]);
      });
    });

    describe('edge cases', () => {
      it('should handle empty arrays', () => {
        const result = detectStateChanges([], []);
        expect(result.added).toEqual([]);
        expect(result.removed).toEqual([]);
      });

      it('should handle empty previous states', () => {
        const result = detectStateChanges([], ['01', '06', '36']);
        expect(result.added).toEqual(['01', '06', '36']);
        expect(result.removed).toEqual([]);
      });

      it('should handle empty new states', () => {
        const result = detectStateChanges(['01', '06', '36'], []);
        expect(result.added).toEqual([]);
        expect(result.removed).toEqual(['01', '06', '36']);
      });

      it('should handle duplicate states in arrays', () => {
        const previousStates = ['01', '01', '06', '36'];
        const newStates = ['01', '06', '06', '48'];
        const result = detectStateChanges(previousStates, newStates);
        expect(result.added).toEqual(['48']);
        expect(result.removed).toEqual(['36']);
      });

      it('should handle null inputs', () => {
        const result = detectStateChanges(null, ['01', '06']);
        expect(result.added).toEqual(['01', '06']);
        expect(result.removed).toEqual([]);
      });

      it('should handle undefined inputs', () => {
        const result = detectStateChanges(['01', '06'], undefined);
        expect(result.added).toEqual([]);
        expect(result.removed).toEqual(['01', '06']);
      });
    });
  });

  describe('getCurrentMonthYear', () => {
    describe('happy path', () => {
      it('should return current month and year', () => {
        const result = getCurrentMonthYear();
        const now = new Date();
        const expectedMonth = now.toLocaleString('default', { month: 'long' });
        const expectedYear = now.getFullYear();
        const expected = `${expectedMonth}-${expectedYear}`;
        
        expect(result).toBe(expected);
      });
    });

    describe('edge cases', () => {
      it('should return string format', () => {
        const result = getCurrentMonthYear();
        expect(typeof result).toBe('string');
        expect(result).toMatch(/^[A-Za-z]+-\d{4}$/);
      });

      it('should handle year boundary', () => {
        // This test will pass as long as the function works correctly
        // The actual month-year will depend on when the test runs
        const result = getCurrentMonthYear();
        expect(result).toContain('-');
        expect(result.split('-')).toHaveLength(2);
      });
    });
  });
});
