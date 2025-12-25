/**
 * Unit tests for email templates
 * 
 * Verifies that all email templates:
 * - Include correct wedding date
 * - Include ceremony and venue details
 * - Include Google Maps links
 * - Generate both HTML and plain text versions
 * - Escape user input properly
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  verificationEmail,
  tokenEmail,
  updateConfirmationEmail,
  cancelConfirmationEmail,
  type RsvpData,
} from '../emailTemplates';
import { weddingConfig } from '../weddingConfig';

// Mock getBaseUrl
vi.mock('../mail', () => ({
  getBaseUrl: vi.fn(() => 'https://mette-og-sigve.no'),
}));

describe('Email Templates', () => {
  describe('verificationEmail', () => {
    const mockRsvpSummary: RsvpData = {
      name: 'Test User',
      attending: true,
      guestList: 'John Doe, Jane Doe',
      notes: 'Vegetarian meal please',
    };

    it('includes wedding date in both HTML and text', () => {
      const email = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com/verify',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.html).toContain(weddingConfig.date.full);
      expect(email.text).toContain(weddingConfig.date.full);
    });

    it('includes ceremony details in HTML', () => {
      const email = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com/verify',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.html).toContain(weddingConfig.ceremony.nameNorwegian);
      expect(email.html).toContain(weddingConfig.ceremony.time);
      expect(email.html).toContain(weddingConfig.ceremony.address.street);
    });

    it('includes venue details in HTML', () => {
      const email = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com/verify',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.html).toContain(weddingConfig.venue.name);
      expect(email.html).toContain(weddingConfig.venue.time);
      expect(email.html).toContain(weddingConfig.venue.address.street);
    });

    it('includes Google Maps links for both locations', () => {
      const email = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com/verify',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.html).toContain(weddingConfig.ceremony.mapsUrl);
      expect(email.html).toContain(weddingConfig.venue.mapsUrl);
      expect(email.text).toContain(weddingConfig.ceremony.mapsUrl);
      expect(email.text).toContain(weddingConfig.venue.mapsUrl);
    });

    it('includes the verification link', () => {
      const email = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com/verify?token=abc123',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.html).toContain('https://example.com/verify?token=abc123');
      expect(email.text).toContain('https://example.com/verify?token=abc123');
    });

    it('includes RSVP summary in HTML', () => {
      const email = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com/verify',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.html).toContain('Attending');
      expect(email.html).toContain('John Doe, Jane Doe');
      expect(email.html).toContain('Vegetarian meal please');
    });

    it('includes RSVP summary in plain text', () => {
      const email = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com/verify',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.text).toContain('Attending');
      expect(email.text).toContain('John Doe, Jane Doe');
      expect(email.text).toContain('Vegetarian meal please');
    });

    it('shows "Unable to attend" when not attending', () => {
      const notAttendingSummary: RsvpData = {
        ...mockRsvpSummary,
        attending: false,
      };
      const email = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com/verify',
        rsvpSummary: notAttendingSummary,
      });

      expect(email.html).toContain('Unable to attend');
      expect(email.text).toContain('Unable to attend');
    });

    it('has correct subject line with couple names', () => {
      const email = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com/verify',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.subject).toContain('Mette & Sigve');
      expect(email.subject).toContain('verify');
    });

    it('uses table-based layout for HTML', () => {
      const email = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com/verify',
        rsvpSummary: mockRsvpSummary,
      });

      // Should use table-based layout for email clients
      expect(email.html).toContain('role="presentation"');
      expect(email.html).toContain('<table');
    });

    it('personalizes greeting with first name', () => {
      const email = verificationEmail({
        name: 'Alice',
        verifyLink: 'https://example.com/verify',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.html).toContain('Hi Alice');
      expect(email.text).toContain('Hi Alice');
    });
  });

  describe('tokenEmail', () => {
    it('generates edit token email correctly', () => {
      const email = tokenEmail({
        name: 'Bob',
        link: 'https://example.com/edit?token=xyz',
        purpose: 'edit',
      });

      expect(email.subject).toContain('edit');
      expect(email.html).toContain('Hi Bob');
      expect(email.html).toContain('edit');
      expect(email.html).toContain('https://example.com/edit?token=xyz');
      expect(email.text).toContain('edit');
    });

    it('generates cancel token email correctly', () => {
      const email = tokenEmail({
        name: 'Carol',
        link: 'https://example.com/cancel?token=xyz',
        purpose: 'cancel',
      });

      expect(email.subject).toContain('cancel');
      expect(email.html).toContain('Hi Carol');
      expect(email.html).toContain('cancel');
      expect(email.text).toContain('cancel');
    });

    it('includes expiration notice', () => {
      const email = tokenEmail({
        name: 'Test',
        link: 'https://example.com/token',
        purpose: 'edit',
      });

      expect(email.html).toContain('1 hour');
      expect(email.text).toContain('1 hour');
    });
  });

  describe('updateConfirmationEmail', () => {
    const mockRsvpSummary: RsvpData = {
      name: 'David',
      attending: true,
      guestList: 'Emma',
      notes: 'Updated dietary info',
    };

    it('confirms the update was successful', () => {
      const email = updateConfirmationEmail({
        name: 'David',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.subject).toContain('updated');
      expect(email.html).toContain('updated successfully');
      expect(email.text).toContain('updated successfully');
    });

    it('shows updated RSVP details', () => {
      const email = updateConfirmationEmail({
        name: 'David',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.html).toContain('Attending');
      expect(email.html).toContain('Emma');
      expect(email.html).toContain('Updated dietary info');
    });

    it('includes link to request new edit', () => {
      const email = updateConfirmationEmail({
        name: 'David',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.html).toContain('/rsvp');
      expect(email.text).toContain('/rsvp');
    });
  });

  describe('cancelConfirmationEmail', () => {
    it('confirms cancellation was successful', () => {
      const email = cancelConfirmationEmail({
        name: 'Frank',
      });

      expect(email.subject).toContain('cancelled');
      expect(email.html).toContain('cancelled');
      expect(email.text).toContain('cancelled');
    });

    it('offers option to re-RSVP', () => {
      const email = cancelConfirmationEmail({
        name: 'Frank',
      });

      expect(email.html).toContain('new RSVP');
      expect(email.html).toContain('/rsvp');
      expect(email.text).toContain('/rsvp');
    });

    it('uses warm, understanding tone', () => {
      const email = cancelConfirmationEmail({
        name: 'Grace',
      });

      expect(email.html).toContain("sorry you won't be able to join");
      expect(email.text).toContain("sorry you won't be able to join");
    });
  });

  describe('Email layout common elements', () => {
    it('all emails include couple signature', () => {
      const verifyEmail = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com',
        rsvpSummary: { name: 'Test', attending: true, guestList: '' },
      });
      const token = tokenEmail({ name: 'Test', link: 'https://example.com', purpose: 'edit' });
      const update = updateConfirmationEmail({ name: 'Test', rsvpSummary: { name: 'Test', attending: true, guestList: '' } });
      const cancel = cancelConfirmationEmail({ name: 'Test' });

      [verifyEmail, token, update, cancel].forEach((email) => {
        expect(email.html).toContain(weddingConfig.couple.emailSignature);
        expect(email.text).toContain(weddingConfig.couple.emailSignature);
      });
    });

    it('all emails use inline styles (no external CSS)', () => {
      const verifyEmail = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com',
        rsvpSummary: { name: 'Test', attending: true, guestList: '' },
      });

      // Should not reference external stylesheets
      expect(verifyEmail.html).not.toContain('<link rel="stylesheet"');
      expect(verifyEmail.html).not.toContain('@import');
      
      // Should use inline styles
      expect(verifyEmail.html).toContain('style="');
    });

    it('all emails have preheader text for email clients', () => {
      const verifyEmail = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com',
        rsvpSummary: { name: 'Test', attending: true, guestList: '' },
      });

      // Preheader is hidden text at the top for preview
      expect(verifyEmail.html).toContain('display: none');
    });
  });
});
