/**
 * Zod validation schemas for RSVP domain.
 * These schemas are used for:
 * 1. Runtime validation of API inputs
 * 2. Type inference (z.infer<typeof schema>)
 * 3. Consistent error messages
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas
// ============================================================================

/**
 * Party member schema (guest in someone's party).
 */
export const partyMemberSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(64, 'First name must be 64 characters or less')
    .transform(s => s.trim()),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(64, 'Last name must be 64 characters or less')
    .transform(s => s.trim()),
  attending: z.boolean(),
});

/**
 * Email schema with normalization.
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(320, 'Email must be 320 characters or less')
  .transform(s => s.trim().toLowerCase())
  .optional()
  .nullable();

// ============================================================================
// RSVP Input Schemas
// ============================================================================

/**
 * Schema for creating a new RSVP.
 */
export const createRsvpSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(64, 'First name must be 64 characters or less')
    .transform(s => s.trim()),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(64, 'Last name must be 64 characters or less')
    .transform(s => s.trim()),
  email: emailSchema,
  attending: z.boolean(),
  party: z
    .array(partyMemberSchema)
    .max(10, 'Maximum 10 party members allowed')
    .default([]),
  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less')
    .transform(s => s.trim())
    .optional()
    .nullable(),
  recaptchaToken: z.string().optional(),
  overrideDuplicate: z.boolean().optional(),
  // Legacy field support
  name: z.string().optional(),
});

/**
 * Schema for updating an existing RSVP.
 */
export const updateRsvpSchema = z.object({
  firstName: z
    .string()
    .min(1)
    .max(64)
    .transform(s => s.trim())
    .optional(),
  lastName: z
    .string()
    .min(1)
    .max(64)
    .transform(s => s.trim())
    .optional(),
  email: emailSchema,
  attending: z.boolean().optional(),
  party: z
    .array(partyMemberSchema)
    .max(10)
    .optional(),
  notes: z
    .string()
    .max(1000)
    .transform(s => s.trim())
    .optional()
    .nullable(),
  token: z.string().optional(),
  recaptchaToken: z.string().optional(),
  id: z.string().optional(), // for route matching
});

// ============================================================================
// Token Schemas
// ============================================================================

export const tokenPurposeSchema = z.enum(['verify', 'edit', 'cancel']);

/**
 * Schema for requesting a token.
 */
export const requestTokenSchema = z.object({
  email: z.string().email().transform(s => s.trim().toLowerCase()).optional(),
  name: z.string().optional(),
  purpose: tokenPurposeSchema.default('edit'),
  sendToEmail: z.string().email().transform(s => s.trim().toLowerCase()).optional(),
  updateEmail: z.boolean().optional(),
  recaptchaToken: z.string().optional(),
  deviceId: z.string().optional(),
}).refine(
  data => data.email || data.name,
  { message: 'Either email or name is required' }
);

// ============================================================================
// Admin Schemas
// ============================================================================

/**
 * Schema for admin authentication (used by all admin routes).
 */
export const adminAuthSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

/**
 * Schema for editing a guest in a party.
 */
export const editGuestSchema = z.object({
  password: z.string().min(1),
  rsvpId: z.union([z.string(), z.number()]).transform(v => String(v)),
  action: z.enum(['add', 'update', 'remove', 'move']),
  index: z.number().int().min(0).optional(),
  firstName: z.string().min(1).max(64).transform(s => s.trim()).optional(),
  lastName: z.string().min(1).max(64).transform(s => s.trim()).optional(),
  attending: z.boolean().optional(),
  dir: z.enum(['up', 'down']).optional(),
});

/**
 * Schema for export filters.
 */
export const exportFiltersSchema = z.object({
  password: z.string().min(1),
  attending: z.enum(['all', 'yes', 'no']).default('all'),
  from: z.string().optional(),
  to: z.string().optional(),
  include_unverified: z.boolean().default(false),
  include_party_rows: z.boolean().default(false),
  person_name: z.string().optional(),
  person_attending: z.enum(['', 'yes', 'no']).optional(),
});

// ============================================================================
// Type Inference
// ============================================================================

export type PartyMemberInput = z.infer<typeof partyMemberSchema>;
export type CreateRsvpInput = z.infer<typeof createRsvpSchema>;
export type UpdateRsvpInput = z.infer<typeof updateRsvpSchema>;
export type RequestTokenInput = z.infer<typeof requestTokenSchema>;
export type EditGuestInput = z.infer<typeof editGuestSchema>;
export type ExportFiltersInput = z.infer<typeof exportFiltersSchema>;
