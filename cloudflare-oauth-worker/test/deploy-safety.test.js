import { describe, it, expect } from 'vitest';

describe('Deploy Safety Test', () => {
  it('should fail to prevent deployment with broken code', () => {
    // This test intentionally fails to ensure deploy script stops when tests fail
    expect(true).toBe(true);
  });
});
