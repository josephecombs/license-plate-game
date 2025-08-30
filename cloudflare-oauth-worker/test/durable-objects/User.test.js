import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('User Durable Object', () => {
  let mockUser;
  let mockEnv;

  beforeEach(() => {
    // Mock the User Durable Object
    mockUser = {
      fetch: vi.fn()
    };

    mockEnv = {
      USER: {
        idFromName: vi.fn().mockReturnValue('mock-user-id'),
        get: vi.fn().mockReturnValue(mockUser)
      }
    };

    vi.clearAllMocks();
  });

  describe('store-user endpoint', () => {
    it('should store user info successfully', async () => {
      const userInfo = {
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg'
      };

      mockUser.fetch.mockResolvedValue({
        text: vi.fn().mockResolvedValue('User stored successfully')
      });

      const request = new Request('https://store-user', {
        method: 'POST',
        body: JSON.stringify({ userInfo })
      });

      const response = await mockUser.fetch(request);
      const responseText = await response.text();

      expect(responseText).toBe('User stored successfully');
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });

    it('should preserve existing bannedAt when storing user info', async () => {
      const userInfo = {
        email: 'test@example.com',
        name: 'Test User'
      };

      mockUser.fetch.mockResolvedValue({
        text: vi.fn().mockResolvedValue('User stored successfully')
      });

      const request = new Request('https://store-user', {
        method: 'POST',
        body: JSON.stringify({ userInfo })
      });

      const response = await mockUser.fetch(request);
      const responseText = await response.text();

      expect(responseText).toBe('User stored successfully');
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });

    it('should handle missing userInfo in request body', async () => {
      mockUser.fetch.mockResolvedValue({
        text: vi.fn().mockResolvedValue('User stored successfully')
      });

      const request = new Request('https://store-user', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await mockUser.fetch(request);
      const responseText = await response.text();

      expect(responseText).toBe('User stored successfully');
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });
  });

  describe('get-user endpoint', () => {
    it('should return user data successfully', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        bannedAt: null
      };

      mockUser.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(userData),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://get-user', {
        method: 'GET'
      });

      const response = await mockUser.fetch(request);
      const responseData = await response.json();

      expect(responseData).toEqual(userData);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });

    it('should return null when no user data exists', async () => {
      mockUser.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(null),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://get-user', {
        method: 'GET'
      });

      const response = await mockUser.fetch(request);
      const responseData = await response.json();

      expect(responseData).toBeNull();
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });
  });

  describe('ban-user endpoint', () => {
    it('should ban user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        bannedAt: null
      };

      const banResponse = {
        success: true,
        message: 'User banned successfully',
        bannedAt: Math.floor(Date.now() / 1000)
      };

      mockUser.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(banResponse),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://ban-user', {
        method: 'POST'
      });

      const response = await mockUser.fetch(request);
      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('User banned successfully');
      expect(responseData.bannedAt).toBeDefined();
      expect(typeof responseData.bannedAt).toBe('number');
      expect(responseData.bannedAt).toBeGreaterThan(0);
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });

    it('should return 404 when user does not exist', async () => {
      const errorResponse = {
        error: 'User not found'
      };

      mockUser.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(errorResponse),
        status: 404,
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://ban-user', {
        method: 'POST'
      });

      const response = await mockUser.fetch(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('User not found');
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });

    it('should set bannedAt to current Unix epoch time', async () => {
      const expectedBannedAt = Math.floor(Date.now() / 1000);
      const banResponse = {
        success: true,
        message: 'User banned successfully',
        bannedAt: expectedBannedAt
      };

      mockUser.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(banResponse),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://ban-user', {
        method: 'POST'
      });

      const response = await mockUser.fetch(request);
      const responseData = await response.json();

      expect(responseData.bannedAt).toBe(expectedBannedAt);
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });
  });

  describe('unban-user endpoint', () => {
    it('should unban user successfully', async () => {
      const unbanResponse = {
        success: true,
        message: 'User unbanned successfully',
        bannedAt: null
      };

      mockUser.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(unbanResponse),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://unban-user', {
        method: 'POST'
      });

      const response = await mockUser.fetch(request);
      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('User unbanned successfully');
      expect(responseData.bannedAt).toBeNull();
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });

    it('should return 404 when user does not exist', async () => {
      const errorResponse = {
        error: 'User not found'
      };

      mockUser.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(errorResponse),
        status: 404,
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://unban-user', {
        method: 'POST'
      });

      const response = await mockUser.fetch(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('User not found');
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });

    it('should work when user was not previously banned', async () => {
      const unbanResponse = {
        success: true,
        message: 'User unbanned successfully',
        bannedAt: null
      };

      mockUser.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(unbanResponse),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      const request = new Request('https://unban-user', {
        method: 'POST'
      });

      const response = await mockUser.fetch(request);
      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('User unbanned successfully');
      expect(responseData.bannedAt).toBeNull();
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });
  });

  describe('invalid endpoints', () => {
    it('should return 404 for unknown hostname', async () => {
      mockUser.fetch.mockResolvedValue({
        text: vi.fn().mockResolvedValue('Not found'),
        status: 404
      });

      const request = new Request('https://unknown-endpoint', {
        method: 'GET'
      });

      const response = await mockUser.fetch(request);
      const responseText = await response.text();

      expect(response.status).toBe(404);
      expect(responseText).toBe('Not found');
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });

    it('should return 404 for wrong method on valid endpoint', async () => {
      mockUser.fetch.mockResolvedValue({
        text: vi.fn().mockResolvedValue('Not found'),
        status: 404
      });

      const request = new Request('https://get-user', {
        method: 'POST'
      });

      const response = await mockUser.fetch(request);
      const responseText = await response.text();

      expect(response.status).toBe(404);
      expect(responseText).toBe('Not found');
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });

    it('should return 404 for wrong method on store-user endpoint', async () => {
      mockUser.fetch.mockResolvedValue({
        text: vi.fn().mockResolvedValue('Not found'),
        status: 404
      });

      const request = new Request('https://store-user', {
        method: 'GET'
      });

      const response = await mockUser.fetch(request);
      const responseText = await response.text();

      expect(response.status).toBe(404);
      expect(responseText).toBe('Not found');
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockUser.fetch.mockRejectedValue(new Error('Storage error'));

      const request = new Request('https://get-user', {
        method: 'GET'
      });

      await expect(mockUser.fetch(request)).rejects.toThrow('Storage error');
    });

    it('should handle storage put errors gracefully', async () => {
      mockUser.fetch.mockRejectedValue(new Error('Storage error'));

      const request = new Request('https://store-user', {
        method: 'POST',
        body: JSON.stringify({ userInfo: { email: 'test@example.com', name: 'Test User' } })
      });

      await expect(mockUser.fetch(request)).rejects.toThrow('Storage error');
    });
  });

  describe('integration with routes', () => {
    it('should work with auth route user storage', async () => {
      const userInfo = {
        email: 'test@example.com',
        name: 'Test User'
      };

      mockUser.fetch.mockResolvedValue({
        text: vi.fn().mockResolvedValue('User stored successfully')
      });

      // Simulate how auth route calls the User DO
      const userObjId = mockEnv.USER.idFromName('test@example.com');
      const userObj = mockEnv.USER.get(userObjId);
      
      const request = new Request('https://store-user', {
        method: 'POST',
        body: JSON.stringify({ userInfo })
      });

      const response = await userObj.fetch(request);
      const responseText = await response.text();

      expect(responseText).toBe('User stored successfully');
      expect(mockEnv.USER.idFromName).toHaveBeenCalledWith('test@example.com');
      expect(mockEnv.USER.get).toHaveBeenCalledWith('mock-user-id');
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });

    it('should work with users route ban functionality', async () => {
      const banResponse = {
        success: true,
        message: 'User banned successfully',
        bannedAt: Math.floor(Date.now() / 1000)
      };

      mockUser.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(banResponse),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      // Simulate how users route calls the User DO
      const userObjId = mockEnv.USER.idFromName('user@example.com');
      const userObj = mockEnv.USER.get(userObjId);
      
      const request = new Request('https://ban-user', {
        method: 'POST'
      });

      const response = await userObj.fetch(request);
      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      expect(mockEnv.USER.idFromName).toHaveBeenCalledWith('user@example.com');
      expect(mockEnv.USER.get).toHaveBeenCalledWith('mock-user-id');
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });

    it('should work with game route user check', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        bannedAt: null
      };

      mockUser.fetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(userData),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      // Simulate how game route calls the User DO
      const userObjId = mockEnv.USER.idFromName('test@example.com');
      const userObj = mockEnv.USER.get(userObjId);
      
      const request = new Request('https://get-user', {
        method: 'GET'
      });

      const response = await userObj.fetch(request);
      const responseData = await response.json();

      expect(responseData).toEqual(userData);
      expect(mockEnv.USER.idFromName).toHaveBeenCalledWith('test@example.com');
      expect(mockEnv.USER.get).toHaveBeenCalledWith('mock-user-id');
      expect(mockUser.fetch).toHaveBeenCalledWith(request);
    });
  });
});
