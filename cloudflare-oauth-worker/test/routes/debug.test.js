import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleDebugEnv, handleDebugGame } from '../../src/routes/debug.js';

// Mock dependencies
vi.mock('../../src/lib/auth.js', () => ({
  validateSession: vi.fn(),
  isAdmin: vi.fn()
}));

describe('Debug Routes', () => {
  let mockEnv;
  let mockContext;

  beforeEach(() => {
    mockEnv = {
      GAMES: 'mock-games-namespace',
      USER_SESSIONS: 'mock-user-sessions-namespace',
      CLIENT_ID: 'test-client-id',
      CLIENT_SECRET: 'test-client-secret',
      REDIRECT_URI: 'https://example.com/callback',
      AWS_ACCESS_KEY_ID: 'test-aws-key',
      AWS_SECRET_ACCESS_KEY: 'test-aws-secret',
      AWS_REGION: 'us-east-1',
      FROM_EMAIL: 'noreply@example.com',
      GAME: {
        idFromName: vi.fn().mockReturnValue('mock-game-id'),
        get: vi.fn().mockReturnValue({
          fetch: vi.fn().mockResolvedValue({
            json: vi.fn().mockResolvedValue([
              { email: 'test@example.com', gameState: { visitedStates: ['01', '02'] } }
            ])
          })
        })
      }
    };

    mockContext = {
      waitUntil: vi.fn()
    };

    vi.clearAllMocks();
  });

  describe('handleDebugEnv', () => {
    describe('happy path', () => {
      it('should return environment variables for admin users', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/debug-env', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleDebugEnv(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.environment).toBeDefined();
        expect(body.environment.CLIENT_ID).toBe('test-client-id');
        expect(body.environment.GAMES).toBe('mock-games-namespace');
        expect(body.environment.USER_SESSIONS).toBe('mock-user-sessions-namespace');
      });

      it('should mask sensitive environment variables', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/debug-env', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleDebugEnv(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.environment.CLIENT_SECRET).toBe('***');
        expect(body.environment.AWS_SECRET_ACCESS_KEY).toBe('***');
        expect(body.environment.AWS_ACCESS_KEY_ID).toBe('***');
      });
    });

    describe('edge cases', () => {
      it('should require admin privileges', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'user@example.com' }, email: 'user@example.com' });
        isAdmin.mockResolvedValue(false);

        const mockRequest = new Request('https://example.com/debug-env', {
          headers: {
            'Cookie': 'session=user-session-id'
          }
        });

        const response = await handleDebugEnv(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error).toContain('Admin access required');
      });

      it('should handle missing session cookie', async () => {
        const mockRequest = new Request('https://example.com/debug-env');
        // No Cookie header

        const response = await handleDebugEnv(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toContain('Unauthorized');
      });

      it('should handle invalid session', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(false);

        const mockRequest = new Request('https://example.com/debug-env', {
          headers: {
            'Cookie': 'session=invalid-session-id'
          }
        });

        const response = await handleDebugEnv(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toContain('Unauthorized');
      });

      it('should handle missing environment variables gracefully', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const incompleteEnv = {
          // Missing GAMES and USER_SESSIONS
          CLIENT_ID: 'test-client-id'
        };

        const mockRequest = new Request('https://example.com/debug-env', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleDebugEnv(mockRequest, incompleteEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.environment).toBeDefined();
        expect(body.environment.CLIENT_ID).toBe('test-client-id');
        expect(body.environment.GAMES).toBeUndefined();
        expect(body.environment.USER_SESSIONS).toBeUndefined();
      });

      it('should handle empty environment variables', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const envWithEmptyValues = {
          ...mockEnv,
          EMPTY_VAR: '',
          NULL_VAR: null,
          UNDEFINED_VAR: undefined
        };

        const mockRequest = new Request('https://example.com/debug-env', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleDebugEnv(mockRequest, envWithEmptyValues, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.environment.EMPTY_VAR).toBe('');
        expect(body.environment.NULL_VAR).toBeNull();
        expect(body.environment.UNDEFINED_VAR).toBeUndefined();
      });
    });
  });

  describe('handleDebugGame', () => {
    describe('happy path', () => {
      it('should return game debug information for admin users', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/debug-game', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleDebugGame(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.debug).toBeDefined();
        expect(body.debug.gamesNamespace).toBe('mock-games-namespace');
        expect(body.debug.userSessionsNamespace).toBe('mock-user-sessions-namespace');
        expect(body.debug.timestamp).toBeDefined();
      });

      it('should include system information', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/debug-game', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleDebugGame(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.debug.timestamp).toBeDefined();
        expect(body.debug.environment).toBe('development');
        expect(body.debug.version).toBeDefined();
      });
    });

    describe('edge cases', () => {
      it('should require admin privileges', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'user@example.com' }, email: 'user@example.com' });
        isAdmin.mockResolvedValue(false);

        const mockRequest = new Request('https://example.com/debug-game', {
          headers: {
            'Cookie': 'session=user-session-id'
          }
        });

        const response = await handleDebugGame(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error).toContain('Admin access required');
      });

      it('should handle missing session cookie', async () => {
        const mockRequest = new Request('https://example.com/debug-game');
        // No Cookie header

        const response = await handleDebugGame(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toContain('Unauthorized');
      });

      it('should handle invalid session', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(false);

        const mockRequest = new Request('https://example.com/debug-game', {
          headers: {
            'Cookie': 'session=invalid-session-id'
          }
        });

        const response = await handleDebugGame(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toContain('Unauthorized');
      });

      it('should handle missing environment variables gracefully', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const incompleteEnv = {
          // Missing GAMES and USER_SESSIONS
          CLIENT_ID: 'test-client-id',
          GAME: {
            idFromName: vi.fn().mockReturnValue('mock-game-id'),
            get: vi.fn().mockReturnValue({
              fetch: vi.fn().mockResolvedValue({
                json: vi.fn().mockResolvedValue([])
              })
            })
          }
        };

        const mockRequest = new Request('https://example.com/debug-game', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleDebugGame(mockRequest, incompleteEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.debug.gamesNamespace).toBe('NOT_SET');
        expect(body.debug.userSessionsNamespace).toBe('NOT_SET');
      });

      it('should handle different request methods', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];

        for (const method of methods) {
          const mockRequest = new Request('https://example.com/debug-game', {
            method,
            headers: {
              'Cookie': 'session=admin-session-id'
            }
          });

          const response = await handleDebugGame(mockRequest, mockEnv, mockContext);
          
          expect(response.status).toBe(200);
          const body = await response.json();
          
          if (method === 'POST') {
            // POST requests return a different format
            expect(body.message).toBe('Test data saved');
            expect(body.monthYear).toBeDefined();
          } else {
            // GET and other methods return debug format
            expect(body.debug).toBeDefined();
          }
        }
      });

      it('should handle requests with query parameters', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/debug-game?format=json&verbose=true', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleDebugGame(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.debug).toBeDefined();
        // Should ignore query parameters
      });

      it('should handle requests with custom headers', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/debug-game', {
          headers: {
            'Cookie': 'session=admin-session-id',
            'Custom-Header': 'custom-value',
            'X-Request-ID': 'req-123'
          }
        });

        const response = await handleDebugGame(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.debug).toBeDefined();
        // Should not be affected by custom headers
      });
    });
  });

  describe('debug route security', () => {
      it('should not expose sensitive information in non-admin responses', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'user@example.com' }, email: 'user@example.com' });
        isAdmin.mockResolvedValue(false);

      const mockRequest = new Request('https://example.com/debug-env', {
        headers: {
          'Cookie': 'session=user-session-id'
        }
      });

      const response = await handleDebugEnv(mockRequest, mockEnv, mockContext);
      
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.environment).toBeUndefined();
      expect(body.error).toContain('Admin access required');
    });

    it('should validate session before checking admin status', async () => {
      const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
      validateSession.mockResolvedValue(false);
      // isAdmin should not be called if session is invalid

      const mockRequest = new Request('https://example.com/debug-env', {
        headers: {
          'Cookie': 'session=invalid-session-id'
        }
      });

      const response = await handleDebugEnv(mockRequest, mockEnv, mockContext);
      
      expect(response.status).toBe(401);
      expect(isAdmin).not.toHaveBeenCalled();
    });
  });
});
