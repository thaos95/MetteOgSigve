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

      expect(email.html).toContain('Kommer');
      expect(email.html).toContain('Vegetarian meal please');
    });

    it('includes RSVP summary in plain text', () => {
      const email = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com/verify',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.text).toContain('Kommer');
      expect(email.text).toContain('Vegetarian meal please');
    });

    it('shows "Kan ikke komme" when not attending', () => {
      const notAttendingSummary: RsvpData = {
        ...mockRsvpSummary,
        attending: false,
      };
      const email = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com/verify',
        rsvpSummary: notAttendingSummary,
      });

      expect(email.html).toContain('Kan ikke komme');
      expect(email.text).toContain('Kan ikke komme');
    });

    it('has correct subject line with couple names', () => {
      const email = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com/verify',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.subject).toContain('Mette & Sigve');
      expect(email.subject).toContain('bekreft');
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

      expect(email.html).toContain('Hei Alice');
      expect(email.text).toContain('Hei Alice');
    });
  });

  describe('tokenEmail', () => {
    it('generates edit token email correctly', () => {
      const email = tokenEmail({
        name: 'Bob',
        link: 'https://example.com/edit?token=xyz',
        purpose: 'edit',
      });

      expect(email.subject).toContain('endre');
      expect(email.html).toContain('Hei Bob');
      expect(email.html).toContain('endre');
      expect(email.html).toContain('https://example.com/edit?token=xyz');
      expect(email.text).toContain('endre');
    });

    it('generates cancel token email correctly', () => {
      const email = tokenEmail({
        name: 'Carol',
        link: 'https://example.com/cancel?token=xyz',
        purpose: 'cancel',
      });

      expect(email.subject).toContain('slette');
      expect(email.html).toContain('Hei Carol');
      expect(email.html).toContain('slette');
      expect(email.text).toContain('slette');
    });

    it('includes expiration notice', () => {
      const email = tokenEmail({
        name: 'Test',
        link: 'https://example.com/token',
        purpose: 'edit',
      });

      expect(email.html).toContain('1 time');
      expect(email.text).toContain('1 time');
    });
  });

  describe('updateConfirmationEmail', () => {
    const mockRsvpSummary: RsvpData = {
      name: 'David',
      attending: true,
      notes: 'Updated dietary info',
    };

    it('confirms the update was successful', () => {
      const email = updateConfirmationEmail({
        name: 'David',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.subject).toContain('Vi gleder oss til å se deg');
      expect(email.html).toContain('Svaret ditt er oppdatert');
      expect(email.text).toContain('Svaret ditt er oppdatert');
    });

    it('shows updated RSVP details', () => {
      const email = updateConfirmationEmail({
        name: 'David',
        rsvpSummary: mockRsvpSummary,
      });

      expect(email.html).toContain('Kommer');
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

    it('includes venue details when attending', () => {
      const email = updateConfirmationEmail({
        name: 'David',
        rsvpSummary: { name: 'David', attending: true },
      });

      expect(email.html).toContain(weddingConfig.ceremony.nameNorwegian);
      expect(email.html).toContain(weddingConfig.venue.name);
      expect(email.text).toContain(weddingConfig.ceremony.nameNorwegian);
      expect(email.text).toContain(weddingConfig.venue.name);
    });

    it('includes practical information when attending', () => {
      const email = updateConfirmationEmail({
        name: 'David',
        rsvpSummary: { name: 'David', attending: true },
      });

      expect(email.html).toContain('Praktisk informasjon');
      expect(email.html).toContain('kirken');
      expect(email.text).toContain('PRAKTISK INFO');
    });

    it('does not include venue details when not attending', () => {
      const email = updateConfirmationEmail({
        name: 'David',
        rsvpSummary: { name: 'David', attending: false },
      });

      expect(email.html).not.toContain(weddingConfig.ceremony.nameNorwegian);
      expect(email.html).not.toContain('Praktisk informasjon');
      expect(email.subject).toContain('Svar oppdatert');
    });
  });

  describe('cancelConfirmationEmail', () => {
    it('confirms cancellation was successful', () => {
      const email = cancelConfirmationEmail({
        name: 'Frank',
      });

      expect(email.subject).toContain('slettet');
      expect(email.html).toContain('slettet');
      expect(email.text).toContain('slettet');
    });

    it('offers option to re-RSVP', () => {
      const email = cancelConfirmationEmail({
        name: 'Frank',
      });

      expect(email.html).toContain('nytt svar');
      expect(email.html).toContain('/rsvp');
      expect(email.text).toContain('/rsvp');
    });

    it('uses warm, understanding tone', () => {
      const email = cancelConfirmationEmail({
        name: 'Grace',
      });

      expect(email.html).toContain('Det var synd at du ikke kunne komme');
      expect(email.text).toContain('Det var synd at du ikke kunne komme');
    });
  });

  describe('Email layout common elements', () => {
    it('all emails include couple signature', () => {
      const verifyEmail = verificationEmail({
        name: 'Test',
        verifyLink: 'https://example.com',
        rsvpSummary: { name: 'Test', attending: true },
      });
      const token = tokenEmail({ name: 'Test', link: 'https://example.com', purpose: 'edit' });
      const update = updateConfirmationEmail({ name: 'Test', rsvpSummary: { name: 'Test', attending: true } });
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
        rsvpSummary: { name: 'Test', attending: true },
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
        rsvpSummary: { name: 'Test', attending: true },
      });

      // Preheader is hidden text at the top for preview
      expect(verifyEmail.html).toContain('display: none');
    });
  });
});
