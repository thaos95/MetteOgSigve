/**
 * Zod validation schemas for RSVP domain.
 * These schemas are used for:
 * 1. Runtime validation of API inputs
 * 2. Type inference (z.infer<typeof schema>)
 * 3. Consistent error messages
 * 
 * SIMPLIFIED MODEL (2024):
 * - One person per RSVP (no party/group RSVPs)
 * - Email is optional
 * - No verification flow for RSVP creation
 * - Edit/cancel requires email-based token
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas
// ============================================================================

/**
 * Email schema with normalization.
 * Email is OPTIONAL - guests can RSVP without providing email,
 * but won't be able to edit/cancel without contacting hosts directly.
 */
export const emailSchema = z
  .string()
  .email('Ugyldig e-postadresse')
  .max(320, 'E-post må være 320 tegn eller mindre')
  .transform(s => s.trim().toLowerCase())
  .optional()
  .nullable()
  .or(z.literal(''))
  .transform(s => s === '' ? null : s);

// ============================================================================
// RSVP Input Schemas
// ============================================================================

/**
 * Schema for creating a new RSVP.
 * SIMPLIFIED: One person per RSVP, email optional.
 */
export const createRsvpSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Fornavn er påkrevd')
    .max(64, 'Fornavn må være 64 tegn eller mindre')
    .transform(s => s.trim()),
  lastName: z
    .string()
    .min(1, 'Etternavn er påkrevd')
    .max(64, 'Etternavn må være 64 tegn eller mindre')
    .transform(s => s.trim()),
  email: emailSchema,
  attending: z.boolean(),
  notes: z
    .string()
    .max(1000, 'Melding må være 1000 tegn eller mindre')
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
 * SIMPLIFIED: No party field.
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

/**
 * Token purpose - 'verify' removed as verification flow is no longer used.
 * Tokens are only used for edit/cancel operations.
 */
export const tokenPurposeSchema = z.enum(['edit', 'cancel']);

/**
 * Schema for requesting a token.
 * Requires email since tokens are sent via email.
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
  { message: 'Enten e-post eller navn er påkrevd' }
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
 * Schema for export filters.
 * SIMPLIFIED: Removed include_unverified and include_party_rows as no longer relevant.
 */
export const exportFiltersSchema = z.object({
  password: z.string().min(1),
  attending: z.enum(['all', 'yes', 'no']).default('all'),
  from: z.string().optional(),
  to: z.string().optional(),
  person_name: z.string().optional(),
});

// ============================================================================
// Type Inference
// ============================================================================

export type CreateRsvpInput = z.infer<typeof createRsvpSchema>;
export type UpdateRsvpInput = z.infer<typeof updateRsvpSchema>;
export type RequestTokenInput = z.infer<typeof requestTokenSchema>;
export type ExportFiltersInput = z.infer<typeof exportFiltersSchema>;
