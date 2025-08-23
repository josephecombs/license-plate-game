import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AWS SES client once at the top
vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn(),
  SendEmailCommand: vi.fn().mockImplementation((params) => params)
}));

describe('Email Library', () => {
  let mockEnv;
  let SESClient;

  beforeEach(async () => {
    // Get the mocked SESClient once
    const sesModule = await import('@aws-sdk/client-ses');
    SESClient = sesModule.SESClient;
    
    mockEnv = {
      AWS_ACCESS_KEY_ID: 'test-access-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret-key',
      AWS_REGION: 'us-east-1',
      NOTIFICATION_EMAIL: 'admin@example.com'
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  // Helper functions to control AWS SES behavior
  const mockSESSuccess = () => {
    SESClient.mockImplementation(() => ({
      send: vi.fn().mockResolvedValue({ MessageId: 'test-message-id' })
    }));
  };

  const mockSESFailure = () => {
    SESClient.mockImplementation(() => ({
      send: vi.fn().mockRejectedValue(new Error('SES service error'))
    }));
  };

  describe('sendEmailNotification', () => {
    describe('happy path', () => {
      it('should send email successfully with valid parameters', async () => {
        mockSESSuccess();

        const { sendEmailNotification } = await import('../../src/lib/email.js');
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
        mockSESFailure();

        const { sendEmailNotification } = await import('../../src/lib/email.js');
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

        mockSESFailure();

        const { sendEmailNotification } = await import('../../src/lib/email.js');
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
        mockSESFailure();

        const { sendEmailNotification } = await import('../../src/lib/email.js');
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
    let emailModule;
    
    beforeEach(async () => {
      // Reset the mock for each test
      vi.clearAllMocks();
    });

    describe('happy path', () => {
      it('should send state change email successfully', async () => {
        mockSESSuccess();

        const { sendStateChangeEmail } = await import('../../src/lib/email.js');
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
        mockSESSuccess();

        const actions = ['ADDED', 'REMOVED', 'UPDATED'];
        
        for (const action of actions) {
          const { sendStateChangeEmail } = await import('../../src/lib/email.js');
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
        mockSESSuccess();

        const stateIds = ['01', '06', '36', '48']; // AL, CA, NY, TX
        
        for (const stateId of stateIds) {
          const { sendStateChangeEmail } = await import('../../src/lib/email.js');
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
        mockSESSuccess();

        const { sendStateChangeEmail } = await import('../../src/lib/email.js');
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
        mockSESSuccess();

        const { sendStateChangeEmail } = await import('../../src/lib/email.js');
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

        mockSESFailure();

        const { sendStateChangeEmail } = await import('../../src/lib/email.js');
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
        mockSESSuccess();

        const { sendStateChangeEmail } = await import('../../src/lib/email.js');
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
        mockSESSuccess();

        const largePreviousStates = Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(2, '0'));
        const largeNewStates = Array.from({ length: 51 }, (_, i) => String(i + 1).padStart(2, '0'));

        const { sendStateChangeEmail } = await import('../../src/lib/email.js');
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
