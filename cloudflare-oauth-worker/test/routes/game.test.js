import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleGameGet, handleGamePost, handleGamePut, handleGameDelete } from '../../src/routes/game.js';

// Mock dependencies
vi.mock('../../src/lib/auth.js', () => ({
  validateSession: vi.fn(),
  isAdmin: vi.fn()
}));

vi.mock('../../src/durable-objects/Game.js', () => ({
  Game: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }))
}));

describe('Game Routes', () => {
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
      put: vi.fn(),
      delete: vi.fn()
    };

    vi.clearAllMocks();
  });

  describe('handleGameGet', () => {
    describe('happy path', () => {
      it('should retrieve game data successfully', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);

        const mockGameData = {
          id: 'game123',
          state: 'CA',
          plate: 'ABC123',
          userId: 'user123',
          createdAt: Date.now()
        };

        mockGame.get.mockResolvedValue(mockGameData);

        const mockRequest = new Request('https://example.com/game/game123', {
          headers: {
            'Cookie': 'session=valid-session-id'
          }
        });

        const response = await handleGameGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toEqual(mockGameData);
      });

      it('should return 404 for non-existent game', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);

        mockGame.get.mockResolvedValue(null);

        const mockRequest = new Request('https://example.com/game/non-existent', {
          headers: {
            'Cookie': 'session=valid-session-id'
          }
        });

        const response = await handleGameGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.error).toContain('Game not found');
      });
    });

    describe('edge cases', () => {
      it('should handle missing session cookie', async () => {
        const mockRequest = new Request('https://example.com/game/game123');
        // No Cookie header

        const response = await handleGameGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toContain('Unauthorized');
      });

      it('should handle invalid session', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(false);

        const mockRequest = new Request('https://example.com/game/game123', {
          headers: {
            'Cookie': 'session=invalid-session-id'
          }
        });

        const response = await handleGameGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toContain('Unauthorized');
      });

      it('should handle game retrieval errors', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);

        mockGame.get.mockRejectedValue(new Error('Database error'));

        const mockRequest = new Request('https://example.com/game/game123', {
          headers: {
            'Cookie': 'session=valid-session-id'
          }
        });

        const response = await handleGameGet(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toContain('Database error');
      });
    });
  });

  describe('handleGamePost', () => {
    describe('happy path', () => {
      it('should create new game successfully', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);

        const mockGameData = {
          id: 'new-game-456',
          state: 'NY',
          plate: 'XYZ789',
          userId: 'user123',
          createdAt: Date.now()
        };

        mockGame.put.mockResolvedValue(mockGameData);

        const mockRequest = new Request('https://example.com/game', {
          method: 'POST',
          headers: {
            'Cookie': 'session=valid-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            state: 'NY',
            plate: 'XYZ789'
          })
        });

        const response = await handleGamePost(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(201);
        const body = await response.json();
        expect(body.id).toBeDefined();
        expect(body.state).toBe('NY');
        expect(body.plate).toBe('XYZ789');
      });
    });

    describe('edge cases', () => {
      it('should handle missing request body', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/game', {
          method: 'POST',
          headers: {
            'Cookie': 'session=valid-session-id'
          }
          // No body
        });

        const response = await handleGamePost(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('Request body required');
      });

      it('should handle invalid JSON in request body', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/game', {
          method: 'POST',
          headers: {
            'Cookie': 'session=valid-session-id',
            'Content-Type': 'application/json'
          },
          body: 'invalid-json{'
        });

        const response = await handleGamePost(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('Invalid JSON');
      });

      it('should handle missing required fields', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/game', {
          method: 'POST',
          headers: {
            'Cookie': 'session=valid-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            state: 'NY'
            // Missing plate
          })
        });

        const response = await handleGamePost(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('state and plate are required');
      });

      it('should handle invalid state values', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/game', {
          method: 'POST',
          headers: {
            'Cookie': 'session=valid-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            state: 'INVALID_STATE',
            plate: 'ABC123'
          })
        });

        const response = await handleGamePost(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain('Invalid state');
      });

      it('should handle game creation errors', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);

        mockGame.put.mockRejectedValue(new Error('Storage error'));

        const mockRequest = new Request('https://example.com/game', {
          method: 'POST',
          headers: {
            'Cookie': 'session=valid-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            state: 'CA',
            plate: 'ABC123'
          })
        });

        const response = await handleGamePost(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toContain('Storage error');
      });
    });
  });

  describe('handleGamePut', () => {
    describe('happy path', () => {
      it('should update game successfully', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);

        const mockUpdatedGame = {
          id: 'game123',
          state: 'TX',
          plate: 'DEF456',
          userId: 'user123',
          updatedAt: Date.now()
        };

        mockGame.put.mockResolvedValue(mockUpdatedGame);

        const mockRequest = new Request('https://example.com/game/game123', {
          method: 'PUT',
          headers: {
            'Cookie': 'session=valid-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            state: 'TX',
            plate: 'DEF456'
          })
        });

        const response = await handleGamePut(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.state).toBe('TX');
        expect(body.plate).toBe('DEF456');
      });
    });

    describe('edge cases', () => {
      it('should handle updating non-existent game', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);

        mockGame.put.mockResolvedValue(null);

        const mockRequest = new Request('https://example.com/game/non-existent', {
          method: 'PUT',
          headers: {
            'Cookie': 'session=valid-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            state: 'CA',
            plate: 'ABC123'
          })
        });

        const response = await handleGamePut(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.error).toContain('Game not found');
      });

      it('should handle partial updates gracefully', async () => {
        const { validateSession } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);

        const mockUpdatedGame = {
          id: 'game123',
          state: 'CA',
          plate: 'ABC123',
          userId: 'user123',
          updatedAt: Date.now()
        };

        mockGame.put.mockResolvedValue(mockUpdatedGame);

        const mockRequest = new Request('https://example.com/game/game123', {
          method: 'PUT',
          headers: {
            'Cookie': 'session=valid-session-id',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            state: 'CA'
            // Only updating state, not plate
          })
        });

        const response = await handleGamePut(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.state).toBe('CA');
      });
    });
  });

  describe('handleGameDelete', () => {
    describe('happy path', () => {
      it('should delete game successfully', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        mockGame.delete.mockResolvedValue(true);

        const mockRequest = new Request('https://example.com/game/game123', {
          method: 'DELETE',
          headers: {
            'Cookie': 'session=valid-session-id'
          }
        });

        const response = await handleGameDelete(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.message).toContain('Game deleted');
      });
    });

    describe('edge cases', () => {
      it('should require admin privileges for deletion', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(false);

        const mockRequest = new Request('https://example.com/game/game123', {
          method: 'DELETE',
          headers: {
            'Cookie': 'session=valid-session-id'
          }
        });

        const response = await handleGameDelete(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error).toContain('Admin access required');
      });

      it('should handle deletion of non-existent game', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        mockGame.delete.mockResolvedValue(false);

        const mockRequest = new Request('https://example.com/game/non-existent', {
          method: 'DELETE',
          headers: {
            'Cookie': 'session=valid-session-id'
          }
        });

        const response = await handleGameDelete(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.error).toContain('Game not found');
      });

      it('should handle deletion errors gracefully', async () => {
        const { validateSession, isAdmin } = await import('../../src/lib/auth.js');
        validateSession.mockResolvedValue(true);
        isAdmin.mockResolvedValue(true);

        mockGame.delete.mockRejectedValue(new Error('Deletion failed'));

        const mockRequest = new Request('https://example.com/game/game123', {
          method: 'DELETE',
          headers: {
            'Cookie': 'session=valid-session-id'
          }
        });

        const response = await handleGameDelete(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toContain('Deletion failed');
      });
    });
  });
});
