import { describe, it, expect } from 'vitest';
import {
  normalizeName,
  tokenizeName,
  isValidEmail,
  combineName,
  splitName,
} from '../validation';

describe('normalizeName', () => {
  it('strips diacritics', () => {
    expect(normalizeName('Sigvé')).toBe('sigve');
    expect(normalizeName('Müller')).toBe('muller');
    expect(normalizeName('Søren')).toBe('sren'); // ø becomes empty
  });

  it('lowercases', () => {
    expect(normalizeName('JOHN DOE')).toBe('john doe');
  });

  it('removes special characters', () => {
    expect(normalizeName("O'Brien")).toBe('obrien');
    expect(normalizeName('Smith-Jones')).toBe('smithjones');
  });

  it('collapses whitespace', () => {
    expect(normalizeName('  John   Doe  ')).toBe('john doe');
  });
});

describe('tokenizeName', () => {
  it('splits into tokens', () => {
    expect(tokenizeName('John Doe')).toEqual(['john', 'doe']);
  });

  it('handles empty string', () => {
    expect(tokenizeName('')).toEqual([]);
  });
});

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@missing-local.com')).toBe(false);
  });

  it('allows empty/null (email is optional)', () => {
    expect(isValidEmail('')).toBe(true);
    expect(isValidEmail(null)).toBe(true);
    expect(isValidEmail(undefined)).toBe(true);
  });
});

describe('combineName', () => {
  it('combines first and last name', () => {
    expect(combineName('John', 'Doe')).toBe('John Doe');
  });

  it('trims whitespace', () => {
    expect(combineName('  John  ', '  Doe  ')).toBe('John Doe');
  });
});

describe('splitName', () => {
  it('splits full name into first and last', () => {
    expect(splitName('John Doe')).toEqual({ firstName: 'John', lastName: 'Doe' });
  });

  it('handles single name', () => {
    expect(splitName('Madonna')).toEqual({ firstName: 'Madonna', lastName: '' });
  });

  it('handles multiple parts (last = everything after first)', () => {
    expect(splitName('Mary Jane Watson')).toEqual({ firstName: 'Mary', lastName: 'Jane Watson' });
  });

  it('handles empty string', () => {
    expect(splitName('')).toEqual({ firstName: '', lastName: '' });
  });
});
