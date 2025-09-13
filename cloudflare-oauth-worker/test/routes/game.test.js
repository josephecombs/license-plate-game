import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleGetGame, handlePutGame } from '../../src/routes/game.js';

// Mock dependencies
vi.mock('../../src/lib/auth.js', () => ({
  getEmailFromSessionToken: vi.fn(),
  isAdmin: vi.fn()
}));

vi.mock('../../src/lib/utils.js', () => ({
  detectStateChanges: vi.fn(),
  getCurrentMonthYear: vi.fn()
}));

vi.mock('../../src/lib/email.js', () => ({
  sendStateChangeEmail: vi.fn()
}));

vi.mock('../../src/durable-objects/Game.js', () => ({
  Game: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    put: vi.fn()
  }))
}));

describe('Game Routes', () => {
  let mockEnv;
  let mockContext;
  let mockGame;
  let mockUser;

  beforeEach(() => {
    mockEnv = {
      GAME: {
        idFromName: vi.fn(),
        get: vi.fn()
      },
      USER: {
        idFromName: vi.fn(),
        get: vi.fn()
      }
    };

    mockContext = {
      waitUntil: vi.fn()
    };

    mockGame = {
      fetch: vi.fn()
    };

    mockUser = {
      fetch: vi.fn()
    };

    vi.clearAllMocks();
  });

  describe('handleGetGame', () => {
    describe('happy path', () => {
      it('should retrieve game data successfully', async () => {
        const { getEmailFromSessionToken } = await import('../../src/lib/auth.js');
        const { getCurrentMonthYear } = await import('../../src/lib/utils.js');
        
        getEmailFromSessionToken.mockResolvedValue('user@example.com');
        getCurrentMonthYear.mockReturnValue('2024-01');

        const mockGameData = {
          visitedStates: ['CA', 'NY'],
          score: 100
        };

        mockEnv.GAME.idFromName.mockReturnValue('game-id-123');
        mockEnv.GAME.get.mockReturnValue(mockGame);
        mockGame.fetch.mockResolvedValue({
          json: () => Promise.resolve(mockGameData)
        });

        const mockRequest = new Request('https://example.com/game', {
          headers: {
            'Authorization': 'valid-session-token'
          }
        });

        const response = await handleGetGame(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toEqual({
          ...mockGameData,
          gameKey: '2024-01'
        });
      });
    });

    describe('edge cases', () => {
      it('should handle missing session token', async () => {
        const mockRequest = new Request('https://example.com/game');
        // No Authorization header

        const response = await handleGetGame(mockRequest, mockEnv);
        
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toContain('No session token provided');
      });

      it('should handle invalid session token', async () => {
        const { getEmailFromSessionToken } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue(null);

        const mockRequest = new Request('https://example.com/game', {
          headers: {
            'Authorization': 'invalid-session-token'
          }
        });

        const response = await handleGetGame(mockRequest, mockEnv);
        
        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error).toContain('Invalid session token');
      });
    });
  });

  describe('handlePutGame', () => {
    describe('happy path', () => {
      it('should update game state successfully', async () => {
        const { getEmailFromSessionToken } = await import('../../src/lib/auth.js');
        const { getCurrentMonthYear, detectStateChanges } = await import('../../src/lib/utils.js');
        const { sendStateChangeEmail } = await import('../../src/lib/email.js');
        
        getEmailFromSessionToken.mockResolvedValue('user@example.com');
        getCurrentMonthYear.mockReturnValue('2024-01');
        detectStateChanges.mockReturnValue({ added: ['TX'], removed: [] });

        const previousGameData = {
          visitedStates: ['CA', 'NY']
        };

        const savedGameState = {
          visitedStates: ['CA', 'NY', 'TX'],
          score: 150
        };

        const userData = {
          name: 'John Doe'
        };

        mockEnv.GAME.idFromName.mockReturnValue('game-id-123');
        mockEnv.GAME.get.mockReturnValue(mockGame);
        mockEnv.USER.idFromName.mockReturnValue('user-id-123');
        mockEnv.USER.get.mockReturnValue(mockUser);

        mockGame.fetch
          .mockResolvedValueOnce({
            json: () => Promise.resolve(previousGameData)
          })
          .mockResolvedValueOnce({
            json: () => Promise.resolve(savedGameState)
          });

        mockUser.fetch.mockResolvedValue({
          json: () => Promise.resolve(userData)
        });

        sendStateChangeEmail.mockResolvedValue();

        const mockRequest = new Request('https://example.com/game', {
          method: 'PUT',
          headers: {
            'Authorization': 'valid-session-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            visitedStates: ['CA', 'NY', 'TX']
          })
        });

        const response = await handlePutGame(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toEqual(savedGameState);
        expect(sendStateChangeEmail).toHaveBeenCalledWith(
          mockEnv, 'user@example.com', 'John Doe', 'ADDED', 'TX', ['CA', 'NY'], ['CA', 'NY', 'TX']
        );
      });
    });

    describe('edge cases', () => {
      it('should handle missing session token', async () => {
        const mockRequest = new Request('https://example.com/game', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ visitedStates: ['CA'] })
        });

        const response = await handlePutGame(mockRequest, mockEnv);
        
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toContain('No session token provided');
      });

      it('should handle invalid session token', async () => {
        const { getEmailFromSessionToken } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue(null);

        const mockRequest = new Request('https://example.com/game', {
          method: 'PUT',
          headers: {
            'Authorization': 'invalid-session-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ visitedStates: ['CA'] })
        });

        const response = await handlePutGame(mockRequest, mockEnv);
        
        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error).toContain('Invalid session token');
      });
    });
  });
});
