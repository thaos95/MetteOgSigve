import { describe, it, expect } from 'vitest';
import {
  personMatches,
  extractPeopleFromRsvp,
  checkForDuplicates,
  deduplicateCandidates,
} from '../duplicate';
import type { CandidateRsvp, PersonToMatch } from '../duplicate';

/**
 * Duplicate Detection Tests
 * 
 * SIMPLIFIED MODEL (2024):
 * - One person per RSVP (no party members)
 * - Duplicate detection only checks the primary person
 */

describe('personMatches', () => {
  it('matches exact names', () => {
    expect(personMatches(
      { firstName: 'John', lastName: 'Doe' },
      { firstName: 'John', lastName: 'Doe' }
    )).toBe(true);
  });

  it('matches with different casing', () => {
    expect(personMatches(
      { firstName: 'JOHN', lastName: 'DOE' },
      { firstName: 'john', lastName: 'doe' }
    )).toBe(true);
  });

  it('matches first name prefix (Chris/Christopher)', () => {
    expect(personMatches(
      { firstName: 'Chris', lastName: 'Smith' },
      { firstName: 'Christopher', lastName: 'Smith' }
    )).toBe(true);
  });

  it('matches first 3 chars of first name when both long enough', () => {
    // Mik vs Mic - first 3 chars: 'mik' vs 'mic' - don't match
    expect(personMatches(
      { firstName: 'Mike', lastName: 'Johnson' },
      { firstName: 'Michael', lastName: 'Johnson' }
    )).toBe(false);
    
    // But prefix match works
    expect(personMatches(
      { firstName: 'Mic', lastName: 'Johnson' },
      { firstName: 'Michael', lastName: 'Johnson' }
    )).toBe(true);
  });

  it('matches last name when one contains token from the other', () => {
    // After normalization: 'smith' vs 'smithjones' (hyphen removed)
    // 'smith' IS contained in 'smithjones' as substring match
    // The personMatches function uses substring check: bToken.includes(aToken)
    expect(personMatches(
      { firstName: 'Jane', lastName: 'Smith' },
      { firstName: 'Jane', lastName: 'Smith-Jones' }
    )).toBe(true); // True because 'smith' is substring of 'smithjones'
    
    // Space-separated also works (tokens become ['smith', 'jones'])
    expect(personMatches(
      { firstName: 'Jane', lastName: 'Smith' },
      { firstName: 'Jane', lastName: 'Smith Jones' }
    )).toBe(true);
  });

  it('does not match different people', () => {
    expect(personMatches(
      { firstName: 'John', lastName: 'Doe' },
      { firstName: 'Jane', lastName: 'Smith' }
    )).toBe(false);
  });

  it('does not match when last names differ completely', () => {
    expect(personMatches(
      { firstName: 'John', lastName: 'Doe' },
      { firstName: 'John', lastName: 'Smith' }
    )).toBe(false);
  });

  it('does not match when first names differ completely', () => {
    expect(personMatches(
      { firstName: 'John', lastName: 'Doe' },
      { firstName: 'Jane', lastName: 'Doe' }
    )).toBe(false);
  });
});

describe('extractPeopleFromRsvp', () => {
  it('extracts primary person from first_name/last_name', () => {
    const rsvp: CandidateRsvp = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
    };
    expect(extractPeopleFromRsvp(rsvp)).toEqual([
      { firstName: 'John', lastName: 'Doe' }
    ]);
  });

  it('extracts from legacy name field', () => {
    const rsvp: CandidateRsvp = {
      id: '1',
      name: 'John Doe',
    };
    expect(extractPeopleFromRsvp(rsvp)).toEqual([
      { firstName: 'John', lastName: 'Doe' }
    ]);
  });

  // Note: Party extraction tests removed - no longer supported in simplified model
});

describe('checkForDuplicates', () => {
  it('finds duplicate by exact name match', () => {
    const newPrimary = { firstName: 'John', lastName: 'Doe' };
    const candidates: CandidateRsvp[] = [
      { id: '1', first_name: 'John', last_name: 'Doe' },
    ];

    const result = checkForDuplicates(newPrimary, candidates);
    expect(result.isDuplicate).toBe(true);
    expect(result.candidate?.id).toBe('1');
    expect(result.matches).toHaveLength(1);
  });

  it('returns false when no duplicates', () => {
    const newPrimary = { firstName: 'Unique', lastName: 'Person' };
    const candidates: CandidateRsvp[] = [
      { id: '1', first_name: 'John', last_name: 'Doe' },
    ];

    const result = checkForDuplicates(newPrimary, candidates);
    expect(result.isDuplicate).toBe(false);
    expect(result.matches).toHaveLength(0);
  });

  it('finds duplicate with fuzzy name match', () => {
    const newPrimary = { firstName: 'Chris', lastName: 'Smith' };
    const candidates: CandidateRsvp[] = [
      { id: '1', first_name: 'Christopher', last_name: 'Smith' },
    ];

    const result = checkForDuplicates(newPrimary, candidates);
    expect(result.isDuplicate).toBe(true);
    expect(result.candidate?.id).toBe('1');
  });
});

describe('deduplicateCandidates', () => {
  it('removes duplicates by id', () => {
    const candidates: CandidateRsvp[] = [
      { id: '1', first_name: 'John', last_name: 'Doe' },
      { id: '1', first_name: 'John', last_name: 'Doe' }, // duplicate
      { id: '2', first_name: 'Jane', last_name: 'Smith' },
    ];

    const result = deduplicateCandidates(candidates);
    expect(result).toHaveLength(2);
    expect(result.map(c => c.id)).toEqual(['1', '2']);
  });
});
