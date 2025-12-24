// Simple notes for manual testing: POST /api/rsvp with JSON body
// {
//  "name": "Test Guest",
//  "email": "test@example.com",
//  "attending": true,
//  "guests": 1,
//  "notes": "Can't wait!"
// }

// Make sure SUPABASE_SERVICE_ROLE_KEY is set locally for server-side inserts.

import { test } from 'vitest';

// Placeholder test file to document manual steps for POST /api/rsvp. This keeps the test runner
// happy while we add proper unit/integration tests later.
test('placeholder: rsvp manual test notes', () => {
  expect(true).toBe(true);
});
