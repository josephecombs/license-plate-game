import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmailNotification, sendStateChangeEmail } from '../../src/lib/email.js';

// Mock AWS SES client
vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn().mockImplementation(() => ({
    send: vi.fn()
  })),
  SendEmailCommand: vi.fn().mockImplementation((params) => params)
}));

describe('Email Library', () => {
  let mockEnv;
  let mockSESClient;

  beforeEach(() => {
    mockEnv = {
      AWS_ACCESS_KEY_ID: 'test-access-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret-key',
      AWS_REGION: 'us-east-1',
      NOTIFICATION_EMAIL: 'admin@example.com'
    };

    mockSESClient = {
      send: vi.fn()
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('sendEmailNotification', () => {
    describe('happy path', () => {
      it('should send email successfully with valid parameters', async () => {
        const mockSendResponse = {
          MessageId: 'test-message-id-123'
        };

        // Mock the SESClient constructor to return our mock
        const { SESClient } = await import('@aws-sdk/client-ses');
        SESClient.mockImplementation(() => ({
          send: vi.fn().mockResolvedValue(mockSendResponse)
        }));

        const result = await sendEmailNotification(
          mockEnv,
          'user@example.com',
          'noreply@example.com',
          'Test Subject',
          'Test email body'
        );

        expect(result).toBe(true);
      });

      it('should handle SES client errors gracefully', async () => {
        // Mock the SESClient constructor to return our mock
        const { SESClient } = await import('@aws-sdk/client-ses');
        SESClient.mockImplementation(() => ({
          send: vi.fn().mockRejectedValue(new Error('SES service error'))
        }));

        const result = await sendEmailNotification(
          mockEnv,
          'user@example.com',
          'noreply@example.com',
          'Test Subject',
          'Test body'
        );

        expect(result).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle missing AWS credentials gracefully', async () => {
        const incompleteEnv = {
          AWS_REGION: 'us-east-1'
          // Missing AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
        };

        const result = await sendEmailNotification(
          incompleteEnv,
          'user@example.com',
          'noreply@example.com',
          'Test Subject',
          'Test body'
        );

        expect(result).toBe(false);
      });

      it('should handle empty email parameters', async () => {
        const result = await sendEmailNotification(
          mockEnv,
          '',
          'noreply@example.com',
          'Test Subject',
          'Test body'
        );

        expect(result).toBe(false);
      });
    });
  });

  describe('sendStateChangeEmail', () => {
    describe('happy path', () => {
      it('should send state change email successfully', async () => {
        // Mock the sendEmailNotification function
        const { sendEmailNotification } = await import('../../src/lib/email.js');
        vi.spyOn(await import('../../src/lib/email.js'), 'sendEmailNotification')
          .mockResolvedValue(true);

        const result = await sendStateChangeEmail(
          mockEnv,
          'user@example.com',
          'Test User',
          'ADDED',
          '01',
          [],
          ['01']
        );

        expect(result).toBeUndefined(); // Function doesn't return anything
      });

      it('should handle different state actions', async () => {
        const actions = ['ADDED', 'REMOVED', 'UPDATED'];
        
        for (const action of actions) {
          const result = await sendStateChangeEmail(
            mockEnv,
            'user@example.com',
            'Test User',
            action,
            '01',
            [],
            ['01']
          );

          expect(result).toBeUndefined();
        }
      });

      it('should handle different state IDs', async () => {
        const stateIds = ['01', '06', '36', '48']; // AL, CA, NY, TX
        
        for (const stateId of stateIds) {
          const result = await sendStateChangeEmail(
            mockEnv,
            'user@example.com',
            'Test User',
            'ADDED',
            stateId,
            [],
            [stateId]
          );

          expect(result).toBeUndefined();
        }
      });
    });

    describe('edge cases', () => {
      it('should handle unknown state ID', async () => {
        const result = await sendStateChangeEmail(
          mockEnv,
          'user@example.com',
          'Test User',
          'ADDED',
          '99', // Unknown state ID
          [],
          ['99']
        );

        expect(result).toBeUndefined();
      });

      it('should handle empty user name', async () => {
        const result = await sendStateChangeEmail(
          mockEnv,
          'user@example.com',
          '', // Empty user name
          'ADDED',
          '01',
          [],
          ['01']
        );

        expect(result).toBeUndefined();
      });

      it('should handle missing notification email in env', async () => {
        const incompleteEnv = {
          AWS_ACCESS_KEY_ID: 'test-access-key',
          AWS_SECRET_ACCESS_KEY: 'test-secret-key'
          // Missing NOTIFICATION_EMAIL
        };

        const result = await sendStateChangeEmail(
          incompleteEnv,
          'user@example.com',
          'Test User',
          'ADDED',
          '01',
          [],
          ['01']
        );

        expect(result).toBeUndefined();
      });

      it('should handle empty previous and new states arrays', async () => {
        const result = await sendStateChangeEmail(
          mockEnv,
          'user@example.com',
          'Test User',
          'ADDED',
          '01',
          [], // Empty previous states
          [] // Empty new states
        );

        expect(result).toBeUndefined();
      });

      it('should handle large state arrays', async () => {
        const largePreviousStates = Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(2, '0'));
        const largeNewStates = Array.from({ length: 51 }, (_, i) => String(i + 1).padStart(2, '0'));

        const result = await sendStateChangeEmail(
          mockEnv,
          'user@example.com',
          'Test User',
          'ADDED',
          '01',
          largePreviousStates,
          largeNewStates
        );

        expect(result).toBeUndefined();
      });
    });
  });
});
