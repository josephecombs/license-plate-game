import { describe, it, expect } from 'vitest';
import { STATES } from '../../src/constants/states.js';

describe('States Constants', () => {
  describe('happy path', () => {
    it('should export STATES object', () => {
      expect(STATES).toBeDefined();
      expect(typeof STATES).toBe('object');
    });

    it('should contain all 50 US states plus DC', () => {
      expect(Object.keys(STATES)).toHaveLength(51);
    });

    it('should have correct state mappings', () => {
      expect(STATES['AL']).toBe('Alabama');
      expect(STATES['CA']).toBe('California');
      expect(STATES['NY']).toBe('New York');
      expect(STATES['TX']).toBe('Texas');
      expect(STATES['DC']).toBe('District of Columbia');
      expect(STATES['YT']).toBe('Yukon');
    });

    it('should have consistent format (2-letter codes to full names)', () => {
      Object.entries(STATES).forEach(([code, name]) => {
        expect(code).toMatch(/^[A-Z]{2}$/);
        // State names should start with uppercase letter and contain letters and spaces
        expect(name).toMatch(/^[A-Z][a-zA-Z\s]+$/);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle all state codes as valid keys', () => {
      const validCodes = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
                         'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                         'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                         'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                         'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
      
      validCodes.forEach(code => {
        expect(STATES[code]).toBeDefined();
        expect(STATES[code]).toBeTruthy();
      });
    });

    it('should not contain empty or null values', () => {
      Object.values(STATES).forEach(name => {
        expect(name).toBeTruthy();
        expect(name).not.toBe('');
        expect(name).not.toBeNull();
        expect(name).not.toBeUndefined();
      });
    });

    it('should not have duplicate state names', () => {
      const names = Object.values(STATES);
      const uniqueNames = new Set(names);
      expect(names.length).toBe(uniqueNames.size);
    });

    it('should not have duplicate state codes', () => {
      const codes = Object.keys(STATES);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });
  });
});
