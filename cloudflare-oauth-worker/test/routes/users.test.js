import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleBanUser, handleUnbanUser } from '../../src/routes/users.js';

// Mock dependencies
vi.mock('../../src/lib/auth.js', () => ({
  getEmailFromSessionToken: vi.fn(),
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
      USER_SESSIONS: 'mock-user-sessions-namespace',
      USER: {
        idFromName: vi.fn().mockReturnValue('mock-user-id'),
        get: vi.fn().mockReturnValue({
          fetch: vi.fn().mockImplementation((request) => {
            const url = new URL(request.url);
            if (url.hostname === 'ban-user') {
              return Promise.resolve({
                json: () => Promise.resolve({ success: true, message: 'User banned successfully' })
              });
            } else if (url.hostname === 'unban-user') {
              return Promise.resolve({
                json: () => Promise.resolve({ success: true, message: 'User unbanned successfully' })
              });
            }
            return Promise.resolve({
              json: () => Promise.resolve({ success: true, message: 'User banned successfully' })
            });
          })
        })
      }
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

  describe('handleBanUser', () => {
    describe('happy path', () => {
      it('should ban user successfully', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue(true);
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
            'Authorization': 'admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'user@example.com'
          })
        });

        const response = await handleBanUser(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.message).toBe('User banned successfully');
      });

      it('should ban user without reason', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue(true);
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
            'Authorization': 'admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'user@example.com'
          })
        });

        const response = await handleBanUser(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should require admin privileges', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue('user@example.com');
        isAdmin.mockReturnValue(false);

        const mockRequest = new Request('https://example.com/users/user123/ban', {
          method: 'POST',
          headers: {
            'Authorization': 'user-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'user@example.com'
          })
        });

        const response = await handleBanUser(mockRequest, mockEnv);
        
        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error).toBe('Admin access required');
      });

      it('should handle missing session cookie', async () => {
        const mockRequest = new Request('https://example.com/users/user123/ban', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'user@example.com'
          })
        });

        const response = await handleBanUser(mockRequest, mockEnv);
        
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toBe('No session token provided');
      });

      it('should handle invalid session', async () => {
        const { getEmailFromSessionToken } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue(false);

        const mockRequest = new Request('https://example.com/users/user123/ban', {
          method: 'POST',
          headers: {
            'Authorization': 'invalid-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'user@example.com'
          })
        });

        const response = await handleBanUser(mockRequest, mockEnv);
        
        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error).toBe('Invalid session token');
      });

      it('should handle missing request body', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/users/user123/ban', {
          method: 'POST',
          headers: {
            'Authorization': 'admin-session-id'
          }
          // No body
        });

        await expect(handleBanUser(mockRequest, mockEnv)).rejects.toThrow('Unexpected end of JSON input');
      });

      it('should handle invalid JSON in request body', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue('admin@example.com');
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/users/user123/ban', {
          method: 'POST',
          headers: {
            'Authorization': 'admin-session-id',
            'Content-Type': 'application/json'
          },
          body: 'invalid-json{'
        });

        await expect(handleBanUser(mockRequest, mockEnv)).rejects.toThrow('Unexpected token');
      });

      it('should handle very long ban reasons', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        const longReason = 'A'.repeat(10000); // Very long reason

        const mockRequest = new Request('https://example.com/users/user123/ban', {
          method: 'POST',
          headers: {
            'Authorization': 'admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'user@example.com'
          })
        });

        const response = await handleBanUser(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
      });

      it('should handle user not found', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        mockUser.put.mockResolvedValue(null);

        const mockRequest = new Request('https://example.com/users/non-existent/ban', {
          method: 'POST',
          headers: {
            'Authorization': 'admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'user@example.com'
          })
        });

        const response = await handleBanUser(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
      });

      it('should handle already banned users', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue(true);
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
            'Authorization': 'admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'user@example.com'
          })
        });

        const response = await handleBanUser(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.message).toBe('User banned successfully');
      });
    });
  });

  describe('handleUnbanUser', () => {
    describe('happy path', () => {
      it('should unban user successfully', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue(true);
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
            'Authorization': 'admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'user@example.com'
          })
        });

        const response = await handleUnbanUser(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.message).toBe('User unbanned successfully');
      });
    });

    describe('edge cases', () => {
      it('should require admin privileges', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue('user@example.com');
        isAdmin.mockReturnValue(false);

        const mockRequest = new Request('https://example.com/users/user123/unban', {
          method: 'POST',
          headers: {
            'Authorization': 'user-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'user@example.com'
          })
        });

        const response = await handleUnbanUser(mockRequest, mockEnv);
        
        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error).toBe('Admin access required');
      });

      it('should handle unbanning non-banned users', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue(true);
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
            'Authorization': 'admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'user@example.com'
          })
        });

        const response = await handleUnbanUser(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
      });

      it('should handle user not found', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        mockUser.put.mockResolvedValue(null);

        const mockRequest = new Request('https://example.com/users/non-existent/unban', {
          method: 'POST',
          headers: {
            'Authorization': 'admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'user@example.com'
          })
        });

        const response = await handleUnbanUser(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
      });

      it('should handle missing request body', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/users/user123/unban', {
          method: 'POST',
          headers: {
            'Authorization': 'admin-session-id'
          }
          // No body
        });

        await expect(handleUnbanUser(mockRequest, mockEnv)).rejects.toThrow('Unexpected end of JSON input');
      });

      it('should handle unban errors gracefully', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        mockUser.put.mockRejectedValue(new Error('Unban failed'));

        const mockRequest = new Request('https://example.com/users/user123/unban', {
          method: 'POST',
          headers: {
            'Authorization': 'admin-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'user@example.com'
          })
        });

        const response = await handleUnbanUser(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
      });
    });
  });
});
