import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleOAuthCallback, handleSessionValidation } from '../../src/routes/auth.js';

// Mock dependencies
vi.mock('../../src/lib/auth.js', () => ({
  validateSession: vi.fn(),
  getUserFromSession: vi.fn()
}));

vi.mock('../../src/userSession.js', () => ({
  UserSession: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }))
}));

describe('Auth Routes', () => {
  let mockEnv;
  let mockRequest;
  let mockContext;

  beforeEach(() => {
    mockEnv = {
      USER_SESSIONS: 'mock-user-sessions-namespace',
      CLIENT_ID: 'test-client-id',
      CLIENT_SECRET: 'test-client-secret',
      REDIRECT_URI: 'https://example.com/callback'
    };

    mockContext = {
      waitUntil: vi.fn()
    };

    vi.clearAllMocks();
  });

  describe('handleOAuthCallback', () => {
    describe('happy path', () => {
      it('should handle successful OAuth callback with valid code', async () => {
        const mockRequest = new Request('https://example.com/callback?code=valid-code&state=valid-state');
        
        // Mock successful OAuth exchange
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'test-access-token',
            user: {
              id: 'user123',
              email: 'user@example.com',
              name: 'Test User'
            }
          })
        });

        const response = await handleOAuthCallback(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toContain('success');
      });

      it('should create session after successful OAuth', async () => {
        const mockRequest = new Request('https://example.com/callback?code=valid-code&state=valid-state');
        
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'test-access-token',
            user: {
              id: 'user123',
              email: 'user@example.com',
              name: 'Test User'
            }
          })
        });

        const response = await handleOAuthCallback(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(302);
        expect(mockContext.waitUntil).toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle missing code parameter', async () => {
        const mockRequest = new Request('https://example.com/callback?state=valid-state');
        
        const response = await handleOAuthCallback(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('code');
      });

      it('should handle missing state parameter', async () => {
        const mockRequest = new Request('https://example.com/callback?code=valid-code');
        
        const response = await handleOAuthCallback(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('state');
      });

      it('should handle OAuth exchange failure', async () => {
        const mockRequest = new Request('https://example.com/callback?code=valid-code&state=valid-state');
        
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          statusText: 'Bad Request'
        });

        const response = await handleOAuthCallback(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('OAuth exchange failed');
      });

      it('should handle network errors during OAuth exchange', async () => {
        const mockRequest = new Request('https://example.com/callback?code=valid-code&state=valid-state');
        
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const response = await handleOAuthCallback(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toContain('Network error');
      });

      it('should handle malformed OAuth response', async () => {
        const mockRequest = new Request('https://example.com/callback?code=valid-code&state=valid-state');
        
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            // Missing required fields
            access_token: 'test-access-token'
            // Missing user object
          })
        });

        const response = await handleOAuthCallback(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('Invalid OAuth response');
      });

      it('should handle missing environment variables', async () => {
        const incompleteEnv = {
          USER_SESSIONS: 'mock-user-sessions-namespace'
          // Missing CLIENT_ID, CLIENT_SECRET, REDIRECT_URI
        };

        const mockRequest = new Request('https://example.com/callback?code=valid-code&state=valid-state');
        
        const response = await handleOAuthCallback(mockRequest, incompleteEnv, mockContext);
        
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toContain('Missing OAuth configuration');
      });
    });
  });

  describe('handleSessionValidation', () => {
    describe('happy path', () => {
      it('should validate existing session successfully', async () => {
        const { validateSession, getUserFromSession } = await import('../../src/lib/auth.js');
        
        validateSession.mockResolvedValue(true);
        getUserFromSession.mockResolvedValue({
          userId: 'user123',
          email: 'user@example.com',
          name: 'Test User'
        });

        const mockRequest = new Request('https://example.com/validate-session', {
          headers: {
            'Cookie': 'session=valid-session-id'
          }
        });

        const response = await handleSessionValidation(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.valid).toBe(true);
        expect(body.user).toBeDefined();
      });

      it('should handle session without user data gracefully', async () => {
        const { validateSession, getUserFromSession } = await import('../../src/lib/auth.js');
        
        validateSession.mockResolvedValue(true);
        getUserFromSession.mockResolvedValue(null);

        const mockRequest = new Request('https://example.com/validate-session', {
          headers: {
            'Cookie': 'session=valid-session-id'
          }
        });

        const response = await handleSessionValidation(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.valid).toBe(false);
        expect(body.user).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should handle missing session cookie', async () => {
        const mockRequest = new Request('https://example.com/validate-session');
        // No Cookie header

        const response = await handleSessionValidation(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('session cookie');
      });

      it('should handle empty session cookie', async () => {
        const mockRequest = new Request('https://example.com/validate-session', {
          headers: {
            'Cookie': 'session='
          }
        });

        const response = await handleSessionValidation(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('session cookie');
      });

      it('should handle malformed cookie header', async () => {
        const mockRequest = new Request('https://example.com/validate-session', {
          headers: {
            'Cookie': 'invalid-cookie-format'
          }
        });

        const response = await handleSessionValidation(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('session cookie');
      });

      it('should handle validation errors gracefully', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        
        validateSession.mockRejectedValue(new Error('Validation error'));

        const mockRequest = new Request('https://example.com/validate-session', {
          headers: {
            'Cookie': 'session=valid-session-id'
          }
        });

        const response = await handleSessionValidation(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toContain('Validation error');
      });

      it('should handle multiple session cookies', async () => {
        const mockRequest = new Request('https://example.com/validate-session', {
          headers: {
            'Cookie': 'other=value; session=valid-session-id; another=value'
          }
        });

        const { validateSession, getUserFromSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        getUserFromSession.mockResolvedValue({
          userId: 'user123',
          email: 'user@example.com'
        });

        const response = await handleSessionValidation(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.valid).toBe(true);
      });
    });
  });
});
