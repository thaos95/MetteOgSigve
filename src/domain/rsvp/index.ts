/**
 * RSVP Domain Module
 * 
 * This module contains the core business types, schemas, and pure functions
 * for the RSVP system. It has NO dependencies on infrastructure (Supabase,
 * Redis, etc.) or frameworks (Next.js).
 * 
 * Usage:
 *   import { Rsvp, createRsvpSchema } from '@/domain/rsvp';
 */

// Types (domain entities)
export type {
  PartyMember,
  Rsvp,
  CreateRsvpInput,
  UpdateRsvpInput,
  TokenPurpose,
  RsvpToken,
  RequestTokenInput,
  DuplicateMatch,
  AuditLogEntry,
} from './types';

// Validation schemas (Zod)
export {
  partyMemberSchema,
  emailSchema,
  createRsvpSchema,
  updateRsvpSchema,
  tokenPurposeSchema,
  requestTokenSchema,
  adminAuthSchema,
  editGuestSchema,
  exportFiltersSchema,
} from './schema';

// Schema-inferred types (for when you need the validated input shape)
export type {
  PartyMemberInput,
  EditGuestInput,
  ExportFiltersInput,
} from './schema';

// Pure validation/normalization functions
export {
  isValidEmail,
  normalizeName,
  tokenizeName,
  escapeLike,
  combineName,
  splitName,
  normalizeEmail,
  isNotesValid,
  isNameLengthValid,
} from './validation';

// Duplicate detection (pure functions)
export {
  personMatches,
  extractPeopleFromRsvp,
  checkForDuplicates,
  deduplicateCandidates,
  getDuplicateSearchQueries,
} from './duplicate';

export type {
  PersonToMatch,
  CandidateRsvp,
  DuplicateCheckResult,
} from './duplicate';

