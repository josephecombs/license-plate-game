import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEmailFromSessionToken, isAdmin, validateSession } from '../../src/lib/auth.js';

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
  let mockUser;

  beforeEach(() => {
    // Mock Durable Object namespaces
    mockUserSession = {
      fetch: vi.fn()
    };
    
    mockUser = {
      fetch: vi.fn()
    };

    mockEnv = {
      USER_SESSIONS: {
        idFromName: vi.fn().mockReturnValue('mock-user-session-id'),
        get: vi.fn().mockReturnValue(mockUserSession)
      },
      USER: {
        idFromName: vi.fn().mockReturnValue('mock-user-id'),
        get: vi.fn().mockReturnValue(mockUser)
      }
    };
  });

  describe('getEmailFromSessionToken', () => {
    describe('happy path', () => {
      it('should return email for valid session token', async () => {
        mockUserSession.fetch.mockResolvedValue({
          json: vi.fn().mockResolvedValue({
            email: 'test@example.com'
          })
        });

        const result = await getEmailFromSessionToken('valid-session-id', mockEnv);
        expect(result).toBe('test@example.com');
        expect(mockEnv.USER_SESSIONS.idFromName).toHaveBeenCalledWith('valid-session-id');
        expect(mockEnv.USER_SESSIONS.get).toHaveBeenCalledWith('mock-user-session-id');
      });
    });

    describe('edge cases', () => {
      it('should handle missing email in session data', async () => {
        mockUserSession.fetch.mockResolvedValue({
          json: vi.fn().mockResolvedValue({
            // Missing email
          })
        });

        const result = await getEmailFromSessionToken('invalid-session-id', mockEnv);
        expect(result).toBeUndefined();
      });

      it('should handle null session data', async () => {
        mockUserSession.fetch.mockResolvedValue({
          json: vi.fn().mockResolvedValue(null)
        });

        const result = await getEmailFromSessionToken('null-session-id', mockEnv);
        expect(result).toBeUndefined();
      });
    });
  });

  describe('isAdmin', () => {
    describe('happy path', () => {
      it('should return true for admin email', () => {
        const result = isAdmin('joseph.e.combs@gmail.com');
        expect(result).toBe(true);
      });

      it('should return false for non-admin email', () => {
        const result = isAdmin('user@example.com');
        expect(result).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should return false for empty email', () => {
        const result = isAdmin('');
        expect(result).toBe(false);
      });

      it('should return false for null email', () => {
        const result = isAdmin(null);
        expect(result).toBe(false);
      });

      it('should return false for undefined email', () => {
        const result = isAdmin(undefined);
        expect(result).toBe(false);
      });

      it('should be case sensitive', () => {
        const result = isAdmin('JOSEPH.E.COMBS@GMAIL.COM');
        expect(result).toBe(false);
      });
    });
  });

  describe('validateSession', () => {
    describe('happy path', () => {
      it('should return valid user data for valid session', async () => {
        mockUserSession.fetch.mockResolvedValue({
          json: vi.fn().mockResolvedValue({
            email: 'test@example.com'
          })
        });

        mockUser.fetch.mockResolvedValue({
          json: vi.fn().mockResolvedValue({
            userId: 'user123',
            name: 'Test User'
          })
        });

        const result = await validateSession('valid-session-id', mockEnv);
        expect(result).toEqual({
          valid: true,
          user: { userId: 'user123', name: 'Test User' },
          email: 'test@example.com'
        });
      });
    });

    describe('edge cases', () => {
      it('should return error for missing session token', async () => {
        const result = await validateSession(null, mockEnv);
        expect(result).toEqual({
          valid: false,
          error: 'No session token provided'
        });
      });

      it('should return error for empty session token', async () => {
        const result = await validateSession('', mockEnv);
        expect(result).toEqual({
          valid: false,
          error: 'No session token provided'
        });
      });

      it('should return error for invalid session token', async () => {
        mockUserSession.fetch.mockResolvedValue({
          json: vi.fn().mockResolvedValue(null)
        });

        const result = await validateSession('invalid-session-id', mockEnv);
        expect(result).toEqual({
          valid: false,
          error: 'Invalid session token'
        });
      });

      it('should return error for session without email', async () => {
        mockUserSession.fetch.mockResolvedValue({
          json: vi.fn().mockResolvedValue({
            // Missing email
          })
        });

        const result = await validateSession('no-email-session-id', mockEnv);
        expect(result).toEqual({
          valid: false,
          error: 'Invalid session token'
        });
      });
    });
  });
});
