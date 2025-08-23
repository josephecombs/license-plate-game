import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateSession, isAdmin, getUserFromSession } from '../../src/lib/auth.js';

// Mock the UserSession class
vi.mock('../../src/userSession.js', () => ({
  UserSession: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }))
}));

describe('Auth Library', () => {
  let mockEnv;
  let mockUserSession;

  beforeEach(() => {
    mockEnv = {
      USER_SESSIONS: 'mock-user-sessions-namespace'
    };
    
    mockUserSession = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };
  });

  describe('validateSession', () => {
    describe('happy path', () => {
      it('should return true for valid session', async () => {
        mockUserSession.get.mockResolvedValue({
          userId: 'user123',
          email: 'test@example.com',
          expiresAt: Date.now() + 3600000 // 1 hour from now
        });

        const result = await validateSession(mockEnv, 'valid-session-id');
        expect(result).toBe(true);
      });

      it('should return false for expired session', async () => {
        mockUserSession.get.mockResolvedValue({
          userId: 'user123',
          email: 'test@example.com',
          expiresAt: Date.now() - 3600000 // 1 hour ago
        });

        const result = await validateSession(mockEnv, 'expired-session-id');
        expect(result).toBe(false);
      });

      it('should return false for non-existent session', async () => {
        mockUserSession.get.mockResolvedValue(null);

        const result = await validateSession(mockEnv, 'non-existent-session-id');
        expect(result).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle missing session data gracefully', async () => {
        mockUserSession.get.mockResolvedValue({
          userId: 'user123'
          // Missing email and expiresAt
        });

        const result = await validateSession(mockEnv, 'incomplete-session-id');
        expect(result).toBe(false);
      });

      it('should handle malformed session data', async () => {
        mockUserSession.get.mockResolvedValue({
          userId: null,
          email: '',
          expiresAt: 'invalid-date'
        });

        const result = await validateSession(mockEnv, 'malformed-session-id');
        expect(result).toBe(false);
      });

      it('should handle session with exactly expired timestamp', async () => {
        mockUserSession.get.mockResolvedValue({
          userId: 'user123',
          email: 'test@example.com',
          expiresAt: Date.now() // exactly now
        });

        const result = await validateSession(mockEnv, 'expired-now-session-id');
        expect(result).toBe(false);
      });
    });
  });

  describe('isAdmin', () => {
    describe('happy path', () => {
      it('should return true for admin user', async () => {
        mockUserSession.get.mockResolvedValue({
          userId: 'admin123',
          email: 'admin@example.com',
          isAdmin: true
        });

        const result = await isAdmin(mockEnv, 'admin-session-id');
        expect(result).toBe(true);
      });

      it('should return false for non-admin user', async () => {
        mockUserSession.get.mockResolvedValue({
          userId: 'user123',
          email: 'user@example.com',
          isAdmin: false
        });

        const result = await isAdmin(mockEnv, 'user-session-id');
        expect(result).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should return false for session without admin flag', async () => {
        mockUserSession.get.mockResolvedValue({
          userId: 'user123',
          email: 'user@example.com'
          // Missing isAdmin flag
        });

        const result = await isAdmin(mockEnv, 'no-admin-flag-session-id');
        expect(result).toBe(false);
      });

      it('should return false for null session', async () => {
        mockUserSession.get.mockResolvedValue(null);

        const result = await isAdmin(mockEnv, 'null-session-id');
        expect(result).toBe(false);
      });
    });
  });

  describe('getUserFromSession', () => {
    describe('happy path', () => {
      it('should return user data for valid session', async () => {
        const userData = {
          userId: 'user123',
          email: 'test@example.com',
          name: 'Test User'
        };
        mockUserSession.get.mockResolvedValue(userData);

        const result = await getUserFromSession(mockEnv, 'valid-session-id');
        expect(result).toEqual(userData);
      });
    });

    describe('edge cases', () => {
      it('should return null for non-existent session', async () => {
        mockUserSession.get.mockResolvedValue(null);

        const result = await getUserFromSession(mockEnv, 'non-existent-session-id');
        expect(result).toBeNull();
      });

      it('should return null for expired session', async () => {
        mockUserSession.get.mockResolvedValue({
          userId: 'user123',
          email: 'test@example.com',
          expiresAt: Date.now() - 3600000
        });

        const result = await getUserFromSession(mockEnv, 'expired-session-id');
        expect(result).toBeNull();
      });
    });
  });
});
