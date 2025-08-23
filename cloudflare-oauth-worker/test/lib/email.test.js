import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { __setSesSuccess, __setSesFailure } from '../setup/ses.mock.js';

// Local console mute helper for this test suite
const mute = () => {
  const restores = [
    vi.spyOn(console, 'log').mockImplementation(() => {}),
    vi.spyOn(console, 'warn').mockImplementation(() => {}),
    vi.spyOn(console, 'error').mockImplementation(() => {}),
  ];
  return () => restores.forEach(s => s.mockRestore());
};

describe('Email Library', () => {
  let mockEnv;
  let sendEmailNotification;
  let sendStateChangeEmail;
  let unmute;

  beforeEach(async () => {
    // Mute console for this test
    unmute = mute();
    
    // Import the functions once
    const emailModule = await import('../../src/lib/email.js');
    sendEmailNotification = emailModule.sendEmailNotification;
    sendStateChangeEmail = emailModule.sendStateChangeEmail;
    
    mockEnv = {
      AWS_ACCESS_KEY_ID: 'test-access-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret-key',
      AWS_REGION: 'us-east-1',
      NOTIFICATION_EMAIL: 'admin@example.com'
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console after each test
    if (unmute) unmute();
  });

  describe('sendEmailNotification', () => {
    describe('happy path', () => {
      it('should send email successfully with valid parameters', async () => {
        __setSesSuccess();

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
        __setSesFailure(new Error('SES service error'));

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

        __setSesFailure();

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
        __setSesFailure();

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
    beforeEach(async () => {
      // Reset the mock for each test
      vi.clearAllMocks();
    });

    describe('happy path', () => {
      it('should send state change email successfully', async () => {
        __setSesSuccess();

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
        __setSesSuccess();

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
        __setSesSuccess();

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
        __setSesSuccess();

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
        __setSesSuccess();

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

        __setSesFailure();

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
        __setSesSuccess();

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
        __setSesSuccess();

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
