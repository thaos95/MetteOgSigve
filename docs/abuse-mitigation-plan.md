# Abuse Mitigation & Email Deliverability Plan

This document summarizes recommended measures to protect open RSVP registration from spam and abuse and to improve email deliverability for verification and admin backups.

---

## Goals
- Allow public RSVPs while preventing automated spam and abuse.
- Ensure RSVP confirmation/edit flows are secure (single-use, hashed tokens).
- Provide reliable email delivery for verification and admin exports (SendGrid recommended).

## High-level Strategy
1. Add **email verification (double opt-in)** for RSVP confirmations. (in progress/completed)
2. Protect endpoints with **CAPTCHA** (client-side + server-side verification). (planned)
3. Add **rate limiting** per IP and per email for sensitive endpoints. (planned)
4. Store and use **hashed tokens** (SHA-256) for verification/edit flows (single-use + TTL). (completed)
5. Use a transactional email service (SendGrid) for production to improve deliverability and DKIM/SPF/DKIM setup. (planned)
6. Disable dev-only fallbacks and debug routes in production. (completed)

---

## CAPTCHA
- Options: **reCAPTCHA v3 (invisible)**, **reCAPTCHA v2 (checkbox)**, **hCaptcha**.
- Recommendation: use reCAPTCHA v3 (low friction) or hCaptcha if privacy is a concern.
- Integration:
  - Add site key to front-end (`NEXT_PUBLIC_RECAPTCHA_KEY`) and secret on server (`RECAPTCHA_SECRET`).
  - Validate token server-side for these endpoints: `POST /api/rsvp` and `POST /api/rsvp/request-token`.
  - Reject requests with low score or failed verification (HTTP 400/429).
  - Keep CAPTCHA optional for low-traffic rollouts, but enforce once confident.

## Rate limiting
- Use Redis-backed counters (Upstash Redis for serverless) or platform-native rate limiting.
- Protect endpoints:
  - `POST /api/rsvp` (limit per IP, e.g., 10/day)
  - `POST /api/rsvp/request-token` (limit per IP/email, e.g., 5/hour)
- Implementation pattern:
  - Key format: `rl:rsvp:ip:{ip}` and `rl:token:email:{email}`.
  - Increment counter with expiry and reject with 429 when limit exceeded.
  - Return `Retry-After` header when limiting.

## Token security (hashing + single-use)
- On create-request or verification flows, generate `token` (raw) and compute `token_hash = sha256(token)`.
- Store `token_hash`, `expires_at`, `purpose`, `used` in `rsvp_tokens`.
- Email raw `token` in link. On incoming token, hash and `SELECT ... WHERE token_hash = $1`.
- After successful use, set `used = true` (atomic via transaction). TTL default: 1 hour.

**DB migration suggestions**
- `ALTER TABLE public.rsvps ADD COLUMN verified boolean DEFAULT false;`
- `ALTER TABLE public.rsvp_tokens ADD COLUMN token_hash text;` (then backfill if needed and drop `token` column)
- Add index: `CREATE INDEX ON public.rsvp_tokens (token_hash);`

## SendGrid & Email deliverability
- Recommendation: use **SendGrid** (or similar: Mailgun, Postmark) in production for reliability.
- Setup:
  - Add `SENDGRID_API_KEY` (env) and switch mail helper to use SendGrid when available.
  - Configure SPF/DKIM/DMARC on your domain for better deliverability.
  - Use `FROM_EMAIL` and track bounces/complaints.
- Use SMTP only as a fallback; avoid Gmail SMTP in production.

## Dev/Production safety
- Ensure dev fallbacks and inspect/test routes are wrapped or removed in production:
  - `if (process.env.NODE_ENV !== 'production') { /* fallback behavior */ }`
- Add a feature flag (env var) to enable/disable anti-abuse features for rollout/testing.

## Monitoring & Observability
- Log rate-limited events, failed CAPTCHA verifications, and email errors.
- Add alerting when failed email rate or verification failures spike.

## Testing & QA
- Integration tests for flows:
  - Create RSVP → verify email link → verified=true
  - Request token → attempt multiple requests until rate-limited
  - Verify token hashing and single-use
- Abuse tests: simulate rapid requests from same IP/email and ensure limits trigger.

## Rollout plan
1. Implement backend token hashing and verified flag; keep verification optional (soft-launch).
- Add CAPTCHA integration and server-side checks behind a feature flag. (in progress)
3. Add Redis-backed rate limiting.
4. Switch to SendGrid for outgoing emails and ensure SPF/DKIM configured.
5. Enable enforced verification and strict limits in production after 24–72h monitoring.

## Env variables (summary)
- `RECAPTCHA_SITE_KEY` (public), `RECAPTCHA_SECRET` (server)
- `REDIS_URL` / `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- `SENDGRID_API_KEY` (string)
- `FEATURE_ENABLE_CAPTCHA`=true/false
- `FEATURE_ENABLE_RATE_LIMITS`=true/false

---

## Quick task checklist
- [ ] Add `verified` column and token_hash migration
- [ ] Update `/api/rsvp` to create RSVP with `verified=false` and send verification email
- [ ] Replace `rsvp_tokens.token` with hashed storage & update request-token flow
- [ ] Integrate CAPTCHA on front-end and verify server-side
- [ ] Add Redis-based rate limiting middleware and rules
- [ ] Configure SendGrid and update mail helper
- [ ] Add tests and monitoring
- [ ] Roll out behind feature flags then enable in production

---

If you want, I can implement these in the above priority order (start with token hashing & email verification), and add SendGrid setup for admin and transactional emails as part of the same change set.
