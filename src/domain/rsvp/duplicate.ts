/**
 * Fuzzy duplicate detection logic for RSVP submissions.
 * Pure functions - no I/O, testable in isolation.
 */

import type { PartyMember } from './types';
import { normalizeName, tokenizeName } from './validation';

/**
 * A person to match (either primary or party member).
 */
export type PersonToMatch = {
  firstName: string;
  lastName: string;
};

/**
 * An existing RSVP record from the database (loosely typed for flexibility).
 */
export type CandidateRsvp = {
  id: string;
  email?: string | null;
  name?: string;
  first_name?: string;
  last_name?: string;
  party?: PartyMember[] | string | null;
};

/**
 * Result of a duplicate match check.
 */
export type DuplicateCheckResult = {
  isDuplicate: boolean;
  candidate?: CandidateRsvp;
  matches: Array<{
    newPerson: PersonToMatch;
    existingPerson: PersonToMatch;
  }>;
};

/**
 * Check if two people match using fuzzy name matching.
 * Rules:
 * - Last name must match: exact tokens OR one token is substring of another
 * - First name must match: exact, prefix, or first 3 chars equal
 */
export function personMatches(a: PersonToMatch, b: PersonToMatch): boolean {
  const aFirstTokens = tokenizeName(a.firstName || '');
  const bFirstTokens = tokenizeName(b.firstName || '');
  const aLastTokens = tokenizeName(a.lastName || '');
  const bLastTokens = tokenizeName(b.lastName || '');

  // Require both to have last names
  if (aLastTokens.length === 0 || bLastTokens.length === 0) {
    return false;
  }

  // Last name check: exact match OR any token from one is substring of any token from other
  const lastNamesExact = aLastTokens.join(' ') === bLastTokens.join(' ');
  const aTokenSubstringOfB = aLastTokens.some(aToken => 
    bLastTokens.some(bToken => bToken.includes(aToken))
  );
  const bTokenSubstringOfA = bLastTokens.some(bToken => 
    aLastTokens.some(aToken => aToken.includes(bToken))
  );

  if (!lastNamesExact && !aTokenSubstringOfB && !bTokenSubstringOfA) {
    return false;
  }

  // First name check: any token matches
  return aFirstTokens.some(aToken =>
    bFirstTokens.some(bToken => firstNameTokenMatches(aToken, bToken))
  );
}

/**
 * Check if two first name tokens match.
 * - Exact match
 * - One is prefix of the other
 * - First 3 chars match (for nicknames like "Chris" / "Christopher")
 */
function firstNameTokenMatches(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  if (a.length >= 3 && b.length >= 3 && a.slice(0, 3) === b.slice(0, 3)) return true;
  return false;
}

/**
 * Extract all people from an RSVP (primary + party members).
 */
export function extractPeopleFromRsvp(rsvp: CandidateRsvp): PersonToMatch[] {
  const people: PersonToMatch[] = [];

  // Primary person
  const firstName = rsvp.first_name || (rsvp.name ? rsvp.name.split(/\s+/)[0] || '' : '');
  const lastName = rsvp.last_name || (rsvp.name ? rsvp.name.split(/\s+/).slice(-1).join(' ') || '' : '');
  people.push({ firstName, lastName });

  // Party members
  let party: PartyMember[] = [];
  try {
    if (Array.isArray(rsvp.party)) {
      party = rsvp.party;
    } else if (typeof rsvp.party === 'string' && rsvp.party) {
      party = JSON.parse(rsvp.party);
    }
  } catch {
    // Ignore parsing errors
  }

  if (Array.isArray(party)) {
    for (const p of party) {
      people.push({ firstName: p.firstName || '', lastName: p.lastName || '' });
    }
  }

  return people;
}

/**
 * Check if a new submission might be a duplicate of an existing RSVP.
 * Returns the first candidate that has person overlap.
 */
export function checkForDuplicates(
  newPrimary: PersonToMatch,
  newParty: PersonToMatch[],
  candidates: CandidateRsvp[]
): DuplicateCheckResult {
  const newPeople = [newPrimary, ...newParty];

  // Dedupe candidates by ID
  const uniqueCandidates = deduplicateCandidates(candidates);

  for (const candidate of uniqueCandidates) {
    const existingPeople = extractPeopleFromRsvp(candidate);
    const matches: Array<{ newPerson: PersonToMatch; existingPerson: PersonToMatch }> = [];

    for (const newPerson of newPeople) {
      for (const existingPerson of existingPeople) {
        if (personMatches(newPerson, existingPerson)) {
          matches.push({ newPerson, existingPerson });
        }
      }
    }

    if (matches.length > 0) {
      return {
        isDuplicate: true,
        candidate,
        matches,
      };
    }
  }

  return { isDuplicate: false, matches: [] };
}

/**
 * Deduplicate candidates by ID.
 */
export function deduplicateCandidates(candidates: CandidateRsvp[]): CandidateRsvp[] {
  const seen = new Map<string, CandidateRsvp>();
  for (const c of candidates) {
    if (c && c.id && !seen.has(c.id)) {
      seen.set(c.id, c);
    }
  }
  return Array.from(seen.values());
}

/**
 * Generate search queries for finding potential duplicates.
 * Returns an object with flags for which searches should be run.
 */
export function getDuplicateSearchQueries(
  email: string | null | undefined,
  firstName: string,
  lastName: string
): {
  emailQuery: string | null;
  nameQueries: string[];
} {
  const emailQuery = email ? email.toLowerCase() : null;
  const nameQueries: string[] = [];

  // Search by last name
  if (lastName && lastName.trim()) {
    nameQueries.push(lastName.trim());
  }

  // Search by first name as fallback
  if (firstName && firstName.trim()) {
    nameQueries.push(firstName.trim());
  }

  return { emailQuery, nameQueries };
}
