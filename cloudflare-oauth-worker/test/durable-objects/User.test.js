import { describe, it, expect, vi, beforeEach } from 'vitest';
import { User } from '../../src/durable-objects/User.js';

describe('User Durable Object', () => {
  let user;
  let mockStorage;
  let mockEnv;

  beforeEach(() => {
    mockStorage = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };

    mockEnv = {
      USERS: 'mock-users-namespace'
    };

    user = new User(mockStorage, mockEnv);
    vi.clearAllMocks();
  });

  describe('get', () => {
    describe('happy path', () => {
      it('should retrieve user data successfully', async () => {
        const mockUserData = {
          id: 'user123',
          email: 'user@example.com',
          name: 'Test User',
          isAdmin: false,
          isBanned: false,
          createdAt: Date.now()
        };

        mockStorage.get.mockResolvedValue(mockUserData);

        const result = await user.get('user123');
        
        expect(result).toEqual(mockUserData);
        expect(mockStorage.get).toHaveBeenCalledWith('user123');
      });

      it('should return null for non-existent user', async () => {
        mockStorage.get.mockResolvedValue(null);

        const result = await user.get('non-existent');
        
        expect(result).toBeNull();
        expect(mockStorage.get).toHaveBeenCalledWith('non-existent');
      });
    });

    describe('edge cases', () => {
      it('should handle storage errors gracefully', async () => {
        mockStorage.get.mockRejectedValue(new Error('Storage error'));

        await expect(user.get('user123')).rejects.toThrow('Storage error');
        expect(mockStorage.get).toHaveBeenCalledWith('user123');
      });

      it('should handle empty user ID', async () => {
        const result = await user.get('');
        
        expect(result).toBeNull();
        expect(mockStorage.get).not.toHaveBeenCalled();
      });

      it('should handle null user ID', async () => {
        const result = await user.get(null);
        
        expect(result).toBeNull();
        expect(mockStorage.get).not.toHaveBeenCalled();
      });

      it('should handle undefined user ID', async () => {
        const result = await user.get(undefined);
        
        expect(result).toBeNull();
        expect(mockStorage.get).not.toHaveBeenCalled();
      });
    });
  });

  describe('put', () => {
    describe('happy path', () => {
      it('should create new user successfully', async () => {
        const userData = {
          email: 'newuser@example.com',
          name: 'New User'
        };

        const mockCreatedUser = {
          id: 'new-user-id',
          ...userData,
          isAdmin: false,
          isBanned: false,
          createdAt: expect.any(Number)
        };

        mockStorage.put.mockResolvedValue(mockCreatedUser);

        const result = await user.put(userData);
        
        expect(result.id).toBeDefined();
        expect(result.email).toBe('newuser@example.com');
        expect(result.name).toBe('New User');
        expect(result.isAdmin).toBe(false);
        expect(result.isBanned).toBe(false);
        expect(result.createdAt).toBeDefined();
        expect(mockStorage.put).toHaveBeenCalled();
      });

      it('should update existing user successfully', async () => {
        const existingUser = {
          id: 'user123',
          email: 'user@example.com',
          name: 'Old Name',
          isAdmin: false,
          isBanned: false,
          createdAt: Date.now() - 86400000
        };

        const updateData = {
          name: 'New Name',
          isAdmin: true
        };

        const mockUpdatedUser = {
          ...existingUser,
          ...updateData,
          updatedAt: expect.any(Number)
        };

        mockStorage.put.mockResolvedValue(mockUpdatedUser);

        const result = await user.put(updateData, 'user123');
        
        expect(result.name).toBe('New Name');
        expect(result.isAdmin).toBe(true);
        expect(result.updatedAt).toBeDefined();
        expect(mockStorage.put).toHaveBeenCalled();
      });

      it('should handle user ban updates', async () => {
        const userData = {
          isBanned: true,
          bannedAt: Date.now(),
          bannedBy: 'admin@example.com',
          banReason: 'Violation of terms'
        };

        const mockBannedUser = {
          id: 'user123',
          email: 'user@example.com',
          ...userData,
          updatedAt: expect.any(Number)
        };

        mockStorage.put.mockResolvedValue(mockBannedUser);

        const result = await user.put(userData, 'user123');
        
        expect(result.isBanned).toBe(true);
        expect(result.bannedAt).toBeDefined();
        expect(result.bannedBy).toBe('admin@example.com');
        expect(result.banReason).toBe('Violation of terms');
        expect(mockStorage.put).toHaveBeenCalled();
      });

      it('should handle user unban updates', async () => {
        const userData = {
          isBanned: false,
          unbannedAt: Date.now(),
          unbannedBy: 'admin@example.com',
          unbanReason: 'Appeal granted'
        };

        const mockUnbannedUser = {
          id: 'user123',
          email: 'user@example.com',
          ...userData,
          updatedAt: expect.any(Number)
        };

        mockStorage.put.mockResolvedValue(mockUnbannedUser);

        const result = await user.put(userData, 'user123');
        
        expect(result.isBanned).toBe(false);
        expect(result.unbannedAt).toBeDefined();
        expect(result.unbannedBy).toBe('admin@example.com');
        expect(result.unbanReason).toBe('Appeal granted');
        expect(mockStorage.put).toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle missing required fields', async () => {
        const incompleteData = {
          name: 'Test User'
          // Missing email
        };

        await expect(user.put(incompleteData)).rejects.toThrow('Email is required');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle invalid email format', async () => {
        const invalidData = {
          email: 'invalid-email',
          name: 'Test User'
        };

        await expect(user.put(invalidData)).rejects.toThrow('Invalid email format');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle empty email', async () => {
        const invalidData = {
          email: '',
          name: 'Test User'
        };

        await expect(user.put(invalidData)).rejects.toThrow('Email is required');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle empty name', async () => {
        const invalidData = {
          email: 'user@example.com',
          name: ''
        };

        await expect(user.put(invalidData)).rejects.toThrow('Name is required');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle very long email addresses', async () => {
        const longEmail = 'a'.repeat(1000) + '@example.com';
        const invalidData = {
          email: longEmail,
          name: 'Test User'
        };

        await expect(user.put(invalidData)).rejects.toThrow('Email too long');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle very long names', async () => {
        const longName = 'A'.repeat(1000);
        const invalidData = {
          email: 'user@example.com',
          name: longName
        };

        await expect(user.put(invalidData)).rejects.toThrow('Name too long');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle invalid admin flag values', async () => {
        const invalidData = {
          email: 'user@example.com',
          name: 'Test User',
          isAdmin: 'not-boolean'
        };

        await expect(user.put(invalidData)).rejects.toThrow('isAdmin must be boolean');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle invalid banned flag values', async () => {
        const invalidData = {
          email: 'user@example.com',
          name: 'Test User',
          isBanned: 'not-boolean'
        };

        await expect(user.put(invalidData)).rejects.toThrow('isBanned must be boolean');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle storage errors during creation', async () => {
        const userData = {
          email: 'user@example.com',
          name: 'Test User'
        };

        mockStorage.put.mockRejectedValue(new Error('Storage error'));

        await expect(user.put(userData)).rejects.toThrow('Storage error');
        expect(mockStorage.put).toHaveBeenCalled();
      });

      it('should handle null user data', async () => {
        await expect(user.put(null)).rejects.toThrow('User data required');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle undefined user data', async () => {
        await expect(user.put(undefined)).rejects.toThrow('User data required');
        expect(mockStorage.put).not.toHaveBeenCalled();
      });

      it('should handle special characters in email and name', async () => {
        const specialData = {
          email: 'user+tag@example.com',
          name: 'User O\'Connor-Smith'
        };

        const mockCreatedUser = {
          id: 'test',
          ...specialData,
          isAdmin: false,
          isBanned: false,
          createdAt: expect.any(Number)
        };

        mockStorage.put.mockResolvedValue(mockCreatedUser);

        const result = await user.put(specialData);
        
        expect(result.email).toBe('user+tag@example.com');
        expect(result.name).toBe('User O\'Connor-Smith');
        expect(mockStorage.put).toHaveBeenCalled();
      });
    });
  });

  describe('delete', () => {
    describe('happy path', () => {
      it('should delete user successfully', async () => {
        mockStorage.delete.mockResolvedValue(true);

        const result = await user.delete('user123');
        
        expect(result).toBe(true);
        expect(mockStorage.delete).toHaveBeenCalledWith('user123');
      });
    });

    describe('edge cases', () => {
      it('should handle deletion of non-existent user', async () => {
        mockStorage.delete.mockResolvedValue(false);

        const result = await user.delete('non-existent');
        
        expect(result).toBe(false);
        expect(mockStorage.delete).toHaveBeenCalledWith('non-existent');
      });

      it('should handle storage errors during deletion', async () => {
        mockStorage.delete.mockRejectedValue(new Error('Deletion error'));

        await expect(user.delete('user123')).rejects.toThrow('Deletion error');
        expect(mockStorage.delete).toHaveBeenCalledWith('user123');
      });

      it('should handle empty user ID', async () => {
        const result = await user.delete('');
        
        expect(result).toBe(false);
        expect(mockStorage.delete).not.toHaveBeenCalled();
      });

      it('should handle null user ID', async () => {
        const result = await user.delete(null);
        
        expect(result).toBe(false);
        expect(mockStorage.delete).not.toHaveBeenCalled();
      });

      it('should handle undefined user ID', async () => {
        const result = await user.delete(undefined);
        
        expect(result).toBe(false);
        expect(mockStorage.delete).not.toHaveBeenCalled();
      });
    });
  });

  describe('validation', () => {
    describe('email validation', () => {
      it('should accept valid email formats', async () => {
        const validEmails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.com',
          'user-name@example.com',
          'user_name@example.com',
          'user123@example.com',
          'user@subdomain.example.com',
          'user@example.co.uk'
        ];

        for (const email of validEmails) {
          const userData = {
            email,
            name: 'Test User'
          };

          mockStorage.put.mockResolvedValue({ id: 'test', ...userData });
          
          const result = await user.put(userData);
          expect(result.email).toBe(email);
        }
      });

      it('should reject invalid email formats', async () => {
        const invalidEmails = [
          '',
          'invalid-email',
          '@example.com',
          'user@',
          'user@.com',
          'user..name@example.com',
          'user@example',
          'user example.com'
        ];

        for (const email of invalidEmails) {
          const userData = {
            email,
            name: 'Test User'
          };

          await expect(user.put(userData)).rejects.toThrow();
        }
      });
    });

    describe('name validation', () => {
      it('should accept valid name formats', async () => {
        const validNames = [
          'John Doe',
          'Mary Jane',
          'O\'Connor',
          'Smith-Jones',
          'José María',
          '李小明',
          'A',
          'A'.repeat(100)
        ];

        for (const name of validNames) {
          const userData = {
            email: 'user@example.com',
            name
          };

          mockStorage.put.mockResolvedValue({ id: 'test', ...userData });
          
          const result = await user.put(userData);
          expect(result.name).toBe(name);
        }
      });

      it('should reject invalid name formats', async () => {
        const invalidNames = [
          '',
          'A'.repeat(1001) // Too long
        ];

        for (const name of invalidNames) {
          const userData = {
            email: 'user@example.com',
            name
          };

          await expect(user.put(userData)).rejects.toThrow();
        }
      });
    });
  });
});
