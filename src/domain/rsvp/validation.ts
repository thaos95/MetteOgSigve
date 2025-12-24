/**
 * Pure validation and normalization functions for RSVP domain.
 * These functions have no side effects and no external dependencies.
 */

/**
 * Check if an email address is valid (basic regex check).
 */
export function isValidEmail(email?: string | null): boolean {
  if (!email) return true; // Empty is allowed (email is optional)
  const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return re.test(email);
}

/**
 * Normalize a name for fuzzy matching:
 * - Remove diacritics (é → e)
 * - Lowercase
 * - Remove non-alphanumeric chars (except spaces)
 * - Collapse multiple spaces
 * - Trim
 */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize a name into individual parts for matching.
 */
export function tokenizeName(name: string): string[] {
  return normalizeName(name).split(/\s+/).filter(Boolean);
}

/**
 * Escape special characters for SQL LIKE patterns.
 */
export function escapeLike(s: string): string {
  return s.replace(/([%_\\])/g, '\\$1');
}

/**
 * Generate a combined name from first and last name.
 */
export function combineName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

/**
 * Split a legacy "name" field into first and last name.
 * Returns { firstName, lastName } with best-effort splitting.
 */
export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

/**
 * Normalize an email for lookups and rate-limit keys.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Check if notes are within allowed length.
 */
export function isNotesValid(notes?: string | null): boolean {
  if (!notes) return true;
  return notes.length <= 1000;
}

/**
 * Check if a name is within allowed length.
 */
export function isNameLengthValid(name?: string | null): boolean {
  if (!name) return true;
  return name.length <= 64;
}
