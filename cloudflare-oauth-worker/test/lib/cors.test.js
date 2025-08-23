import { describe, it, expect, beforeEach } from 'vitest';
import { setCORSHeaders } from '../../src/lib/cors.js';

describe('CORS Library', () => {
  let mockEnv;
  let mockResponse;

  beforeEach(() => {
    mockEnv = {
      NODE_ENV: 'development'
    };
    
    mockResponse = new Response('test response', {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });

  describe('happy path', () => {
    it('should set CORS headers for allowed origin in development', () => {
      const request = new Request('https://example.com/api/test', {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });

      const response = setCORSHeaders(mockResponse, mockEnv, request);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS, PUT');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });

    it('should set CORS headers for allowed origin in production', () => {
      mockEnv.NODE_ENV = 'production';
      const request = new Request('https://example.com/api/test', {
        method: 'GET',
        headers: {
          'Origin': 'https://www.platechase.com'
        }
      });

      const response = setCORSHeaders(mockResponse, mockEnv, request);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://www.platechase.com');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS, PUT');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });

    it('should preserve response body and status', async () => {
      const request = new Request('https://example.com/api/test', {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });

      const response = setCORSHeaders(mockResponse, mockEnv, request);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('test response');
    });
  });

  describe('edge cases', () => {
    it('should handle request without Origin header', () => {
      const request = new Request('https://example.com/api/test', {
        method: 'GET'
        // No Origin header
      });

      const response = setCORSHeaders(mockResponse, mockEnv, request);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeUndefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS, PUT');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });

    it('should handle request with disallowed origin in development', () => {
      const request = new Request('https://example.com/api/test', {
        method: 'GET',
        headers: {
          'Origin': 'https://malicious-site.com'
        }
      });

      const response = setCORSHeaders(mockResponse, mockEnv, request);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeUndefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS, PUT');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });

    it('should handle request with disallowed origin in production', () => {
      mockEnv.NODE_ENV = 'production';
      const request = new Request('https://example.com/api/test', {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });

      const response = setCORSHeaders(mockResponse, mockEnv, request);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeUndefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS, PUT');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });

    it('should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'OPTIONS'];
      
      methods.forEach(method => {
        const request = new Request('https://example.com/api/test', {
          method,
          headers: {
            'Origin': 'http://localhost:3000'
          }
        });

        const response = setCORSHeaders(mockResponse, mockEnv, request);
        expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS, PUT');
      });
    });

    it('should handle request with custom headers', () => {
      const request = new Request('https://example.com/api/test', {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:3000',
          'Custom-Header': 'custom-value',
          'Authorization': 'Bearer token123'
        }
      });

      const response = setCORSHeaders(mockResponse, mockEnv, request);
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });

    it('should handle special characters in URL', () => {
      const specialUrls = [
        'https://example.com/api/test?param=value&another=123',
        'https://example.com/api/test#fragment',
        'https://example.com/api/test/with/path/segments',
        'https://example.com/api/test/with/中文/characters'
      ];

      specialUrls.forEach(url => {
        const request = new Request(url, { 
          method: 'GET',
          headers: {
            'Origin': 'http://localhost:3000'
          }
        });
        const response = setCORSHeaders(mockResponse, mockEnv, request);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
        expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS, PUT');
      });
    });

    it('should handle response with existing headers', () => {
      const responseWithHeaders = new Response('test', {
        status: 201,
        headers: {
          'X-Custom-Header': 'custom-value',
          'Content-Type': 'text/plain'
        }
      });

      const request = new Request('https://example.com/api/test', {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });

      const response = setCORSHeaders(responseWithHeaders, mockEnv, request);
      expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
      expect(response.headers.get('Content-Type')).toBe('text/plain');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
    });
  });
});
