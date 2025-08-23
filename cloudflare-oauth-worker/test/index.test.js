import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleRequest } from '../src/index.js';

// Mock all route handlers
vi.mock('../src/routes/auth.js', () => ({
  handleOAuthCallback: vi.fn(),
  handleSessionValidation: vi.fn()
}));

vi.mock('../src/routes/game.js', () => ({
  handleGameGet: vi.fn(),
  handleGamePost: vi.fn(),
  handleGamePut: vi.fn(),
  handleGameDelete: vi.fn()
}));

vi.mock('../src/routes/users.js', () => ({
  handleUserBan: vi.fn(),
  handleUserUnban: vi.fn()
}));

vi.mock('../src/routes/reports.js', () => ({
  handleReportsGet: vi.fn()
}));

vi.mock('../src/routes/debug.js', () => ({
  handleDebugEnv: vi.fn(),
  handleDebugGame: vi.fn()
}));

vi.mock('../src/lib/cors.js', () => ({
  handleCORS: vi.fn()
}));

describe('Main Router (index.js)', () => {
  let mockEnv;
  let mockContext;

  beforeEach(() => {
    mockEnv = {
      GAMES: 'mock-games-namespace',
      USER_SESSIONS: 'mock-user-sessions-namespace',
      USERS: 'mock-users-namespace'
    };

    mockContext = {
      waitUntil: vi.fn()
    };

    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should route OAuth callback requests correctly', async () => {
      const { handleOAuthCallback } = await import('../src/routes/auth.js');
      const mockResponse = new Response('OAuth callback handled', { status: 200 });
      handleOAuthCallback.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/sessions/new?code=test-code&state=test-state');

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      expect(handleOAuthCallback).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
      expect(response).toBe(mockResponse);
    });

    it('should route session validation requests correctly', async () => {
      const { handleSessionValidation } = await import('../src/routes/auth.js');
      const mockResponse = new Response('Session validated', { status: 200 });
      handleSessionValidation.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/validate-session');

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      expect(handleSessionValidation).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
      expect(response).toBe(mockResponse);
    });

    it('should route game GET requests correctly', async () => {
      const { handleGameGet } = await import('../src/routes/game.js');
      const mockResponse = new Response('Game retrieved', { status: 200 });
      handleGameGet.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/game/game123');

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      expect(handleGameGet).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
      expect(response).toBe(mockResponse);
    });

    it('should route game POST requests correctly', async () => {
      const { handleGamePost } = await import('../src/routes/game.js');
      const mockResponse = new Response('Game created', { status: 201 });
      handleGamePost.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/game', { method: 'POST' });

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      expect(handleGamePost).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
      expect(response).toBe(mockResponse);
    });

    it('should route game PUT requests correctly', async () => {
      const { handleGamePut } = await import('../src/routes/game.js');
      const mockResponse = new Response('Game updated', { status: 200 });
      handleGamePut.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/game/game123', { method: 'PUT' });

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      expect(handleGamePut).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
      expect(response).toBe(mockResponse);
    });

    it('should route game DELETE requests correctly', async () => {
      const { handleGameDelete } = await import('../src/routes/game.js');
      const mockResponse = new Response('Game deleted', { status: 200 });
      handleGameDelete.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/game/game123', { method: 'DELETE' });

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      expect(handleGameDelete).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
      expect(response).toBe(mockResponse);
    });

    it('should route user ban requests correctly', async () => {
      const { handleUserBan } = await import('../src/routes/users.js');
      const mockResponse = new Response('User banned', { status: 200 });
      handleUserBan.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/users/user123/ban', { method: 'POST' });

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      expect(handleUserBan).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
      expect(response).toBe(mockResponse);
    });

    it('should route user unban requests correctly', async () => {
      const { handleUserUnban } = await import('../src/routes/users.js');
      const mockResponse = new Response('User unbanned', { status: 200 });
      handleUserUnban.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/users/user123/unban', { method: 'POST' });

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      expect(handleUserUnban).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
      expect(response).toBe(mockResponse);
    });

    it('should route reports requests correctly', async () => {
      const { handleReportsGet } = await import('../src/routes/reports.js');
      const mockResponse = new Response('Reports retrieved', { status: 200 });
      handleReportsGet.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/reports');

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      expect(handleReportsGet).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
      expect(response).toBe(mockResponse);
    });

    it('should route debug environment requests correctly', async () => {
      const { handleDebugEnv } = await import('../src/routes/debug.js');
      const mockResponse = new Response('Debug env', { status: 200 });
      handleDebugEnv.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/debug-env');

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      expect(handleDebugEnv).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
      expect(response).toBe(mockResponse);
    });

    it('should route debug game requests correctly', async () => {
      const { handleDebugGame } = await import('../src/routes/debug.js');
      const mockResponse = new Response('Debug game', { status: 200 });
      handleDebugGame.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/debug-game');

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      expect(handleDebugGame).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
      expect(response).toBe(mockResponse);
    });
  });

  describe('edge cases', () => {
    it('should handle unknown routes with 404', async () => {
      const mockRequest = new Request('https://example.com/unknown-route');

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toContain('Not found');
    });

    it('should handle root path requests', async () => {
      const mockRequest = new Request('https://example.com/');

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toContain('Not found');
    });

    it('should handle requests with trailing slashes', async () => {
      const { handleGameGet } = await import('../src/routes/game.js');
      const mockResponse = new Response('Game retrieved', { status: 200 });
      handleGameGet.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/game/game123/');

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      expect(handleGameGet).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
      expect(response).toBe(mockResponse);
    });

    it('should handle requests with query parameters', async () => {
      const { handleGameGet } = await import('../src/routes/game.js');
      const mockResponse = new Response('Game retrieved', { status: 200 });
      handleGameGet.mockResolvedValue(mockResponse);

      const mockRequest = new Request('https://example.com/game/game123?format=json&verbose=true');

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      expect(handleGameGet).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
      expect(response).toBe(mockResponse);
    });

    it('should handle requests with different HTTP methods on same path', async () => {
      const { handleGameGet, handleGamePost } = await import('../src/routes/game.js');
      const mockGetResponse = new Response('Game retrieved', { status: 200 });
      const mockPostResponse = new Response('Game created', { status: 201 });
      handleGameGet.mockResolvedValue(mockGetResponse);
      handleGamePost.mockResolvedValue(mockPostResponse);

      // GET request
      const getRequest = new Request('https://example.com/game/game123', { method: 'GET' });
      const getResponse = await handleRequest(getRequest, mockEnv, mockContext);
      expect(getResponse).toBe(mockGetResponse);

      // POST request
      const postRequest = new Request('https://example.com/game/game123', { method: 'POST' });
      const postResponse = await handleRequest(postRequest, mockEnv, mockContext);
      expect(postResponse).toBe(mockPostResponse);
    });

    it('should handle malformed URLs gracefully', async () => {
      const malformedUrls = [
        'https://example.com//game//game123',
        'https://example.com/game//game123',
        'https://example.com//game/game123',
        'https://example.com/game/game123//'
      ];

      for (const url of malformedUrls) {
        const mockRequest = new Request(url);
        const response = await handleRequest(mockRequest, mockEnv, mockContext);
        
        // Should still route correctly despite malformed URLs
        expect(response.status).not.toBe(500);
      }
    });

    it('should handle very long URLs gracefully', async () => {
      const longPath = '/game/' + 'a'.repeat(1000);
      const mockRequest = new Request(`https://example.com${longPath}`);

      const response = await handleRequest(mockRequest, mockEnv, mockContext);
      
      // Should not crash and should return appropriate response
      expect(response.status).toBe(404);
    });

    it('should handle requests with special characters in URLs', async () => {
      const specialUrls = [
        'https://example.com/game/game%20123',
        'https://example.com/game/game+123',
        'https://example.com/game/game@123',
        'https://example.com/game/game#123'
      ];

      for (const url of specialUrls) {
        const mockRequest = new Request(url);
        const response = await handleRequest(mockRequest, mockEnv, mockContext);
        
        // Should handle URL encoding correctly
        expect(response.status).not.toBe(500);
      }
    });

    it('should handle requests with different hostnames', async () => {
      const hostnames = [
        'https://localhost:3000',
        'https://example.com',
        'https://subdomain.example.com',
        'https://api.example.com'
      ];

      for (const hostname of hostnames) {
        const mockRequest = new Request(`${hostname}/game/game123`);
        const response = await handleRequest(mockRequest, mockEnv, mockContext);
        
        // Should route correctly regardless of hostname
        expect(response.status).not.toBe(500);
      }
    });

    it('should handle requests with different protocols', async () => {
      const protocols = ['http', 'https', 'ws', 'wss'];

      for (const protocol of protocols) {
        const mockRequest = new Request(`${protocol}://example.com/game/game123`);
        const response = await handleRequest(mockRequest, mockEnv, mockContext);
        
        // Should route correctly regardless of protocol
        expect(response.status).not.toBe(500);
      }
    });

    it('should handle requests with missing environment variables gracefully', async () => {
      const incompleteEnv = {
        // Missing required environment variables
      };

      const mockRequest = new Request('https://example.com/game/game123');

      const response = await handleRequest(mockRequest, incompleteEnv, mockContext);
      
      // Should handle missing env vars gracefully
      expect(response.status).not.toBe(500);
    });

    it('should handle requests with null/undefined context gracefully', async () => {
      const mockRequest = new Request('https://example.com/game/game123');

      const response = await handleRequest(mockRequest, mockEnv, null);
      
      // Should handle null context gracefully
      expect(response.status).not.toBe(500);
    });
  });

  describe('routing logic', () => {
    it('should match exact route patterns', async () => {
      const { handleGameGet } = await import('../src/routes/game.js');
      const mockResponse = new Response('Game retrieved', { status: 200 });
      handleGameGet.mockResolvedValue(mockResponse);

      const exactRoutes = [
        '/game/game123',
        '/game/abc-123',
        '/game/123_abc',
        '/game/game.with.dots'
      ];

      for (const route of exactRoutes) {
        const mockRequest = new Request(`https://example.com${route}`);
        const response = await handleRequest(mockRequest, mockEnv, mockContext);
        
        expect(handleGameGet).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
        expect(response).toBe(mockResponse);
      }
    });

    it('should prioritize more specific routes over generic ones', async () => {
      const { handleGameGet, handleGamePost } = await import('../src/routes/game.js');
      const mockGetResponse = new Response('Game retrieved', { status: 200 });
      const mockPostResponse = new Response('Game created', { status: 201 });
      handleGameGet.mockResolvedValue(mockGetResponse);
      handleGamePost.mockResolvedValue(mockPostResponse);

      // More specific route should take precedence
      const specificRequest = new Request('https://example.com/game/game123', { method: 'GET' });
      const specificResponse = await handleRequest(specificRequest, mockEnv, mockContext);
      expect(specificResponse).toBe(mockGetResponse);

      // Generic route should still work
      const genericRequest = new Request('https://example.com/game', { method: 'POST' });
      const genericResponse = await handleRequest(genericRequest, mockEnv, mockContext);
      expect(genericResponse).toBe(mockPostResponse);
    });

    it('should handle case-insensitive routing', async () => {
      const { handleGameGet } = await import('../src/routes/game.js');
      const mockResponse = new Response('Game retrieved', { status: 200 });
      handleGameGet.mockResolvedValue(mockResponse);

      const caseVariations = [
        '/GAME/game123',
        '/Game/game123',
        '/game/GAME123',
        '/GAME/GAME123'
      ];

      for (const route of caseVariations) {
        const mockRequest = new Request(`https://example.com${route}`);
        const response = await handleRequest(mockRequest, mockEnv, mockContext);
        
        expect(handleGameGet).toHaveBeenCalledWith(mockRequest, mockEnv, mockContext);
        expect(response).toBe(mockResponse);
      }
    });
  });
});
