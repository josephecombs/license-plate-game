import { describe, it, expect } from 'vitest';
import { handleCORS } from '../../src/lib/cors.js';

describe('CORS Library', () => {
  describe('happy path', () => {
    it('should return CORS headers for GET request', () => {
      const request = new Request('https://example.com/api/test', {
        method: 'GET'
      });

      const response = handleCORS(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });

    it('should return CORS headers for POST request', () => {
      const request = new Request('https://example.com/api/test', {
        method: 'POST'
      });

      const response = handleCORS(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should return CORS headers for PUT request', () => {
      const request = new Request('https://example.com/api/test', {
        method: 'PUT'
      });

      const response = handleCORS(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should return CORS headers for DELETE request', () => {
      const request = new Request('https://example.com/api/test', {
        method: 'DELETE'
      });

      const response = handleCORS(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('edge cases', () => {
    it('should handle OPTIONS request (preflight)', () => {
      const request = new Request('https://example.com/api/test', {
        method: 'OPTIONS'
      });

      const response = handleCORS(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
    });

    it('should handle request with custom headers', () => {
      const request = new Request('https://example.com/api/test', {
        method: 'GET',
        headers: {
          'Custom-Header': 'custom-value',
          'Authorization': 'Bearer token123'
        }
      });

      const response = handleCORS(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });

    it('should handle request with different origins', () => {
      const origins = [
        'https://localhost:3000',
        'https://example.com',
        'https://subdomain.example.com',
        'http://localhost:3000'
      ];

      origins.forEach(origin => {
        const request = new Request('https://example.com/api/test', {
          method: 'GET',
          headers: {
            'Origin': origin
          }
        });

        const response = handleCORS(request);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      });
    });

    it('should handle request without method', () => {
      const request = new Request('https://example.com/api/test');

      const response = handleCORS(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should handle request with empty URL', () => {
      const request = new Request('', { method: 'GET' });

      const response = handleCORS(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should handle request with special characters in URL', () => {
      const specialUrls = [
        'https://example.com/api/test?param=value&another=123',
        'https://example.com/api/test#fragment',
        'https://example.com/api/test/with/path/segments',
        'https://example.com/api/test/with/中文/characters'
      ];

      specialUrls.forEach(url => {
        const request = new Request(url, { method: 'GET' });
        const response = handleCORS(request);
        expect(response.status).toBe(200);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      });
    });
  });
});
