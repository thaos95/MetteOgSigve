/**
 * RSVP Domain Module
 * 
 * This module contains the core business types, schemas, and pure functions
 * for the RSVP system. It has NO dependencies on infrastructure (Supabase,
 * Redis, etc.) or frameworks (Next.js).
 * 
 * SIMPLIFIED MODEL (2024):
 * - One person per RSVP (no party members)
 * - Email is optional
 * - No verification flow
 * 
 * Usage:
 *   import { Rsvp, createRsvpSchema } from '@/domain/rsvp';
 */

// Types (domain entities)
export type {
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
  emailSchema,
  createRsvpSchema,
  updateRsvpSchema,
  tokenPurposeSchema,
  requestTokenSchema,
  adminAuthSchema,
  exportFiltersSchema,
} from './schema';

// Schema-inferred types (for when you need the validated input shape)
export type {
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

