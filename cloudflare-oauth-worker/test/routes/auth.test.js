import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleOAuth, handleSessionValidation } from '../../src/routes/auth.js';

// Mock dependencies
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-session-token')
}));

describe('Auth Routes', () => {
  let mockEnv;
  let mockUrl;

  beforeEach(() => {
    mockEnv = {
      GOOGLE_OAUTH_CLIENT_ID: 'test-client-id',
      GOOGLE_OAUTH_CLIENT_SECRET: 'test-client-secret',
      NODE_ENV: 'development',
      USER: {
        idFromName: vi.fn(() => 'mock-user-id'),
        get: vi.fn(() => ({
          fetch: vi.fn().mockResolvedValue({ ok: true })
        }))
      },
      USER_SESSIONS: {
        idFromName: vi.fn(() => 'mock-session-id'),
        get: vi.fn(() => ({
          fetch: vi.fn().mockResolvedValue({ ok: true })
        }))
      }
    };

    vi.clearAllMocks();
  });

  describe('handleOAuth', () => {
    describe('OAuth initiation (no code parameter)', () => {
      it('should redirect to Google OAuth consent screen when no code is present', async () => {
        // Test the actual logic: no code in URL params = redirect to Google
        mockUrl = new URL('https://example.com/sessions/new');
        
        const response = await handleOAuth(new Request('https://example.com/sessions/new'), mockEnv, mockUrl);
        
        expect(response.status).toBe(302);
        const location = response.headers.get('Location');
        
        // Verify it's actually redirecting to Google OAuth
        expect(location).toContain('accounts.google.com/o/oauth2/auth');
        
        // Parse the URL to test the actual parameters being sent
        const oauthUrl = new URL(location);
        expect(oauthUrl.searchParams.get('client_id')).toBe('test-client-id');
        expect(oauthUrl.searchParams.get('response_type')).toBe('code');
        expect(oauthUrl.searchParams.get('scope')).toBe('email profile');
        expect(oauthUrl.searchParams.get('redirect_uri')).toBe('https://example.com/sessions/new');
      });

      it('should use production redirect URI in production environment', async () => {
        // Test the actual environment-specific logic
        mockEnv.NODE_ENV = 'production';
        mockUrl = new URL('https://example.com/sessions/new');
        
        const response = await handleOAuth(new Request('https://example.com/sessions/new'), mockEnv, mockUrl);
        
        const location = response.headers.get('Location');
        const oauthUrl = new URL(location);
        
        // Should use production redirect URI, not the current origin
        expect(oauthUrl.searchParams.get('redirect_uri')).toBe('https://api.platechase.com/sessions/new');
      });
    });

    describe('OAuth callback (with code parameter)', () => {
      beforeEach(() => {
        mockUrl = new URL('https://example.com/sessions/new?code=test-auth-code');
      });

      it('should complete full OAuth flow when valid code is provided', async () => {
        // Mock the EXACT external API calls the function makes
        global.fetch = vi.fn()
          .mockResolvedValueOnce({
            // First call: https://oauth2.googleapis.com/token
            ok: true,
            json: () => Promise.resolve({
              access_token: 'test-access-token',
              token_type: 'Bearer'
            })
          })
          .mockResolvedValueOnce({
            // Second call: https://www.googleapis.com/oauth2/v2/userinfo
            ok: true,
            json: () => Promise.resolve({
              email: 'test@example.com',
              name: 'Test User',
              picture: 'https://example.com/avatar.jpg'
            })
          });

        const response = await handleOAuth(new Request('https://example.com/sessions/new?code=test-auth-code'), mockEnv, mockUrl);
        
        // Test the actual response behavior
        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe('http://localhost:3000');
        
        // Test that the function actually called the external APIs
        expect(global.fetch).toHaveBeenCalledTimes(2);
        
        // First call should be to Google token endpoint
        const firstCall = global.fetch.mock.calls[0];
        expect(firstCall[0]).toBe('https://oauth2.googleapis.com/token');
        expect(firstCall[1].method).toBe('POST');
        
        // Test the actual request body - URLSearchParams creates a specific format
        const requestBody = firstCall[1].body.toString();
        expect(requestBody).toContain('code=test-auth-code');
        expect(requestBody).toContain('client_id=test-client-id');
        expect(requestBody).toContain('grant_type=authorization_code');
        
        // Second call should be to Google userinfo endpoint
        const secondCall = global.fetch.mock.calls[1];
        expect(secondCall[0]).toBe('https://www.googleapis.com/oauth2/v2/userinfo');
        expect(secondCall[1].headers.Authorization).toBe('Bearer test-access-token');
        
        // Test that the function actually stored the user data
        expect(mockEnv.USER.idFromName).toHaveBeenCalledWith('test@example.com');
        expect(mockEnv.USER_SESSIONS.idFromName).toHaveBeenCalledWith('mock-session-token');
      });

      it('should set production redirect URL and cookie domain in production', async () => {
        mockEnv.NODE_ENV = 'production';
        
        global.fetch = vi.fn()
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
              access_token: 'test-access-token'
            })
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
              email: 'test@example.com',
              name: 'Test User'
            })
          });

        const response = await handleOAuth(new Request('https://example.com/sessions/new?code=test-auth-code'), mockEnv, mockUrl);
        
        // Test the actual production behavior
        expect(response.headers.get('Location')).toBe('https://www.platechase.com');
        
        const cookie = response.headers.get('Set-Cookie');
        expect(cookie).toContain('Domain=.platechase.com');
        expect(cookie).toContain('session=mock-session-token');
      });

      it('should handle OAuth token exchange failures with proper error response', async () => {
        // Test the actual error handling logic
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve({
            error: 'invalid_grant',
            error_description: 'The authorization code has expired'
          })
        });

        const response = await handleOAuth(new Request('https://example.com/sessions/new?code=test-auth-code'), mockEnv, mockUrl);
        
        // Should return 400 status with error message
        expect(response.status).toBe(400);
        const body = await response.text();
        expect(body).toContain('Failed to exchange code');
        expect(body).toContain('invalid_grant');
        
        // Should NOT have made the second API call
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      it('should handle user info fetch failures with proper error response', async () => {
        // Test the actual error handling for user info fetch
        global.fetch = vi.fn()
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
              access_token: 'test-access-token'
            })
          })
          .mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ error: 'unauthorized' })
          });

        const response = await handleOAuth(new Request('https://example.com/sessions/new?code=test-auth-code'), mockEnv, mockUrl);
        
        // Should return 500 status for user info failure
        expect(response.status).toBe(500);
        const body = await response.text();
        expect(body).toContain('Failed to fetch user info');
        
        // Should have made both API calls
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      it('should handle network errors during token exchange by crashing (current behavior)', async () => {
        // Test the ACTUAL current behavior - the function crashes on network errors
        global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));

        // The current implementation doesn't handle network errors gracefully
        // It will crash when fetch throws an error, which is the expected behavior
        await expect(
          handleOAuth(new Request('https://example.com/sessions/new?code=test-auth-code'), mockEnv, mockUrl)
        ).rejects.toThrow('Network timeout');
      });

      it('should handle malformed user info response gracefully', async () => {
        // Test edge case: Google returns user info without email
        global.fetch = vi.fn()
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
              access_token: 'test-access-token'
            })
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
              // Missing email field - this could happen in real OAuth
              name: 'Test User',
              picture: 'https://example.com/avatar.jpg'
            })
          });

        const response = await handleOAuth(new Request('https://example.com/sessions/new?code=test-auth-code'), mockEnv, mockUrl);
        
        // Should still succeed but with undefined email
        expect(response.status).toBe(302);
        
        // The function should still try to store the user (even with undefined email)
        expect(mockEnv.USER.idFromName).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('handleSessionValidation', () => {
    it('should validate existing session and return user data when session has email', async () => {
      // Test the ACTUAL logic: session has email = fetch user data and return valid: true
      const mockUserSession = {
        fetch: vi.fn().mockResolvedValue({
          json: () => Promise.resolve({ email: 'test@example.com' })
        })
      };
      
      const mockUser = {
        fetch: vi.fn().mockResolvedValue({
          json: () => Promise.resolve({
            email: 'test@example.com',
            name: 'Test User',
            created_at: '2024-01-01'
          })
        })
      };

      mockEnv.USER_SESSIONS.get.mockReturnValue(mockUserSession);
      mockEnv.USER.get.mockReturnValue(mockUser);

      const request = new Request('https://example.com/validate-session', {
        method: 'POST',
        body: 'valid-session-token'
      });

      const response = await handleSessionValidation(request, mockEnv);
      
      // Test the ACTUAL response behavior
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.valid).toBe(true);
      expect(body.user).toEqual({
        email: 'test@example.com',
        name: 'Test User',
        created_at: '2024-01-01'
      });
      
      // Test that the function actually called the Durable Objects with the RIGHT parameters
      expect(mockEnv.USER_SESSIONS.idFromName).toHaveBeenCalledWith('valid-session-token');
      expect(mockEnv.USER_SESSIONS.get).toHaveBeenCalledWith('mock-session-id');
      
      // Test that it actually fetched from the RIGHT endpoints
      expect(mockUserSession.fetch).toHaveBeenCalledWith(
        new Request('https://get-user-session')
      );
      expect(mockUser.fetch).toHaveBeenCalledWith(
        new Request('https://get-user')
      );
      
      // Test that it called USER.idFromName with the email from session data
      expect(mockEnv.USER.idFromName).toHaveBeenCalledWith('test@example.com');
    });

    it('should return 400 status when session token is empty', async () => {
      // Test the ACTUAL logic: empty body = 400 status
      const request = new Request('https://example.com/validate-session', {
        method: 'POST',
        body: ''
      });

      const response = await handleSessionValidation(request, mockEnv);
      
      // Should return 400 for empty token (as per the actual code)
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.valid).toBe(false);
      
      // Should NOT have called any Durable Objects
      expect(mockEnv.USER_SESSIONS.idFromName).not.toHaveBeenCalled();
      expect(mockEnv.USER_SESSIONS.get).not.toHaveBeenCalled();
    });

    it('should return valid: false when session data is null', async () => {
      // Test the ACTUAL logic: null session data = valid: false
      const mockUserSession = {
        fetch: vi.fn().mockResolvedValue({
          json: () => Promise.resolve(null)
        })
      };

      mockEnv.USER_SESSIONS.get.mockReturnValue(mockUserSession);

      const request = new Request('https://example.com/validate-session', {
        method: 'POST',
        body: 'expired-session-token'
      });

      const response = await handleSessionValidation(request, mockEnv);
      
      // Should return valid: false for null session data (as per the actual code)
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.valid).toBe(false);
      
      // Should have called the session Durable Object but NOT the user one
      expect(mockEnv.USER_SESSIONS.idFromName).toHaveBeenCalledWith('expired-session-token');
      expect(mockUserSession.fetch).toHaveBeenCalledWith(
        new Request('https://get-user-session')
      );
      expect(mockEnv.USER.idFromName).not.toHaveBeenCalled();
    });

    it('should return valid: false when session data has no email field', async () => {
      // Test the ACTUAL logic: session data exists but no email = valid: false
      const mockUserSession = {
        fetch: vi.fn().mockResolvedValue({
          json: () => Promise.resolve({ 
            session_id: '123',
            created_at: '2024-01-01'
            // Missing email field - this triggers the else branch
          })
        })
      };

      mockEnv.USER_SESSIONS.get.mockReturnValue(mockUserSession);

      const request = new Request('https://example.com/validate-session', {
        method: 'POST',
        body: 'session-without-email'
      });

      const response = await handleSessionValidation(request, mockEnv);
      
      // Should return valid: false when email is missing (as per the actual code)
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.valid).toBe(false);
      
      // Should have called the session Durable Object but NOT the user one
      expect(mockEnv.USER_SESSIONS.idFromName).toHaveBeenCalledWith('session-without-email');
      expect(mockUserSession.fetch).toHaveBeenCalledWith(
        new Request('https://get-user-session')
      );
      expect(mockEnv.USER.idFromName).not.toHaveBeenCalled();
    });

    it('should return valid: false when session data email is empty string', async () => {
      // Test the ACTUAL logic: empty string email = falsy, so valid: false
      const mockUserSession = {
        fetch: vi.fn().mockResolvedValue({
          json: () => Promise.resolve({ 
            email: '', // Empty string is falsy
            session_id: '123'
          })
        })
      };

      mockEnv.USER_SESSIONS.get.mockReturnValue(mockUserSession);

      const request = new Request('https://example.com/validate-session', {
        method: 'POST',
        body: 'session-with-empty-email'
      });

      const response = await handleSessionValidation(request, mockEnv);
      
      // Should return valid: false for empty string email (as per the actual code)
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.valid).toBe(false);
      
      // Should have called the session Durable Object but NOT the user one
      expect(mockEnv.USER_SESSIONS.idFromName).toHaveBeenCalledWith('session-with-empty-email');
      expect(mockUserSession.fetch).toHaveBeenCalledWith(
        new Request('https://get-user-session')
      );
      expect(mockEnv.USER.idFromName).not.toHaveBeenCalled();
    });

    it('should handle request.text() returning null gracefully', async () => {
      // Test the ACTUAL edge case: request.text() returns null
      const request = new Request('https://example.com/validate-session', {
        method: 'POST',
        body: null
      });

      const response = await handleSessionValidation(request, mockEnv);
      
      // Should return 400 for null body (as per the actual code)
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.valid).toBe(false);
      
      // Should NOT have called any Durable Objects
      expect(mockEnv.USER_SESSIONS.idFromName).not.toHaveBeenCalled();
    });

    it('should return proper JSON headers in all responses', async () => {
      // Test the ACTUAL response headers being set
      const mockUserSession = {
        fetch: vi.fn().mockResolvedValue({
          json: () => Promise.resolve({ email: 'test@example.com' })
        })
      };
      
      const mockUser = {
        fetch: vi.fn().mockResolvedValue({
          json: () => Promise.resolve({
            email: 'test@example.com',
            name: 'Test User'
          })
        })
      };

      mockEnv.USER_SESSIONS.get.mockReturnValue(mockUserSession);
      mockEnv.USER.get.mockReturnValue(mockUser);

      const request = new Request('https://example.com/validate-session', {
        method: 'POST',
        body: 'valid-session-token'
      });

      const response = await handleSessionValidation(request, mockEnv);
      
      // Test the ACTUAL headers being set
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      // Test that the body is actually valid JSON
      const body = await response.json();
      expect(typeof body).toBe('object');
      expect(body).toHaveProperty('valid');
      expect(body).toHaveProperty('user');
    });
  });
});
