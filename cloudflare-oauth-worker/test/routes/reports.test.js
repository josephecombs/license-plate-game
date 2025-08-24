import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleReportsGet } from '../../src/routes/reports.js';

// Mock dependencies
vi.mock('../../src/lib/auth.js', () => ({
  validateSession: vi.fn(),
  isAdmin: vi.fn()
}));

vi.mock('../../src/durable-objects/Game.js', () => ({
  Game: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    list: vi.fn()
  }))
}));

describe('Reports Routes', () => {
  let mockEnv;
  let mockContext;
  let mockGame;

  beforeEach(() => {
    mockEnv = {
      GAMES: 'mock-games-namespace',
      USER_SESSIONS: 'mock-user-sessions-namespace'
    };

    mockContext = {
      waitUntil: vi.fn()
    };

    mockGame = {
      get: vi.fn(),
      list: vi.fn()
    };

    vi.clearAllMocks();
  });

  describe('handleReportsGet', () => {
    describe('happy path', () => {
      it('should return game reports successfully', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const mockGames = [
          {
            id: 'game1',
            state: 'CA',
            plate: 'ABC123',
            userId: 'user1',
            createdAt: Date.now() - 86400000,
            score: 85
          },
          {
            id: 'game2',
            state: 'NY',
            plate: 'XYZ789',
            userId: 'user2',
            createdAt: Date.now() - 172800000,
            score: 92
          }
        ];

        mockGame.list.mockResolvedValue(mockGames);

        const mockRequest = new Request('https://example.com/reports', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleReportsGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.games).toEqual(mockGames);
        expect(body.totalGames).toBe(2);
      });

      it('should return empty reports when no games exist', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        mockGame.list.mockResolvedValue([]);

        const mockRequest = new Request('https://example.com/reports', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleReportsGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.games).toEqual([]);
        expect(body.totalGames).toBe(0);
      });

      it('should handle reports with pagination parameters', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const mockGames = Array.from({ length: 50 }, (_, i) => ({
          id: `game${i}`,
          state: 'CA',
          plate: `ABC${i.toString().padStart(3, '0')}`,
          userId: `user${i}`,
          createdAt: Date.now() - (i * 86400000),
          score: 80 + (i % 20)
        }));

        mockGame.list.mockResolvedValue(mockGames.slice(0, 10));

        const mockRequest = new Request('https://example.com/reports?limit=10&offset=0', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleReportsGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.games).toHaveLength(10);
        expect(body.totalGames).toBe(50);
      });
    });

    describe('edge cases', () => {
      it('should require admin privileges', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'user@example.com' }, email: 'user@example.com' });
        isAdmin.mockResolvedValue(false);

        const mockRequest = new Request('https://example.com/reports', {
          headers: {
            'Cookie': 'session=user-session-id'
          }
        });

        const response = await handleReportsGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error).toContain('Admin access required');
      });

      it('should handle missing session cookie', async () => {
        const mockRequest = new Request('https://example.com/reports');
        // No Cookie header

        const response = await handleReportsGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toContain('Unauthorized');
      });

      it('should handle invalid session', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: false, error: 'Invalid session token' });

        const mockRequest = new Request('https://example.com/reports', {
          headers: {
            'Cookie': 'session=invalid-session-id'
          }
        });

        const response = await handleReportsGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toContain('Unauthorized');
      });

      it('should handle invalid pagination parameters', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/reports?limit=invalid&offset=-5', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleReportsGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('Invalid pagination parameters');
      });

      it('should handle very large pagination limits', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/reports?limit=10000&offset=0', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleReportsGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('Limit too large');
      });

      it('should handle negative offset values', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/reports?limit=10&offset=-10', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleReportsGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('Invalid pagination parameters');
      });

      it('should handle game list retrieval errors', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        mockGame.list.mockRejectedValue(new Error('Database error'));

        const mockRequest = new Request('https://example.com/reports', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleReportsGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toContain('Database error');
      });

      it('should handle malformed query parameters', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/reports?limit=&offset=abc', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleReportsGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('Invalid pagination parameters');
      });

      it('should handle missing query parameters gracefully', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const mockGames = [
          {
            id: 'game1',
            state: 'CA',
            plate: 'ABC123',
            userId: 'user1',
            createdAt: Date.now(),
            score: 85
          }
        ];

        mockGame.list.mockResolvedValue(mockGames);

        const mockRequest = new Request('https://example.com/reports', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleReportsGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.games).toEqual(mockGames);
        expect(body.totalGames).toBe(1);
      });

      it('should handle special characters in query parameters', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue({ valid: true, user: { email: 'admin@example.com' }, email: 'admin@example.com' });
        isAdmin.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/reports?limit=10&offset=0&filter=test%20with%20spaces', {
          headers: {
            'Cookie': 'session=admin-session-id'
          }
        });

        const response = await handleReportsGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        // Should ignore unknown query parameters
      });
    });
  });
});
