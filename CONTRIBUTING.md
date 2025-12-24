# Contributing to Wedding RSVP Site

This guide explains the codebase architecture and conventions for adding features or making changes.

## Architecture Overview

```
src/
├── app/           # Next.js App Router (routes only)
├── components/    # React components (UI)
├── domain/        # Business logic (pure functions, types)
├── lib/           # Shared utilities and infrastructure
└── hooks/         # React hooks
```

### Module Boundaries (What Can Import What)

```
app/api/*  ──► lib/*  ──► domain/*
     │           │
     └───────────┴────►  (infra: supabase, redis, mail)

components/*  ──► domain/*/types.ts (types only)
      │
      └──► hooks/*
```

**Rules:**
- `domain/*` must NOT import from `lib/*` (infra) - keep it pure
- `components/*` should NOT import from `lib/*` directly (except types)
- API routes should use helpers from `lib/*` for infra access

## Directory Structure

### `src/domain/rsvp/`
Pure business logic with no I/O dependencies:
- `types.ts` - Core types (Rsvp, PartyMember, Token, etc.)
- `schema.ts` - Zod validation schemas
- `validation.ts` - Name normalization, email validation
- `duplicate.ts` - Fuzzy duplicate detection logic

### `src/lib/`
Shared infrastructure and utilities:
- `supabaseServer.ts` - Supabase server client
- `rateLimit.ts` - Rate limiting with presets
- `mail.ts` - Email sending (SendGrid/Nodemailer)
- `errors.ts` - AppError class and response helpers
- `adminAuth.ts` - Admin authentication helpers
- `adminAudit.ts` - Audit logging

### `src/components/`
- UI components, organized by feature
- Each component should be focused on rendering
- Business logic should be in domain/ or passed via props

### `tests/` (E2E)
Playwright E2E tests for critical user flows.

### `src/**/\__tests__/` (Unit)
Vitest unit tests co-located with source files.

## Naming Conventions

| Category | Convention | Example |
|----------|------------|---------|
| Types | PascalCase | `Rsvp`, `PartyMember` |
| Schemas | camelCase + Schema | `createRsvpSchema` |
| Functions | camelCase | `normalizeName`, `checkForDuplicates` |
| Components | PascalCase | `RSVPForm.tsx` |
| API routes | `route.ts` in folder | `api/rsvp/route.ts` |
| Tests | `.test.ts` (unit), `.spec.ts` (E2E) | `validation.test.ts` |

## Adding a Feature

### 1. Define Types
Add types to `src/domain/rsvp/types.ts`:
```typescript
export type NewFeatureInput = {
  field1: string;
  field2: boolean;
};
```

### 2. Add Validation Schema
Add Zod schema to `src/domain/rsvp/schema.ts`:
```typescript
export const newFeatureSchema = z.object({
  field1: z.string().min(1),
  field2: z.boolean(),
});
```

### 3. Implement Business Logic
Add pure functions to domain/ (e.g., `src/domain/rsvp/newfeature.ts`):
```typescript
export function calculateNewThing(input: NewFeatureInput): Result {
  // Pure logic, no I/O
}
```

### 4. Write Unit Tests
Add tests to `src/domain/rsvp/__tests__/newfeature.test.ts`:
```typescript
describe('calculateNewThing', () => {
  it('handles valid input', () => {
    expect(calculateNewThing({ field1: 'test', field2: true })).toBe(...);
  });
});
```

### 5. Create API Route
Add route to `src/app/api/feature/route.ts`:
```typescript
import { AppError, errorResponse, zodToAppError } from '@/lib/errors';
import { newFeatureSchema } from '@/domain/rsvp/schema';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = newFeatureSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(zodToAppError(result.error));
    }
    
    // Use domain logic
    const output = calculateNewThing(result.data);
    
    return NextResponse.json({ ok: true, data: output });
  } catch (err) {
    if (err instanceof AppError) return errorResponse(err);
    console.error('[feature]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 6. Add E2E Test (if user-facing)
Add to `tests/feature.spec.ts`:
```typescript
test('feature works end-to-end', async ({ page, request }) => {
  // Test the full flow
});
```

## Error Handling

Use `AppError` from `src/lib/errors.ts`:

```typescript
import { AppError, errorResponse } from '@/lib/errors';

// Throw specific errors
throw AppError.notFound('RSVP');
throw AppError.unauthorized();
throw AppError.rateLimited(60, 'device');
throw AppError.validation('Invalid input', { field: ['error message'] });

// Return error response
return errorResponse(new AppError('DUPLICATE', 'Already exists'));
```

## Rate Limiting

Use presets from `src/lib/rateLimit.ts`:

```typescript
import { applyRsvpRateLimits, getRateLimitContext } from '@/lib/rateLimit';

const context = getRateLimitContext(req, body);
await applyRsvpRateLimits({ ...context, email });
// Throws AppError.rateLimited if exceeded
```

## Admin Routes

Use `withAdminAuth` wrapper or `verifyAdminAuth`:

```typescript
import { verifyAdminAuth, getAdminMetadata } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/adminAudit';

export async function POST(req: Request) {
  const body = await verifyAdminAuth(req);
  // body.password is now verified
  
  // Log the action
  const meta = getAdminMetadata(req);
  await logAdminAction({
    ...meta,
    action: 'my-action',
    targetTable: 'rsvps',
    targetId: id,
  });
}
```

## Testing

### Run Tests
```bash
npm run test:unit    # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
npm run build        # TypeScript check + build
```

### Test Data Cleanup
E2E tests automatically clean up test RSVPs via `tests/global-teardown.ts`.
Test emails use `@example.com` domain (RFC 2606 reserved).

## Environment Variables

See `.env.example` for required variables. Key ones:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` - Database
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` - Redis (rate limiting)
- `ADMIN_PASSWORD` - Admin authentication
- `SENDGRID_API_KEY` or SMTP vars - Email

## Code Style

- Use TypeScript strict mode
- Prefer explicit types over inference for function parameters
- Use Zod for runtime validation
- Handle errors explicitly (no silent catches)
- Log errors with context but avoid PII
