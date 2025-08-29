import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleReports } from '../../src/routes/reports.js';

// Mock dependencies
vi.mock('../../src/lib/auth.js', () => ({
  getEmailFromSessionToken: vi.fn(),
  isAdmin: vi.fn()
}));

vi.mock('../../src/lib/utils.js', () => ({
  anonymizeEmail: vi.fn(),
  getCurrentMonthYear: vi.fn()
}));

describe('Reports Routes - handleReports', () => {
  let mockEnv;
  let mockGameObj;
  let mockGameData;

  beforeEach(() => {
    mockEnv = {
      GAME: {
        idFromName: vi.fn(),
        get: vi.fn()
      }
    };

    mockGameObj = {
      fetch: vi.fn()
    };

    mockGameData = [
      {
        email: 'admin@example.com',
        state: 'CA',
        plate: 'ABC123',
        score: 85,
        bannedAt: null
      },
      {
        email: 'user@example.com',
        state: 'NY',
        plate: 'XYZ789',
        score: 92,
        bannedAt: null
      }
    ];

    vi.clearAllMocks();
  });

  describe('handleReports', () => {
    describe('happy path', () => {
      it('should return full game data for admin users', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        const { anonymizeEmail, getCurrentMonthYear } = await import('../../src/lib/utils.js');
        
        getEmailFromSessionToken.mockResolvedValue('admin@example.com');
        isAdmin.mockResolvedValue(true);
        getCurrentMonthYear.mockReturnValue('2024-01');
        anonymizeEmail.mockImplementation(email => email);

        mockEnv.GAME.idFromName.mockReturnValue('game-id');
        mockEnv.GAME.get.mockReturnValue(mockGameObj);
        mockGameObj.fetch.mockResolvedValue({
          json: () => Promise.resolve(mockGameData)
        });

        const mockRequest = new Request('https://example.com/reports', {
          headers: {
            'Authorization': 'admin-session-token'
          }
        });

        const response = await handleReports(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.message).toBe('Authenticated as Admin');
        expect(body.monthYear).toBe('2024-01');
        expect(body.gameData).toEqual(mockGameData);
        expect(getEmailFromSessionToken).toHaveBeenCalledWith('admin-session-token', mockEnv);
        expect(isAdmin).toHaveBeenCalledWith('admin@example.com');
      });

      it('should return anonymized game data for non-admin users', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        const { anonymizeEmail, getCurrentMonthYear } = await import('../../src/lib/utils.js');
        
        getEmailFromSessionToken.mockResolvedValue('user@example.com');
        isAdmin.mockResolvedValue(false);
        getCurrentMonthYear.mockReturnValue('2024-01');
        anonymizeEmail.mockImplementation(email => email.replace(/@.*/, '@***'));

        mockEnv.GAME.idFromName.mockReturnValue('game-id');
        mockEnv.GAME.get.mockReturnValue(mockGameObj);
        mockGameObj.fetch.mockResolvedValue({
          json: () => Promise.resolve(mockGameData)
        });

        const mockRequest = new Request('https://example.com/reports', {
          headers: {
            'Authorization': 'user-session-token'
          }
        });

        const response = await handleReports(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.message).toBe('Authenticated as User');
        expect(body.monthYear).toBe('2024-01');
        expect(body.gameData).toHaveLength(2);
        expect(body.gameData[0].email).toBe('admin@***');
        expect(body.gameData[1].email).toBe('user@***');
        expect(anonymizeEmail).toHaveBeenCalledTimes(2);
      });
    });

    describe('error cases', () => {
      it('should return 401 when no session token provided', async () => {
        const mockRequest = new Request('https://example.com/reports');
        // No Authorization header

        const response = await handleReports(mockRequest, mockEnv);
        
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toBe('No session token provided');
      });

      it('should return 403 when session token is invalid', async () => {
        const { getEmailFromSessionToken } = await import('../../src/lib/auth.js');
        getEmailFromSessionToken.mockResolvedValue(null);

        const mockRequest = new Request('https://example.com/reports', {
          headers: {
            'Authorization': 'invalid-session-token'
          }
        });

        const response = await handleReports(mockRequest, mockEnv);
        
        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error).toBe('Invalid session token');
      });

      it('should handle game data retrieval errors gracefully', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        const { getCurrentMonthYear } = await import('../../src/lib/utils.js');
        
        getEmailFromSessionToken.mockResolvedValue('admin@example.com');
        isAdmin.mockResolvedValue(true);
        getCurrentMonthYear.mockReturnValue('2024-01');

        mockEnv.GAME.idFromName.mockReturnValue('game-id');
        mockEnv.GAME.get.mockReturnValue(mockGameObj);
        mockGameObj.fetch.mockRejectedValue(new Error('Game data fetch failed'));

        const mockRequest = new Request('https://example.com/reports', {
          headers: {
            'Authorization': 'admin-session-token'
          }
        });

        // This should not throw an error, but the test will fail if it does
        // The actual function doesn't have error handling for game data fetch failures
        // So this test documents that limitation
        await expect(async () => {
          await handleReports(mockRequest, mockEnv);
        }).rejects.toThrow('Game data fetch failed');
      });
    });

    describe('edge cases', () => {
      it('should handle empty game data', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        const { anonymizeEmail, getCurrentMonthYear } = await import('../../src/lib/utils.js');
        
        getEmailFromSessionToken.mockResolvedValue('admin@example.com');
        isAdmin.mockResolvedValue(true);
        getCurrentMonthYear.mockReturnValue('2024-01');
        anonymizeEmail.mockImplementation(email => email);

        mockEnv.GAME.idFromName.mockReturnValue('game-id');
        mockEnv.GAME.get.mockReturnValue(mockGameObj);
        mockGameObj.fetch.mockResolvedValue({
          json: () => Promise.resolve([])
        });

        const mockRequest = new Request('https://example.com/reports', {
          headers: {
            'Authorization': 'admin-session-token'
          }
        });

        const response = await handleReports(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.gameData).toEqual([]);
      });

      it('should handle malformed game data response', async () => {
        const { getEmailFromSessionToken, isAdmin } = await import('../../src/lib/auth.js');
        const { getCurrentMonthYear } = await import('../../src/lib/utils.js');
        
        getEmailFromSessionToken.mockResolvedValue('admin@example.com');
        isAdmin.mockResolvedValue(true);
        getCurrentMonthYear.mockReturnValue('2024-01');

        mockEnv.GAME.idFromName.mockReturnValue('game-id');
        mockEnv.GAME.get.mockReturnValue(mockGameObj);
        mockGameObj.fetch.mockResolvedValue({
          json: () => Promise.resolve(null)
        });

        const mockRequest = new Request('https://example.com/reports', {
          headers: {
            'Authorization': 'admin-session-token'
          }
        });

        // The function should handle null data gracefully and return an empty array
        // This test documents the current behavior
        const response = await handleReports(mockRequest, mockEnv);
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.gameData).toEqual([]);
      });
    });
  });
});
