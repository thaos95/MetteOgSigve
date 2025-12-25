/**
 * Unit tests for mail module.
 * Tests email composition, error handling, and helper functions.
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { getBaseUrl } from '../mail';

// Mock nodemailer before importing sendMail
const mockSendMail = vi.fn();
const mockCreateTransport = vi.fn(() => ({
  sendMail: mockSendMail,
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: mockCreateTransport,
  },
  createTransport: mockCreateTransport,
}));

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  mockSendMail.mockReset();
  // Set required env vars
  process.env.FROM_EMAIL = 'test@example.com';
  process.env.SMTP_HOST = 'smtp.example.com';
  delete process.env.SENDGRID_API_KEY;
});

describe('mail module', () => {
  describe('getBaseUrl', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      vi.resetModules();
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;
      delete process.env.BASE_URL;
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('returns NEXT_PUBLIC_VERCEL_URL with https if set without protocol', () => {
      process.env.NEXT_PUBLIC_VERCEL_URL = 'my-app.vercel.app';
      expect(getBaseUrl()).toBe('https://my-app.vercel.app');
    });

    it('returns NEXT_PUBLIC_VERCEL_URL as-is if already has protocol', () => {
      process.env.NEXT_PUBLIC_VERCEL_URL = 'https://my-app.vercel.app';
      expect(getBaseUrl()).toBe('https://my-app.vercel.app');
    });

    it('falls back to VERCEL_URL', () => {
      process.env.VERCEL_URL = 'fallback.vercel.app';
      expect(getBaseUrl()).toBe('https://fallback.vercel.app');
    });

    it('falls back to BASE_URL', () => {
      process.env.BASE_URL = 'https://custom.example.com';
      expect(getBaseUrl()).toBe('https://custom.example.com');
    });

    it('returns localhost fallback when no env vars set', () => {
      expect(getBaseUrl()).toBe('http://localhost:3000');
    });
  });

  describe('sendMail', () => {
    it('sends email with both text and HTML', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      // Dynamic import to get fresh module with mocks
      const { sendMail } = await import('../mail');
      
      const result = await sendMail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Hello <strong>World</strong></p>',
      });

      expect(result.ok).toBe(true);
      expect(result.messageId).toBe('test-id');
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('recipient@example.com');
      expect(callArgs.subject).toBe('Test Subject');
      expect(callArgs.html).toContain('<p>Hello');
      expect(callArgs.text).toBeTruthy(); // Auto-generated from HTML
    });

    it('includes replyTo header', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });
      
      const { sendMail } = await import('../mail');
      
      await sendMail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Hello',
        replyTo: 'reply@example.com',
      });

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.replyTo).toBe('reply@example.com');
    });

    it('returns error when FROM_EMAIL not configured', async () => {
      delete process.env.FROM_EMAIL;
      
      // Need fresh import
      vi.resetModules();
      const { sendMail } = await import('../mail');
      
      const result = await sendMail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Hello',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('FROM_EMAIL');
    });

    it('retries on transient errors', async () => {
      const transientError = new Error('Connection timeout');
      mockSendMail
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce({ messageId: 'retry-success' });

      vi.resetModules();
      process.env.FROM_EMAIL = 'test@example.com';
      const { sendMail } = await import('../mail');
      
      const result = await sendMail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Hello',
      });

      expect(result.ok).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });

    it('does not retry on permanent errors', async () => {
      const permanentError = new Error('Invalid recipient');
      mockSendMail.mockRejectedValueOnce(permanentError);

      vi.resetModules();
      process.env.FROM_EMAIL = 'test@example.com';
      const { sendMail } = await import('../mail');
      
      const result = await sendMail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Hello',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid recipient');
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('email content generation', () => {
    it('generates text from HTML when text not provided', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });
      
      const { sendMail } = await import('../mail');
      
      await sendMail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Hello <strong>World</strong></p><br><p>Paragraph 2</p>',
      });

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.text).toBeTruthy();
      expect(callArgs.text).not.toContain('<');
      expect(callArgs.text).not.toContain('>');
    });

    it('wraps text in HTML when html not provided', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });
      
      const { sendMail } = await import('../mail');
      
      await sendMail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Plain text message',
      });

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('<pre>');
      expect(callArgs.html).toContain('Plain text message');
    });
  });
});
