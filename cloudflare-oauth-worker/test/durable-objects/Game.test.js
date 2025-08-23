import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Game } from '../../src/durable-objects/Game.js';

describe('Game Durable Object', () => {
  let game;
  let mockStorage;
  let mockEnv;

  beforeEach(() => {
    mockStorage = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn()
    };

    mockEnv = {
      GAMES: 'mock-games-namespace'
    };

    game = new Game(mockStorage, mockEnv);
    vi.clearAllMocks();
  });

  describe('get', () => {
    describe('happy path', () => {
      it('should retrieve game data successfully', async () => {
        const mockGameData = {
          id: 'game123',
          state: 'CA',
          plate: 'ABC123',
          userId: 'user123',
          createdAt: Date.now(),
          score: 85
        };

        mockStorage.get.mockResolvedValue(mockGameData);

        const result = await game.get('game123');
        
        expect(result).toEqual(mockGameData);
        expect(mockStorage.get).toHaveBeenCalledWith('game123');
      });

      it('should return null for non-existent game', async () => {
        mockStorage.get.mockResolvedValue(null);

        const result = await game.get('non-existent');
        
        expect(result).toBeNull();
        expect(mockStorage.get).toHaveBeenCalledWith('non-existent');
      });
    });

    describe('edge cases', () => {
      it('should handle storage errors gracefully', async () => {
        mockStorage.get.mockRejectedValue(new Error('Storage error'));

        await expect(game.get('game123')).rejects.toThrow('Storage error');
        expect(mockStorage.get).toHaveBeenCalledWith('game123');
      });

      it('should handle empty game ID', async () => {
        const result = await game.get('');
        
        expect(result).toBeNull();
        expect(mockStorage.get).not.toHaveBeenCalled();
      });

      it('should handle null game ID', async () => {
        const result = await game.get(null);
        
        expect(result).toBeNull();
        expect(mockStorage.get).not.toHaveBeenCalled();
      });

      it('should handle undefined game ID', async () => {
        const result = await game.get(undefined);
        
        expect(result).toBeNull();
        expect(mockStorage.get).not.toHaveBeenCalled();
      });
    });
  });

  describe('put', () => {
    describe('happy path', () => {
      it('should create new game successfully', async () => {
        const gameData = {
          state: 'NY',
          plate: 'XYZ789',
          userId: 'user456'
        };

        const mockCreatedGame = {
          id: 'new-game-id',
          ...gameData,
          createdAt: expect.any(Number),
          score: 0
        };

        mockStorage.put.mockResolvedValue(mockCreatedGame);

        const result = await game.put(gameData);
        
        expect(result.id).toBeDefined();
        expect(result.state).toBe('NY');
        expect(result.plate).toBe('XYZ789');
        expect(result.userId).toBe('user456');
        expect(result.createdAt).toBeDefined();
        expect(result.score).toBe(0);
        expect(mockStorage.put).toHaveBeenCalled();
      });

      it('should update existing game successfully', async () => {
        const existingGame = {
          id: 'game123',
          state: 'CA',
          plate: 'ABC123',
          userId: 'user123',
          createdAt: Date.now() - 86400000,
          score: 85
        };

        const updateData = {
          state: 'TX',
          plate: 'DEF456',
          score: 92
        };

        const mockUpdatedGame = {
          ...existingGame,
          ...updateData,
          updatedAt: expect.any(Number)
        };

        mockStorage.put.mockResolvedValue(mockUpdatedGame);

        const result = await game.put(updateData, 'game123');
        
        expect(result.state).toBe('TX');
        expect(result.plate).toBe('DEF456');
        expect(result.score).toBe(92);
        expect(result.updatedAt).toBeDefined();
        expect(mockStorage.put).toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle missing required fields', async () => {
        const incompleteData = {
          state: 'CA'
          // Missing plate and userId
        };

        await expect(game.put(incompleteData)).rejects.toThrow('Missing required fields');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle invalid state values', async () => {
        const invalidData = {
          state: 'INVALID_STATE',
          plate: 'ABC123',
          userId: 'user123'
        };

        await expect(game.put(invalidData)).rejects.toThrow('Invalid state');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle empty state', async () => {
        const invalidData = {
          state: '',
          plate: 'ABC123',
          userId: 'user123'
        };

        await expect(game.put(invalidData)).rejects.toThrow('Invalid state');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle empty plate', async () => {
        const invalidData = {
          state: 'CA',
          plate: '',
          userId: 'user123'
        };

        await expect(game.put(invalidData)).rejects.toThrow('Invalid plate');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle empty userId', async () => {
        const invalidData = {
          state: 'CA',
          plate: 'ABC123',
          userId: ''
        };

        await expect(game.put(invalidData)).rejects.toThrow('Invalid userId');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle very long plate numbers', async () => {
        const longPlate = 'A'.repeat(1000);
        const invalidData = {
          state: 'CA',
          plate: longPlate,
          userId: 'user123'
        };

        await expect(game.put(invalidData)).rejects.toThrow('Plate too long');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle very long userIds', async () => {
        const longUserId = 'A'.repeat(1000);
        const invalidData = {
          state: 'CA',
          plate: 'ABC123',
          userId: longUserId
        };

        await expect(game.put(invalidData)).rejects.toThrow('UserId too long');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle storage errors during creation', async () => {
        const gameData = {
          state: 'CA',
          plate: 'ABC123',
          userId: 'user123'
        };

        mockStorage.put.mockRejectedValue(new Error('Storage error'));

        await expect(game.put(gameData)).rejects.toThrow('Storage error');
        expect(mockStorage.put).toHaveBeenCalled();
      });

      it('should handle null game data', async () => {
        await expect(game.put(null)).rejects.toThrow('Game data required');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle undefined game data', async () => {
        await expect(game.put(undefined)).rejects.toThrow('Game data required');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });
    });
  });

  describe('delete', () => {
    describe('happy path', () => {
      it('should delete game successfully', async () => {
        mockStorage.delete.mockResolvedValue(true);

        const result = await game.delete('game123');
        
        expect(result).toBe(true);
        expect(mockStorage.delete).toHaveBeenCalledWith('game123');
      });
    });

    describe('edge cases', () => {
      it('should handle deletion of non-existent game', async () => {
        mockStorage.delete.mockResolvedValue(false);

        const result = await game.delete('non-existent');
        
        expect(result).toBe(false);
        expect(mockStorage.delete).toHaveBeenCalledWith('non-existent');
      });

      it('should handle storage errors during deletion', async () => {
        mockStorage.delete.mockRejectedValue(new Error('Deletion error'));

        await expect(game.delete('game123')).rejects.toThrow('Deletion error');
        expect(mockStorage.delete).toHaveBeenCalledWith('game123');
      });

      it('should handle empty game ID', async () => {
        const result = await game.delete('');
        
        expect(result).toBe(false);
        expect(mockStorage.delete).not.toHaveBeenCalled();
      });

      it('should handle null game ID', async () => {
        const result = await game.delete(null);
        
        expect(result).toBe(false);
        expect(mockStorage.delete).not.toHaveBeenCalled();
      });

      it('should handle undefined game ID', async () => {
        const result = await game.delete(undefined);
        
        expect(result).toBe(false);
        expect(mockStorage.delete).not.toHaveBeenCalled();
      });
    });
  });

  describe('list', () => {
    describe('happy path', () => {
      it('should list games successfully', async () => {
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

        mockStorage.list.mockResolvedValue(mockGames);

        const result = await game.list();
        
        expect(result).toEqual(mockGames);
        expect(mockStorage.list).toHaveBeenCalled();
      });

      it('should return empty array when no games exist', async () => {
        mockStorage.list.mockResolvedValue([]);

        const result = await game.list();
        
        expect(result).toEqual([]);
        expect(mockStorage.list).toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle storage errors during listing', async () => {
        mockStorage.list.mockRejectedValue(new Error('List error'));

        await expect(game.list()).rejects.toThrow('List error');
        expect(mockStorage.list).toHaveBeenCalled();
      });

      it('should handle pagination parameters', async () => {
        const mockGames = Array.from({ length: 50 }, (_, i) => ({
          id: `game${i}`,
          state: 'CA',
          plate: `ABC${i.toString().padStart(3, '0')}`,
          userId: `user${i}`,
          createdAt: Date.now() - (i * 86400000),
          score: 80 + (i % 20)
        }));

        mockStorage.list.mockResolvedValue(mockGames.slice(0, 10));

        const result = await game.list({ limit: 10, offset: 0 });
        
        expect(result).toHaveLength(10);
        expect(mockStorage.list).toHaveBeenCalledWith({ limit: 10, offset: 0 });
      });

      it('should handle invalid pagination parameters', async () => {
        const mockGames = [];
        mockStorage.list.mockResolvedValue(mockGames);

        const result = await game.list({ limit: -5, offset: 'invalid' });
        
        expect(result).toEqual(mockGames);
        // Should use default values for invalid parameters
        expect(mockStorage.list).toHaveBeenCalledWith({ limit: 50, offset: 0 });
      });
    });
  });

  describe('validation', () => {
    describe('state validation', () => {
      it('should accept valid state codes', async () => {
        const validStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
                           'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                           'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                           'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                           'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];

        for (const state of validStates) {
          const gameData = {
            state,
            plate: 'ABC123',
            userId: 'user123'
          };

          mockStorage.put.mockResolvedValue({ id: 'test', ...gameData });
          
          const result = await game.put(gameData);
          expect(result.state).toBe(state);
        }
      });

      it('should reject invalid state codes', async () => {
        const invalidStates = ['XX', 'YY', 'ZZ', '123', 'ABC', ''];

        for (const state of invalidStates) {
          const gameData = {
            state,
            plate: 'ABC123',
            userId: 'user123'
          };

          await expect(game.put(gameData)).rejects.toThrow('Invalid state');
        }
      });
    });

    describe('plate validation', () => {
      it('should accept valid plate formats', async () => {
        const validPlates = ['ABC123', '123ABC', 'ABC-123', 'ABC 123', 'A1B2C3'];

        for (const plate of validPlates) {
          const gameData = {
            state: 'CA',
            plate,
            userId: 'user123'
          };

          mockStorage.put.mockResolvedValue({ id: 'test', ...gameData });
          
          const result = await game.put(gameData);
          expect(result.plate).toBe(plate);
        }
      });

      it('should reject invalid plate formats', async () => {
        const invalidPlates = ['', 'A', 'AB', 'ABC', '123', 'ABC@123', 'ABC#123'];

        for (const plate of invalidPlates) {
          const gameData = {
            state: 'CA',
            plate,
            userId: 'user123'
          };

          await expect(game.put(gameData)).rejects.toThrow('Invalid plate');
        }
      });
    });
  });
});
