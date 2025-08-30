import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Game Durable Object', () => {
  let mockGame;
  let mockEnv;

  beforeEach(() => {
    // Mock the Game Durable Object
    mockGame = {
      fetch: vi.fn()
    };

    mockEnv = {
      GAME: {
        idFromName: vi.fn().mockReturnValue('mock-game-id'),
        get: vi.fn().mockReturnValue(mockGame)
      }
    };

    vi.clearAllMocks();
  });

  describe('save-game endpoint', () => {
    it('should save game data successfully', async () => {
      const email = 'test@example.com';
      const gameState = {
        visitedStates: ['CA', 'NY'],
        progress: 50,
        lastUpdated: Date.now()
      };

      const savedGameState = {
        visitedStates: ['CA', 'NY'],
        progress: 50,
        lastUpdated: expect.any(Number)
      };

      mockGame.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(savedGameState),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://save-game', {
        method: 'POST',
        body: JSON.stringify({ email, gameState })
      });

      const response = await mockGame.fetch(request);
      const responseData = await response.json();

      expect(responseData).toEqual(savedGameState);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(mockGame.fetch).toHaveBeenCalledWith(request);
    });

    it('should handle missing email in request body', async () => {
      const gameState = {
        visitedStates: ['CA'],
        progress: 25
      };

      mockGame.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(gameState),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://save-game', {
        method: 'POST',
        body: JSON.stringify({ gameState })
      });

      const response = await mockGame.fetch(request);
      const responseData = await response.json();

      expect(responseData).toEqual(gameState);
      expect(mockGame.fetch).toHaveBeenCalledWith(request);
    });

    it('should handle missing gameState in request body', async () => {
      const email = 'test@example.com';

      mockGame.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue({}),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://save-game', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      const response = await mockGame.fetch(request);
      const responseData = await response.json();

      expect(responseData).toEqual({});
      expect(mockGame.fetch).toHaveBeenCalledWith(request);
    });
  });

  describe('get-game endpoint', () => {
    it('should return game data for existing user', async () => {
      const email = 'test@example.com';
      const gameState = {
        visitedStates: ['CA', 'NY', 'TX'],
        progress: 75,
        lastUpdated: Date.now()
      };

      mockGame.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(gameState),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://get-game', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      const response = await mockGame.fetch(request);
      const responseData = await response.json();

      expect(responseData).toEqual(gameState);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(mockGame.fetch).toHaveBeenCalledWith(request);
    });

    it('should return empty object for non-existent user', async () => {
      const email = 'nonexistent@example.com';

      mockGame.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue({}),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://get-game', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      const response = await mockGame.fetch(request);
      const responseData = await response.json();

      expect(responseData).toEqual({});
      expect(mockGame.fetch).toHaveBeenCalledWith(request);
    });

    it('should handle missing email in request body', async () => {
      mockGame.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue({}),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://get-game', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await mockGame.fetch(request);
      const responseData = await response.json();

      expect(responseData).toEqual({});
      expect(mockGame.fetch).toHaveBeenCalledWith(request);
    });
  });

  describe('get-all-games endpoint', () => {
    it('should return all users and their game data', async () => {
      const allGamesData = [
        {
          email: 'user1@example.com',
          gameData: {
            visitedStates: ['CA', 'NY'],
            progress: 50
          }
        },
        {
          email: 'user2@example.com',
          gameData: {
            visitedStates: ['TX', 'FL'],
            progress: 25
          }
        }
      ];

      mockGame.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(allGamesData),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://get-all-games', {
        method: 'POST',
        body: JSON.stringify({ dummy: 'data' })
      });

      const response = await mockGame.fetch(request);
      const responseData = await response.json();

      expect(responseData).toEqual(allGamesData);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(mockGame.fetch).toHaveBeenCalledWith(request);
    });

    it('should return empty array when no games exist', async () => {
      mockGame.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue([]),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://get-all-games', {
        method: 'POST',
        body: JSON.stringify({ dummy: 'data' })
      });

      const response = await mockGame.fetch(request);
      const responseData = await response.json();

      expect(responseData).toEqual([]);
      expect(mockGame.fetch).toHaveBeenCalledWith(request);
    });

    it('should handle empty request body', async () => {
      const allGamesData = [
        {
          email: 'user1@example.com',
          gameData: { visitedStates: ['CA'] }
        }
      ];

      mockGame.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(allGamesData),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://get-all-games', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await mockGame.fetch(request);
      const responseData = await response.json();

      expect(responseData).toEqual(allGamesData);
      expect(mockGame.fetch).toHaveBeenCalledWith(request);
    });
  });

  describe('invalid endpoints', () => {
    it('should return 405 for unknown hostname', async () => {
      mockGame.fetch.mockResolvedValue({
        text: vi.fn().mockResolvedValue('Method not allowed'),
        status: 405
      });

      const request = new Request('https://unknown-endpoint', {
        method: 'GET'
      });

      const response = await mockGame.fetch(request);
      const responseText = await response.text();

      expect(response.status).toBe(405);
      expect(responseText).toBe('Method not allowed');
      expect(mockGame.fetch).toHaveBeenCalledWith(request);
    });

    it('should return 405 for wrong method on valid endpoint', async () => {
      mockGame.fetch.mockResolvedValue({
        text: vi.fn().mockResolvedValue('Method not allowed'),
        status: 405
      });

      const request = new Request('https://get-game', {
        method: 'GET'
      });

      const response = await mockGame.fetch(request);
      const responseText = await response.text();

      expect(response.status).toBe(405);
      expect(responseText).toBe('Method not allowed');
      expect(mockGame.fetch).toHaveBeenCalledWith(request);
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockGame.fetch.mockRejectedValue(new Error('Storage error'));

      const request = new Request('https://get-game', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' })
      });

      await expect(mockGame.fetch(request)).rejects.toThrow('Storage error');
    });

    it('should handle malformed JSON in request body', async () => {
      mockGame.fetch.mockRejectedValue(new Error('Invalid JSON'));

      const request = new Request('https://save-game', {
        method: 'POST',
        body: 'invalid json'
      });

      await expect(mockGame.fetch(request)).rejects.toThrow('Invalid JSON');
    });
  });

  describe('integration with routes', () => {
    it('should work with game route GET functionality', async () => {
      const email = 'test@example.com';
      const gameState = {
        visitedStates: ['CA', 'NY'],
        progress: 50
      };

      mockGame.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(gameState),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      // Simulate how game route calls the Game DO
      const gameObjId = mockEnv.GAME.idFromName('2024-01');
      const gameObj = mockEnv.GAME.get(gameObjId);
      
      const request = new Request('https://get-game', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      const response = await gameObj.fetch(request);
      const responseData = await response.json();

      expect(responseData).toEqual(gameState);
      expect(mockEnv.GAME.idFromName).toHaveBeenCalledWith('2024-01');
      expect(mockEnv.GAME.get).toHaveBeenCalledWith('mock-game-id');
      expect(mockGame.fetch).toHaveBeenCalledWith(request);
    });

    it('should work with game route PUT functionality', async () => {
      const email = 'test@example.com';
      const gameState = {
        visitedStates: ['CA', 'NY', 'TX'],
        progress: 75
      };

      mockGame.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(gameState),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      // Simulate how game route calls the Game DO
      const gameObjId = mockEnv.GAME.idFromName('2024-01');
      const gameObj = mockEnv.GAME.get(gameObjId);
      
      const request = new Request('https://save-game', {
        method: 'POST',
        body: JSON.stringify({ email, gameState })
      });

      const response = await gameObj.fetch(request);
      const responseData = await response.json();

      expect(responseData).toEqual(gameState);
      expect(mockEnv.GAME.idFromName).toHaveBeenCalledWith('2024-01');
      expect(mockEnv.GAME.get).toHaveBeenCalledWith('mock-game-id');
      expect(mockGame.fetch).toHaveBeenCalledWith(request);
    });

    it('should work with reports route functionality', async () => {
      const allGamesData = [
        {
          email: 'user1@example.com',
          gameData: { visitedStates: ['CA'] }
        },
        {
          email: 'user2@example.com',
          gameData: { visitedStates: ['NY'] }
        }
      ];

      mockGame.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(allGamesData),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      // Simulate how reports route calls the Game DO
      const gameObjId = mockEnv.GAME.idFromName('2024-01');
      const gameObj = mockEnv.GAME.get(gameObjId);
      
      const request = new Request('https://get-all-games', {
        method: 'POST',
        body: JSON.stringify({ dummy: 'data' })
      });

      const response = await gameObj.fetch(request);
      const responseData = await response.json();

      expect(responseData).toEqual(allGamesData);
      expect(mockEnv.GAME.idFromName).toHaveBeenCalledWith('2024-01');
      expect(mockEnv.GAME.get).toHaveBeenCalledWith('mock-game-id');
      expect(mockGame.fetch).toHaveBeenCalledWith(request);
    });
  });

  describe('data persistence', () => {
    it('should maintain separate game data for different users', async () => {
      const user1GameState = {
        visitedStates: ['CA', 'NY'],
        progress: 50
      };

      const user2GameState = {
        visitedStates: ['TX', 'FL'],
        progress: 25
      };

      // Mock save-game for user1
      mockGame.fetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(user1GameState),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      // Mock save-game for user2
      mockGame.fetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(user2GameState),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const gameObjId = mockEnv.GAME.idFromName('2024-01');
      const gameObj = mockEnv.GAME.get(gameObjId);

      // Save game for user1
      const saveRequest1 = new Request('https://save-game', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'user1@example.com', 
          gameState: user1GameState 
        })
      });

      const response1 = await gameObj.fetch(saveRequest1);
      const responseData1 = await response1.json();

      // Save game for user2
      const saveRequest2 = new Request('https://save-game', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'user2@example.com', 
          gameState: user2GameState 
        })
      });

      const response2 = await gameObj.fetch(saveRequest2);
      const responseData2 = await response2.json();

      expect(responseData1).toEqual(user1GameState);
      expect(responseData2).toEqual(user2GameState);
      expect(mockGame.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
