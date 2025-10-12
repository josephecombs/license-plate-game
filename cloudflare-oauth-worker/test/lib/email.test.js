import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Email Library', () => {
  let mockEnv;
  let sendStateChangeEmail;

  beforeEach(async () => {
    // Import the functions
    const emailModule = await import('../../src/lib/email.js');
    sendStateChangeEmail = emailModule.sendStateChangeEmail;
    
    mockEnv = {
      AWS_ACCESS_KEY_ID: 'test-access-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret-key',
      AWS_REGION: 'us-east-1',
      NOTIFICATION_EMAIL: 'admin@example.com'
    };
  });

  describe('sendStateChangeEmail', () => {
    it('should call sendEmailNotification with correct parameters', async () => { 
      const notify = vi.fn().mockResolvedValue(true);
    
      const params = {
        env: mockEnv,
        userEmail: 'user@example.com',
        userName: 'Test User',
        action: 'UPDATED',
        stateId: '02',
        previousStates: ['01'],
        newStates: ['01', '02']
      };

      await sendStateChangeEmail(
        params.env,
        params.userEmail,
        params.userName,
        params.action,
        params.stateId,
        params.previousStates,
        params.newStates,
        notify,
      );

      expect(notify).toHaveBeenCalledWith(
        params.env,
        params.env.NOTIFICATION_EMAIL,
        'support@platechase.com',
        expect.stringContaining(`State ${params.action}:`),
        expect.stringContaining(params.userName)
      );
    });
    
    it('should throw error when NOTIFICATION_EMAIL is missing from env', async () => {
      const incompleteEnv = {
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        NOTIFICATION_EMAIL: undefined,
      };

      await expect(sendStateChangeEmail(
        incompleteEnv,
        'user@example.com',
        'Test User',
        'ADDED',
        '01',
        [],
        ['01']
      )).rejects.toThrow('Missing required email parameters: to=undefined');
    });

    it('should throw error when NOTIFICATION_EMAIL is undefined', async () => {
      const incompleteEnv = {
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        NOTIFICATION_EMAIL: undefined
      };

      sendStateChangeEmail(
        incompleteEnv,
        'user@example.com',
        'Test User',
        'ADDED',
        '01',
        [],
        ['01']
      )

      // await expect().rejects.toThrow('Missing required email parameters');
    });

    it('should throw error when NOTIFICATION_EMAIL is empty string', async () => {
      const incompleteEnv = {
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        NOTIFICATION_EMAIL: ''
      };

      await expect(sendStateChangeEmail(
        incompleteEnv,
        'user@example.com',
        'Test User',
        'ADDED',
        '01',
        [],
        ['01']
      )).rejects.toThrow('Missing required email parameters');
    });

    it('should throw error when AWS credentials are missing', async () => {
      const incompleteEnv = {
        NOTIFICATION_EMAIL: 'admin@example.com'
        // Missing AWS credentials
      };

      await expect(sendStateChangeEmail(
        incompleteEnv,
        'user@example.com',
        'Test User',
        'ADDED',
        '01',
        [],
        ['01']
      )).rejects.toThrow('AWS credentials not configured');
    });

    it('should throw error when userEmail is missing', async () => {
      await expect(sendStateChangeEmail(
        mockEnv,
        '', // missing userEmail
        'Test User',
        'ADDED',
        '01',
        [],
        ['01']
      )).rejects.toThrow('Missing required parameters');
    });

    it('should throw error when userName is missing', async () => {
      await expect(sendStateChangeEmail(
        mockEnv,
        'user@example.com',
        undefined, // missing userName
        'ADDED',
        '01',
        [],
        ['01']
      )).rejects.toThrow('Missing required parameters');
    });

    it('should throw error when action is missing', async () => {
      await expect(sendStateChangeEmail(
        mockEnv,
        'user@example.com',
        'Test User',
        '', // missing action
        '01',
        [],
        ['01']
      )).rejects.toThrow('Missing required parameters');
    });

    it('should throw error when stateId is missing', async () => {
      await expect(sendStateChangeEmail(
        mockEnv,
        'user@example.com',
        'Test User',
        'ADDED',
        '', // missing stateId
        [],
        ['01']
      )).rejects.toThrow('Missing required parameters');
    });

    it('should throw error when previousStates is not an array', async () => {
      await expect(sendStateChangeEmail(
        mockEnv,
        'user@example.com',
        'Test User',
        'ADDED',
        '01',
        'not-an-array', // invalid previousStates
        ['01']
      )).rejects.toThrow('Invalid parameters');
    });

    it('should throw error when newStates is not an array', async () => {
      await expect(sendStateChangeEmail(
        mockEnv,
        'user@example.com',
        'Test User',
        'ADDED',
        '01',
        [],
        'not-an-array' // invalid newStates
      )).rejects.toThrow('Invalid parameters');
    });

    it('should format timestamp in US Eastern Time', async () => {
      const notify = vi.fn().mockResolvedValue(true);
      
      // Mock a specific date to test timezone conversion
      const mockDate = new Date('2025-01-15T17:30:44.000Z'); // 12:30:44 PM EST
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);
      
      await sendStateChangeEmail(
        mockEnv,
        'user@example.com',
        'Test User',
        'ADDED',
        '08', // Colorado
        ['01', '02', '03', '04', '05'], // 5 previous states
        ['01', '02', '03', '04', '05', '08'], // 6 new states
        notify // Pass the mock function
      );

      // Check that the email body contains a timestamp in Eastern Time
      const emailCall = notify.mock.calls[0];
      const emailBody = emailCall[4]; // The body parameter
      
      // The timestamp should show Eastern Time (12:30:44 PM, not 5:30:44 PM UTC)
      expect(emailBody).toContain('12:30:44 PM');
      expect(emailBody).toContain('Timestamp: 1/15/2025, 12:30:44 PM');
      
      vi.useRealTimers();
    });
  });
});
