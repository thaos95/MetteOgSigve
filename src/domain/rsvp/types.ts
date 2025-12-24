/**
 * Core domain types for RSVP system.
 * These types represent the business entities and are used across the application.
 * No dependencies on infrastructure or frameworks.
 */

/**
 * A member of a guest's party (additional guests on the same RSVP).
 */
export type PartyMember = {
  firstName: string;
  lastName: string;
  attending: boolean;
};

/**
 * An RSVP record from the database.
 * This is the canonical shape of an RSVP after being read from storage.
 */
export type Rsvp = {
  id: string;
  firstName: string;
  lastName: string;
  /** Combined name for display/search (legacy field, derived from first+last) */
  name: string;
  email: string | null;
  attending: boolean;
  party: PartyMember[];
  notes: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Input for creating a new RSVP.
 */
export type CreateRsvpInput = {
  firstName: string;
  lastName: string;
  email?: string | null;
  attending: boolean;
  party?: PartyMember[];
  notes?: string | null;
  recaptchaToken?: string;
  /** If true, override duplicate detection and create anyway */
  overrideDuplicate?: boolean;
};

/**
 * Input for updating an existing RSVP.
 */
export type UpdateRsvpInput = {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  attending?: boolean;
  party?: PartyMember[];
  notes?: string | null;
  /** Token for authorization (guest edit flow) */
  token?: string;
};

/**
 * Token purpose enum.
 */
export type TokenPurpose = 'verify' | 'edit' | 'cancel';

/**
 * A token record from the database.
 */
export type RsvpToken = {
  id: string;
  rsvpId: string;
  tokenHash: string;
  purpose: TokenPurpose;
  expiresAt: string;
  used: boolean;
  createdAt: string;
};

/**
 * Input for requesting a new token.
 */
export type RequestTokenInput = {
  email?: string;
  name?: string;
  purpose: TokenPurpose;
  /** If provided, send token to this email instead of RSVP email */
  sendToEmail?: string;
  /** If true, update the RSVP's email to sendToEmail */
  updateEmail?: boolean;
  recaptchaToken?: string;
};

/**
 * Result of duplicate detection.
 */
export type DuplicateMatch = {
  rsvpId: string;
  email: string | null;
  name: string;
  matchReason: 'email' | 'name_fuzzy' | 'party_member';
  confidence: 'high' | 'medium';
};

/**
 * Admin audit log entry.
 */
export type AuditLogEntry = {
  id: string;
  adminEmail: string;
  action: string;
  targetTable: string | null;
  targetId: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  deviceId: string | null;
  metadata: unknown;
  createdAt: string;
};
