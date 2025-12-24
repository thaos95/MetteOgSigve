# RSVP State Machine & Token Flow

## Overview

This document describes the RSVP verification and token system as implemented after the June 2025 workflow audit.

## Key Policy: Token Delivery Proves Inbox Control

**Core principle**: Delivering a token to an email address proves the recipient controls that inbox. This eliminates circular dead-ends where users couldn't request edit tokens without being verified.

## RSVP States

```
┌─────────────┐
│   Created   │  Guest submits RSVP form
│ verified=F  │  Verification email sent
└──────┬──────┘
       │
       ├──────────────────────────────────────────┐
       │                                          │
       ▼                                          ▼
┌─────────────┐                          ┌─────────────┐
│  Verified   │  Via verification link   │ Token Used  │  Edit/cancel token
│ verified=T  │  GET /api/rsvp/verify    │ verified=T  │  PUT/DELETE /api/rsvp/[id]
└──────┬──────┘                          └──────┬──────┘
       │                                        │
       └────────────────┬───────────────────────┘
                        │
                        ▼
               ┌─────────────┐
               │   Active    │  Guest can request new
               │ verified=T  │  edit/cancel tokens
               └─────────────┘
```

## Token Types (purpose field)

| Purpose  | Description | Created By | Consumed By |
|----------|-------------|------------|-------------|
| `verify` | Initial email verification | POST /api/rsvp | GET /api/rsvp/verify-token |
| `edit`   | Edit existing RSVP | POST /api/rsvp/request-token | PUT /api/rsvp/[id] |
| `cancel` | Cancel/delete RSVP | POST /api/rsvp/request-token | DELETE /api/rsvp/[id] |

## API Endpoints

### POST /api/rsvp
Creates new RSVP with `verified: false`. Sends verification email with token link.

### POST /api/rsvp/request-token
Issues edit or cancel token. **Does NOT require prior verification** - the token being delivered to the email proves inbox control.

Request:
```json
{
  "email": "guest@example.com",
  "purpose": "edit" | "cancel",
  "captchaToken": "optional-turnstile-token"
}
```

### POST /api/rsvp/resend-verification  
Resends verification email for unverified RSVPs. Subject to rate limiting.

### GET /api/rsvp/verify-token?token=xxx
Verifies a token. For `verify` purpose, marks RSVP as verified.

### PUT /api/rsvp/[id]
Updates RSVP. Requires valid edit token. **Implicitly marks RSVP as verified** when token is valid.

### DELETE /api/rsvp/[id]
Cancels RSVP. Requires valid cancel token. **Implicitly marks RSVP as verified** when token is valid.

## Token Properties

- **Hashed storage**: Tokens stored as SHA256 hashes
- **One-time use**: Token deleted after successful use
- **Expiry**: 1 hour (configurable via TOKEN_EXPIRY_HOURS)
- **Dev mode**: Returns plaintext `devToken` when not in production

## Rate Limiting

All endpoints are protected by sliding window rate limits:
- Per device ID
- Per IP address  
- Per email address

Limits are managed via Upstash Redis. Admin can reset via `/api/admin/reset-rate-limits`.

## Client-Side Flows

### 1. New RSVP Submission
1. Guest fills form → POST /api/rsvp
2. RSVP created (verified=false)
3. Verification email sent
4. Guest clicks link → verified=true

### 2. Edit Existing RSVP (Happy Path)
1. Guest clicks edit link in email with token
2. Token validated, RSVP loaded into form
3. Guest modifies and submits → PUT with token
4. RSVP updated, verified=true (if wasn't already)

### 3. Edit via Duplicate Detection
1. Guest tries to submit duplicate RSVP
2. Form shows "Existing RSVP Found" dialog
3. Guest clicks "Edit this RSVP"
4. System auto-requests edit token via email
5. In dev mode: token auto-applied; in prod: email sent with link

### 4. Resend Verification
1. Guest never received/lost verification email
2. Calls POST /api/rsvp/resend-verification
3. New verification token created and emailed

## Security Considerations

1. **Email verification not gatekeeping**: We don't block token requests based on verification status because token delivery itself proves inbox ownership.

2. **Rate limiting is primary defense**: Prevents abuse of token generation, not arbitrary "verified" checks.

3. **CAPTCHA support**: All public endpoints support Cloudflare Turnstile CAPTCHA for additional bot protection.

4. **One-time tokens**: Each token can only be used once, preventing replay attacks.

## Testing

The following test files cover the token flows:

- `tests/rsvp-unverified-flow.spec.ts` - Tests for unverified user token flows
- `tests/rsvp-token.spec.ts` - General token paste/use flows
- `tests/duplicate-flow.spec.ts` - Duplicate detection scenarios

Run with:
```bash
npm run test:e2e
npm run test:unit
```

## Changelog

### June 2025 Workflow Audit
- **FIXED**: Removed verification requirement from `/api/rsvp/request-token`
- **FIXED**: PUT and DELETE now implicitly verify RSVP when token is used
- **NEW**: `/api/rsvp/resend-verification` endpoint
- **IMPROVED**: `startEditFromExisting()` auto-requests edit token
- **IMPROVED**: Better 401 error messages with user guidance
