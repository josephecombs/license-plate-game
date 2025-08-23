import { vi } from 'vitest';

// Global, default-success stub you can override per-test
const defaultSend = vi.fn().mockResolvedValue({ MessageId: 'test-message-id' });

vi.mock('@aws-sdk/client-ses', () => {
  const SESClient = vi.fn(() => ({
    send: defaultSend,
  }));
  const SendEmailCommand = vi.fn((params) => params);
  return { SESClient, SendEmailCommand, __mocks: { defaultSend } };
});

// Helpful env guards so the SDK never tries metadata/IMDS etc even if someone forgets to mock
process.env.AWS_EC2_METADATA_DISABLED = 'true';
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';

// Export helpers so tests can flip between success/failure
export const __setSesSuccess = () => {
  defaultSend.mockReset();
  defaultSend.mockResolvedValue({ MessageId: 'test-message-id' });
};

export const __setSesFailure = (err = new Error('SES service error')) => {
  defaultSend.mockReset();
  defaultSend.mockRejectedValue(err);
};
