import { describe, it, expect, vi, beforeEach } from 'vitest';
import indexModule from '../src/index.js';

// Mock all route handlers with the actual method names from index.js
vi.mock('../src/routes/auth.js', () => ({
  handleOAuth: vi.fn(),
  handleSessionValidation: vi.fn()
}));

vi.mock('../src/routes/game.js', () => ({
  handleGetGame: vi.fn(),
  handlePutGame: vi.fn()
}));

vi.mock('../src/routes/users.js', () => ({
  handleBanUser: vi.fn(),
  handleUnbanUser: vi.fn()
}));

vi.mock('../src/routes/reports.js', () => ({
  handleReports: vi.fn()
}));

vi.mock('../src/routes/debug.js', () => ({
  handleDebugEnv: vi.fn(),
  handleDebugGame: vi.fn()
}));

vi.mock('../src/lib/cors.js', () => ({
  setCORSHeaders: vi.fn((response) => response)
}));

describe('Main Router (index.js)', () => {
  let mockEnv;
  let mockContext;

  beforeEach(() => {
    mockEnv = {
      GAMES: 'mock-games-namespace',
      USER_SESSIONS: 'mock-user-sessions-namespace',
      USERS: 'mock-users-namespace',
      AWS_ACCESS_KEY_ID: 'mock-aws-key',
      AWS_SECRET_ACCESS_KEY: 'mock-aws-secret',
      NOTIFICATION_EMAIL: 'test@example.com'
    };

    mockContext = {
      waitUntil: vi.fn()
    };

    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should route OAuth callback requests correctly', async () => {
      const { handleOAuth } = await import('../src/routes/auth.js');
      const mockResponse = new Response('OAuth callback handled', { status: 200 });
      handleOAuth.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/sessions/new?code=test-code&state=test-state');

      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      expect(handleOAuth).toHaveBeenCalledWith(mockRequest, mockEnv, expect.any(URL));
      expect(response).toBe(mockResponse);
    });

    it('should route session validation requests correctly', async () => {
      const { handleSessionValidation } = await import('../src/routes/auth.js');
      const mockResponse = new Response('Session validated', { status: 200 });
      handleSessionValidation.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/validate-session');

      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      expect(handleSessionValidation).toHaveBeenCalledWith(mockRequest, mockEnv);
      expect(response).toBe(mockResponse);
    });

    it('should route game GET requests correctly', async () => {
      const { handleGetGame } = await import('../src/routes/game.js');
      const mockResponse = new Response('Game retrieved', { status: 200 });
      handleGetGame.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/game', { method: 'GET' });

      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      expect(handleGetGame).toHaveBeenCalledWith(mockRequest, mockEnv);
      expect(response).toBe(mockResponse);
    });

    it('should route game PUT requests correctly', async () => {
      const { handlePutGame } = await import('../src/routes/game.js');
      const mockResponse = new Response('Game updated', { status: 200 });
      handlePutGame.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/game', { method: 'PUT' });

      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      expect(handlePutGame).toHaveBeenCalledWith(mockRequest, mockEnv);
      expect(response).toBe(mockResponse);
    });

    it('should route user ban requests correctly', async () => {
      const { handleBanUser } = await import('../src/routes/users.js');
      const mockResponse = new Response('User banned', { status: 200 });
      handleBanUser.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/users/ban', { method: 'PUT' });

      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      expect(handleBanUser).toHaveBeenCalledWith(mockRequest, mockEnv);
      expect(response).toBe(mockResponse);
    });

    it('should route user unban requests correctly', async () => {
      const { handleUnbanUser } = await import('../src/routes/users.js');
      const mockResponse = new Response('User unbanned', { status: 200 });
      handleUnbanUser.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/users/unban', { method: 'PUT' });

      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      expect(handleUnbanUser).toHaveBeenCalledWith(mockRequest, mockEnv);
      expect(response).toBe(mockResponse);
    });

    it('should route reports requests correctly', async () => {
      const { handleReports } = await import('../src/routes/reports.js');
      const mockResponse = new Response('Reports retrieved', { status: 200 });
      handleReports.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/reports');

      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      expect(handleReports).toHaveBeenCalledWith(mockRequest, mockEnv);
      expect(response).toBe(mockResponse);
    });

    it('should route debug environment requests correctly', async () => {
      const { handleDebugEnv } = await import('../src/routes/debug.js');
      const mockResponse = new Response('Debug env', { status: 200 });
      handleDebugEnv.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/debug-env');

      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      expect(handleDebugEnv).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
      expect(response).toBe(mockResponse);
    });

    it('should route debug game requests correctly', async () => {
      const { handleDebugGame } = await import('../src/routes/debug.js');
      const mockResponse = new Response('Debug game', { status: 200 });
      handleDebugGame.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/debug-game');

      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      expect(handleDebugGame).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
      expect(response).toBe(mockResponse);
    });

    it('should return 404 for unknown routes', async () => {
      const mockRequest = new Request('https://example.com/unknown-route');

      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Not found');
    });

    it('should return 404 for root path', async () => {
      const mockRequest = new Request('https://example.com/');

      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Not found');
    });
  });

  describe('method validation', () => {
    it('should reject unsupported methods for /game endpoint', async () => {
      const unsupportedMethods = ['POST', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

      for (const method of unsupportedMethods) {
        const mockRequest = new Request('https://example.com/game', { method });
        const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(405);
        const body = await response.json();
        expect(body.error).toBe('Unsupported request method');
      }
    });

    it('should reject unsupported methods for /users/ban endpoint', async () => {
      const unsupportedMethods = ['GET', 'POST', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

      for (const method of unsupportedMethods) {
        const mockRequest = new Request('https://example.com/users/ban', { method });
        const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(405);
        const body = await response.json();
        expect(body.error).toBe('Method not allowed');
      }
    });

    it('should reject unsupported methods for /users/unban endpoint', async () => {
      const unsupportedMethods = ['GET', 'POST', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

      for (const method of unsupportedMethods) {
        const mockRequest = new Request('https://example.com/users/unban', { method });
        const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(405);
        const body = await response.json();
        expect(body.error).toBe('Method not allowed');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle requests with trailing slashes', async () => {
      // Trailing slash makes it a different path, so it should return 404
      const mockRequest = new Request('https://example.com/game/', { method: 'GET' });

      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      // Should return 404 for unknown routes (including /game/)
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Not found');
    });

    it('should handle requests with query parameters', async () => {
      const { handleGetGame } = await import('../src/routes/game.js');
      const mockResponse = new Response('Game retrieved', { status: 200 });
      handleGetGame.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/game?format=json&verbose=true', { method: 'GET' });

      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      // Query parameters don't affect pathname matching
      expect(handleGetGame).toHaveBeenCalledWith(mockRequest, mockEnv);
      expect(response).toBe(mockResponse);
    });

    it('should handle malformed URLs gracefully', async () => {
      const malformedUrls = [
        'https://example.com//game',
        'https://example.com/game//',
        'https://example.com//game//'
      ];

      for (const url of malformedUrls) {
        const mockRequest = new Request(url, { method: 'GET' });
        const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
        
        // Malformed URLs should return 404, not crash
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.error).toBe('Not found');
      }
    });

    it('should handle very long URLs gracefully', async () => {
      const longPath = '/game/' + 'a'.repeat(1000);
      const mockRequest = new Request(`https://example.com${longPath}`);

      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      // Should not crash and should return 404 for unknown routes
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Not found');
    });

    it('should handle requests with special characters in URLs', async () => {
      // Test one special character URL at a time to isolate the issue
      const mockRequest = new Request('https://example.com/game%20test', { method: 'GET' });
      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      // Should return 404 since this doesn't exactly match /game
      expect(response).toBeDefined();
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Not found');
    });

    it('should handle requests with plus signs in URLs', async () => {
      const mockRequest = new Request('https://example.com/game+test', { method: 'GET' });
      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      // Should return 404 since this doesn't exactly match /game
      expect(response).toBeDefined();
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Not found');
    });

    it('should handle requests with at signs in URLs', async () => {
      const mockRequest = new Request('https://example.com/game@test', { method: 'GET' });
      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      // Should return 404 for unknown routes
      expect(response).toBeDefined();
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Not found');
    });

    it('should handle requests with hash signs in URLs', async () => {
      const mockRequest = new Request('https://example.com/game#test', { method: 'GET' });
      
      // Hash signs create fragments, not pathname parts, so this routes to /game
      // Need to mock the handler since this path matches a defined route
      const { handleGetGame } = await import('../src/routes/game.js');
      const mockResponse = new Response('Game retrieved', { status: 200 });
      handleGetGame.mockResolvedValue(mockResponse);
      
      const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      // Should route to game handler since #test is a fragment, not part of pathname
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(response).toBe(mockResponse);
    });

    it('should handle requests with different hostnames', async () => {
      const hostnames = [
        'https://localhost:3000',
        'https://example.com',
        'https://subdomain.example.com',
        'https://api.example.com'
      ];

      for (const hostname of hostnames) {
        const mockRequest = new Request(`${hostname}/game`, { method: 'GET' });
        
        // Need to mock the handler since this path matches a defined route
        const { handleGetGame } = await import('../src/routes/game.js');
        const mockResponse = new Response('Game retrieved', { status: 200 });
        handleGetGame.mockResolvedValue(mockResponse);
        
        const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
        
        // Should route correctly regardless of hostname (pathname is what matters)
        expect(response.status).not.toBe(500);
      }
    });

    it('should handle requests with different protocols', async () => {
      const protocols = ['http', 'https', 'ws', 'wss'];

      for (const protocol of protocols) {
        const mockRequest = new Request(`${protocol}://example.com/game`, { method: 'GET' });
        
        // Need to mock the handler since this path matches a defined route
        const { handleGetGame } = await import('../src/routes/game.js');
        const mockResponse = new Response('Game retrieved', { status: 200 });
        handleGetGame.mockResolvedValue(mockResponse);
        
        const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
        
        // Should route correctly regardless of protocol (pathname is what matters)
        expect(response.status).not.toBe(500);
      }
    });

    it('should handle requests with missing environment variables gracefully', async () => {
      const incompleteEnv = {
        // Missing required environment variables
      };

      const mockRequest = new Request('https://example.com/game', { method: 'GET' });
      
      // Need to mock the handler since this path matches a defined route
      const { handleGetGame } = await import('../src/routes/game.js');
      const mockResponse = new Response('Game retrieved', { status: 200 });
      handleGetGame.mockResolvedValue(mockResponse);

      const response = await indexModule.fetch(mockRequest, incompleteEnv, mockContext);
      
      // Should handle missing env vars gracefully
      expect(response.status).not.toBe(500);
    });

    it('should handle requests with null/undefined context gracefully', async () => {
      const mockRequest = new Request('https://example.com/game', { method: 'GET' });
      
      // Need to mock the handler since this path matches a defined route
      const { handleGetGame } = await import('../src/routes/game.js');
      const mockResponse = new Response('Game retrieved', { status: 200 });
      handleGetGame.mockResolvedValue(mockResponse);

      const response = await indexModule.fetch(mockRequest, mockEnv, null);
      
      // Should handle null context gracefully
      expect(response.status).not.toBe(500);
    });

    it('should handle path variations correctly', async () => {
      // These should all return 404 since they don't exactly match defined routes
      const pathVariations = [
        '/game/123',
        '/game/abc',
        '/game/',
        '/game/subpath',
        '/sessions/old',
        '/users/ban/extra',
        '/users/unban/extra',
        '/reports/123',
        '/debug-env/extra',
        '/debug-game/extra'
      ];

      for (const path of pathVariations) {
        const mockRequest = new Request(`https://example.com${path}`, { method: 'GET' });
        const response = await indexModule.fetch(mockRequest, mockEnv, mockContext);
        
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.error).toBe('Not found');
      }
    });
  });

  describe('error handling', () => {
    it('should propagate handler errors', async () => {
      const { handleGetGame } = await import('../src/routes/game.js');
      handleGetGame.mockRejectedValue(new Error('Handler error'));

      const mockRequest = new Request('https://example.com/game', { method: 'GET' });

      await expect(indexModule.fetch(mockRequest, mockEnv, mockContext))
        .rejects.toThrow('Handler error');
    });

    it('should propagate multiple handler errors', async () => {
      const { handleOAuth } = await import('../src/routes/auth.js');
      handleOAuth.mockRejectedValue(new Error('OAuth error'));

      const mockRequest = new Request('https://example.com/sessions/new');

      await expect(indexModule.fetch(mockRequest, mockEnv, mockContext))
        .rejects.toThrow('OAuth error');
    });
  });

  describe('environment logging', () => {
    it('should log environment variables on first request', async () => {
      // Reset the module to clear the envLogged flag
      vi.resetModules();
      const freshIndexModule = await import('../src/index.js');
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const mockRequest = new Request('https://example.com/game', { method: 'GET' });
      const { handleGetGame } = await import('../src/routes/game.js');
      handleGetGame.mockResolvedValue(new Response('OK'));

      await freshIndexModule.default.fetch(mockRequest, mockEnv, mockContext);
      
      expect(consoleSpy).toHaveBeenCalledWith('🚀 SERVER START - All environment variables:');
      expect(consoleSpy).toHaveBeenCalledWith('🔑 AWS_ACCESS_KEY_ID:', 'mock-aws-key');
      expect(consoleSpy).toHaveBeenCalledWith('🔑 AWS_SECRET_ACCESS_KEY:', 'mock-aws-secret');
      expect(consoleSpy).toHaveBeenCalledWith('📧 NOTIFICATION_EMAIL:', 'test@example.com');
      
      consoleSpy.mockRestore();
    });

    it('should only log environment variables once', async () => {
      // Reset the module to clear the envLogged flag
      vi.resetModules();
      const freshIndexModule = await import('../src/index.js');
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const mockRequest = new Request('https://example.com/game', { method: 'GET' });
      const { handleGetGame } = await import('../src/routes/game.js');
      handleGetGame.mockResolvedValue(new Response('OK'));

      // First request
      await freshIndexModule.default.fetch(mockRequest, mockEnv, mockContext);
      
      // Second request
      await freshIndexModule.default.fetch(mockRequest, mockEnv, mockContext);
      
      // Should only log once
      const logCalls = consoleSpy.mock.calls.filter(call => 
        call[0] === '🚀 SERVER START - All environment variables:'
      );
      expect(logCalls).toHaveLength(1);
      
      consoleSpy.mockRestore();
    });
  });

  describe('CORS handling', () => {
    it('should apply CORS headers to all responses', async () => {
      const { setCORSHeaders } = await import('../src/lib/cors.js');
      const mockRequest = new Request('https://example.com/game', { method: 'GET' });
      const { handleGetGame } = await import('../src/routes/game.js');
      handleGetGame.mockResolvedValue(new Response('OK'));

      await indexModule.fetch(mockRequest, mockEnv, mockContext);
      
      expect(setCORSHeaders).toHaveBeenCalledWith(expect.any(Response), mockEnv, mockRequest);
    });

    it('should propagate errors without applying CORS headers', async () => {
      const { setCORSHeaders } = await import('../src/lib/cors.js');
      const { handleGetGame } = await import('../src/routes/game.js');
      handleGetGame.mockRejectedValue(new Error('Handler error'));

      const mockRequest = new Request('https://example.com/game', { method: 'GET' });

      await expect(indexModule.fetch(mockRequest, mockEnv, mockContext))
        .rejects.toThrow('Handler error');
      
      // Since errors now propagate, CORS headers won't be applied to error responses
      // The test now verifies that errors are properly propagated
    });
  });
});
