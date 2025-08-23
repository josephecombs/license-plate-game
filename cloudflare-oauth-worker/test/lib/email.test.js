import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail } from '../../src/lib/email.js';

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
      FROM_EMAIL: 'noreply@example.com'
    };

    mockSESClient = {
      send: vi.fn()
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should send email successfully with valid parameters', async () => {
      const mockSendResponse = {
        MessageId: 'test-message-id-123'
      };

      mockSESClient.send.mockResolvedValue(mockSendResponse);

      const result = await sendEmail(
        mockEnv,
        'user@example.com',
        'Test Subject',
        'Test email body'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id-123');
    });

    it('should send email with HTML content', async () => {
      const mockSendResponse = {
        MessageId: 'html-message-id-456'
      };

      mockSESClient.send.mockResolvedValue(mockSendResponse);

      const result = await sendEmail(
        mockEnv,
        'user@example.com',
        'HTML Subject',
        '<h1>HTML Email</h1><p>This is HTML content</p>',
        true
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('html-message-id-456');
    });

    it('should send email with custom from address', async () => {
      const mockSendResponse = {
        MessageId: 'custom-from-message-id-789'
      };

      mockSESClient.send.mockResolvedValue(mockSendResponse);

      const result = await sendEmail(
        mockEnv,
        'user@example.com',
        'Custom From Subject',
        'Email with custom from',
        false,
        'custom@example.com'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('custom-from-message-id-789');
    });
  });

  describe('edge cases', () => {
    it('should handle missing AWS credentials gracefully', async () => {
      const incompleteEnv = {
        AWS_REGION: 'us-east-1',
        FROM_EMAIL: 'noreply@example.com'
        // Missing AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
      };

      const result = await sendEmail(
        incompleteEnv,
        'user@example.com',
        'Test Subject',
        'Test body'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('AWS credentials');
    });

    it('should handle missing FROM_EMAIL gracefully', async () => {
      const incompleteEnv = {
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        AWS_REGION: 'us-east-1'
        // Missing FROM_EMAIL
      };

      const result = await sendEmail(
        incompleteEnv,
        'user@example.com',
        'Test Subject',
        'Test body'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('FROM_EMAIL');
    });

    it('should handle invalid email addresses', async () => {
      const invalidEmails = [
        '',
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com'
      ];

      for (const invalidEmail of invalidEmails) {
        const result = await sendEmail(
          mockEnv,
          invalidEmail,
          'Test Subject',
          'Test body'
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid email');
      }
    });

    it('should handle empty subject', async () => {
      const result = await sendEmail(
        mockEnv,
        'user@example.com',
        '',
        'Test body'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Subject');
    });

    it('should handle empty body', async () => {
      const result = await sendEmail(
        mockEnv,
        'user@example.com',
        'Test Subject',
        ''
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Body');
    });

    it('should handle SES client errors', async () => {
      const mockError = new Error('SES service error');
      mockSESClient.send.mockRejectedValue(mockError);

      const result = await sendEmail(
        mockEnv,
        'user@example.com',
        'Test Subject',
        'Test body'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('SES service error');
    });

    it('should handle network timeouts', async () => {
      const mockTimeoutError = new Error('Request timeout');
      mockTimeoutError.name = 'TimeoutError';
      mockSESClient.send.mockRejectedValue(mockTimeoutError);

      const result = await sendEmail(
        mockEnv,
        'user@example.com',
        'Test Subject',
        'Test body'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Request timeout');
    });

    it('should handle very long subject lines', async () => {
      const longSubject = 'A'.repeat(1000);
      
      const result = await sendEmail(
        mockEnv,
        'user@example.com',
        longSubject,
        'Test body'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Subject too long');
    });

    it('should handle very long email bodies', async () => {
      const longBody = 'A'.repeat(100000); // Very long body
      
      const result = await sendEmail(
        mockEnv,
        'user@example.com',
        'Test Subject',
        longBody
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Body too long');
    });

    it('should handle special characters in subject and body', async () => {
      const specialSubject = 'Subject with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const specialBody = 'Body with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?\nNew line\n\tTab';

      const mockSendResponse = {
        MessageId: 'special-chars-message-id'
      };

      mockSESClient.send.mockResolvedValue(mockSendResponse);

      const result = await sendEmail(
        mockEnv,
        'user@example.com',
        specialSubject,
        specialBody
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('special-chars-message-id');
    });

    it('should handle multiple recipients', async () => {
      const mockSendResponse = {
        MessageId: 'multiple-recipients-message-id'
      };

      mockSESClient.send.mockResolvedValue(mockSendResponse);

      const result = await sendEmail(
        mockEnv,
        'user1@example.com,user2@example.com,user3@example.com',
        'Multiple Recipients',
        'Email to multiple users'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('multiple-recipients-message-id');
    });
  });
});
