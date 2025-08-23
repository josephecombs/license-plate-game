import { describe, it, expect, beforeEach } from 'vitest';

describe('Email Library', () => {
  let mockEnv;
  let sendEmailNotification;
  let sendStateChangeEmail;

  beforeEach(async () => {
    // Import the functions
    const emailModule = await import('../../src/lib/email.js');
    sendEmailNotification = emailModule.sendEmailNotification;
    sendStateChangeEmail = emailModule.sendStateChangeEmail;
    
    mockEnv = {
      AWS_ACCESS_KEY_ID: 'test-access-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret-key',
      AWS_REGION: 'us-east-1',
      NOTIFICATION_EMAIL: 'admin@example.com'
    };
  });

  describe('sendEmailNotification', () => {
    it('should throw error when AWS credentials are missing', async () => {
      const incompleteEnv = {
        AWS_REGION: 'us-east-1'
        // Missing AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
      };

      await expect(sendEmailNotification(
        incompleteEnv,
        'user@example.com',
        'noreply@example.com',
        'Test Subject',
        'Test body'
      )).rejects.toThrow('AWS credentials not configured');
    });

    it('should throw error when required parameters are missing', async () => {
      await expect(sendEmailNotification(
        mockEnv,
        '', // missing to
        'noreply@example.com',
        'Test Subject',
        'Test body'
      )).rejects.toThrow('Missing required email parameters');
    });

    it('should throw error when to parameter is missing', async () => {
      await expect(sendEmailNotification(
        mockEnv,
        undefined, // missing to
        'noreply@example.com',
        'Test Subject',
        'Test body'
      )).rejects.toThrow('Missing required email parameters');
    });

    it('should throw error when from parameter is missing', async () => {
      await expect(sendEmailNotification(
        mockEnv,
        'user@example.com',
        '', // missing from
        'Test Subject',
        'Test body'
      )).rejects.toThrow('Missing required email parameters');
    });

    it('should throw error when subject parameter is missing', async () => {
      await expect(sendEmailNotification(
        mockEnv,
        'user@example.com',
        'noreply@example.com',
        '', // missing subject
        'Test body'
      )).rejects.toThrow('Missing required email parameters');
    });

    it('should throw error when body parameter is missing', async () => {
      await expect(sendEmailNotification(
        mockEnv,
        'user@example.com',
        'noreply@example.com',
        'Test Subject',
        '' // missing body
      )).rejects.toThrow('Missing required email parameters');
    });
  });

  describe('sendStateChangeEmail', () => {
    it('should throw error when NOTIFICATION_EMAIL is missing from env', async () => {
      const incompleteEnv = {
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key'
        // Missing NOTIFICATION_EMAIL
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
  });
});
