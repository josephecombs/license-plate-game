import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleUserBan, handleUserUnban } from '../../src/routes/users.js';

// Mock dependencies
vi.mock('../../src/lib/auth.js', () => ({
  validateSession: vi.fn(),
  isAdmin: vi.fn()
}));

vi.mock('../../src/durable-objects/User.js', () => ({
  User: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }))
}));

describe('Users Routes', () => {
  let mockEnv;
  let mockContext;
  let mockUser;

  beforeEach(() => {
    mockEnv = {
      USERS: 'mock-users-namespace',
      USER_SESSIONS: 'mock-user-sessions-namespace'
    };

    mockContext = {
      waitUntil: vi.fn()
    };

    mockUser = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };

    vi.clearAllMocks();
  });

  describe('handleUserBan', () => {
    describe('happy path', () => {
      it('should ban user successfully', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        const mockUserData = {
          id: 'user123',
          email: 'user@example.com',
          isBanned: true,
          bannedAt: Date.now(),
          bannedBy: 'admin@example.com'
        };

        mockUser.put.mockResolvedValue(mockUserData);

        const mockRequest = new Request('https://example.com/users/user123/ban', {
          method: 'POST',
          headers: {
            'Cookie': 'session=admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: 'Violation of terms of service'
          })
        });

        const response = await handleUserBan(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.message).toContain('User banned');
        expect(body.user.isBanned).toBe(true);
      });

      it('should ban user without reason', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        const mockUserData = {
          id: 'user123',
          email: 'user@example.com',
          isBanned: true,
          bannedAt: Date.now(),
          bannedBy: 'admin@example.com'
        };

        mockUser.put.mockResolvedValue(mockUserData);

        const mockRequest = new Request('https://example.com/users/user123/ban', {
          method: 'POST',
          headers: {
            'Cookie': 'session=admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });

        const response = await handleUserBan(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.message).toContain('User banned');
      });
    });

    describe('edge cases', () => {
      it('should require admin privileges', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(false);

        const mockRequest = new Request('https://example.com/users/user123/ban', {
          method: 'POST',
          headers: {
            'Cookie': 'session=user-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: 'Test reason'
          })
        });

        const response = await handleUserBan(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error).toContain('Admin access required');
      });

      it('should handle missing session cookie', async () => {
        const mockRequest = new Request('https://example.com/users/user123/ban', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: 'Test reason'
          })
        });

        const response = await handleUserBan(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toContain('Unauthorized');
      });

      it('should handle invalid session', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(false);

        const mockRequest = new Request('https://example.com/users/user123/ban', {
          method: 'POST',
          headers: {
            'Cookie': 'session=invalid-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: 'Test reason'
          })
        });

        const response = await handleUserBan(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toContain('Unauthorized');
      });

      it('should handle missing request body', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/users/user123/ban', {
          method: 'POST',
          headers: {
            'Cookie': 'session=admin-session-id'
          }
          // No body
        });

        const response = await handleUserBan(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('Request body required');
      });

      it('should handle invalid JSON in request body', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/users/user123/ban', {
          method: 'POST',
          headers: {
            'Cookie': 'session=admin-session-id',
            'Content-Type': 'application/json'
          },
          body: 'invalid-json{'
        });

        const response = await handleUserBan(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('Invalid JSON');
      });

      it('should handle very long ban reasons', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        const longReason = 'A'.repeat(10000); // Very long reason

        const mockRequest = new Request('https://example.com/users/user123/ban', {
          method: 'POST',
          headers: {
            'Cookie': 'session=admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: longReason
          })
        });

        const response = await handleUserBan(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('Reason too long');
      });

      it('should handle user not found', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        mockUser.put.mockResolvedValue(null);

        const mockRequest = new Request('https://example.com/users/non-existent/ban', {
          method: 'POST',
          headers: {
            'Cookie': 'session=admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: 'Test reason'
          })
        });

        const response = await handleUserBan(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.error).toContain('User not found');
      });

      it('should handle already banned users', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        const mockUserData = {
          id: 'user123',
          email: 'user@example.com',
          isBanned: true,
          bannedAt: Date.now() - 86400000, // Banned 1 day ago
          bannedBy: 'admin@example.com'
        };

        mockUser.put.mockResolvedValue(mockUserData);

        const mockRequest = new Request('https://example.com/users/user123/ban', {
          method: 'POST',
          headers: {
            'Cookie': 'session=admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: 'Already banned'
          })
        });

        const response = await handleUserBan(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.message).toContain('User banned');
        expect(body.user.isBanned).toBe(true);
      });
    });
  });

  describe('handleUserUnban', () => {
    describe('happy path', () => {
      it('should unban user successfully', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        const mockUserData = {
          id: 'user123',
          email: 'user@example.com',
          isBanned: false,
          unbannedAt: Date.now(),
          unbannedBy: 'admin@example.com'
        };

        mockUser.put.mockResolvedValue(mockUserData);

        const mockRequest = new Request('https://example.com/users/user123/unban', {
          method: 'POST',
          headers: {
            'Cookie': 'session=admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: 'Appeal granted'
          })
        });

        const response = await handleUserUnban(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.message).toContain('User unbanned');
        expect(body.user.isBanned).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should require admin privileges', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(false);

        const mockRequest = new Request('https://example.com/users/user123/unban', {
          method: 'POST',
          headers: {
            'Cookie': 'session=user-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: 'Test reason'
          })
        });

        const response = await handleUserUnban(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error).toContain('Admin access required');
      });

      it('should handle unbanning non-banned users', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        const mockUserData = {
          id: 'user123',
          email: 'user@example.com',
          isBanned: false
        };

        mockUser.put.mockResolvedValue(mockUserData);

        const mockRequest = new Request('https://example.com/users/user123/unban', {
          method: 'POST',
          headers: {
            'Cookie': 'session=admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: 'Test reason'
          })
        });

        const response = await handleUserUnban(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('User is not banned');
      });

      it('should handle user not found', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        mockUser.put.mockResolvedValue(null);

        const mockRequest = new Request('https://example.com/users/non-existent/unban', {
          method: 'POST',
          headers: {
            'Cookie': 'session=admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: 'Test reason'
          })
        });

        const response = await handleUserUnban(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.error).toContain('User not found');
      });

      it('should handle missing request body', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/users/user123/unban', {
          method: 'POST',
          headers: {
            'Cookie': 'session=admin-session-id'
          }
          // No body
        });

        const response = await handleUserUnban(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('Request body required');
      });

      it('should handle unban errors gracefully', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        mockUser.put.mockRejectedValue(new Error('Unban failed'));

        const mockRequest = new Request('https://example.com/users/user123/unban', {
          method: 'POST',
          headers: {
            'Cookie': 'session=admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: 'Test reason'
          })
        });

        const response = await handleUserUnban(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toContain('Unban failed');
      });
    });
  });
});
