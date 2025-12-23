# Mette & Sigve — Wedding Site (Next.js scaffold)

This is a simple Next.js scaffold for a wedding site with RSVP handling using Supabase.

## Local setup
1. Copy `.env.example` to `.env.local` and fill the Supabase values.
2. Install packages: `npm install`.
3. Start dev server: `npm run dev`.

## Supabase setup
Create a table for RSVPs. Example SQL:

```sql
-- optional extension for UUID generation
create extension if not exists pgcrypto;

create table rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  attending boolean,
  guests int default 0,
  notes text,
  created_at timestamptz default now()
);

-- (recommended) enable RLS to prevent public reads/writes from the client
alter table rsvps enable row level security;

-- Do NOT add a "public can read" policy unless you want rsvps visible to everyone.
-- The server uses the Service Role key (which bypasses RLS) for admin operations.
```

Environment variables to set (locally in `.env.local`, and in Vercel Project Env):
- `NEXT_PUBLIC_SUPABASE_URL` (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
- `SUPABASE_URL` (server-side; recommended)
- `SUPABASE_SERVICE_ROLE_KEY` (secret — server-only)
- `ADMIN_PASSWORD` (secret — used by local admin page login)

Optional (anti-abuse and email delivery):
- `RECAPTCHA_SITE_KEY` (public) — reCAPTCHA v3 site key (optional)
- `RECAPTCHA_SECRET` (secret) — reCAPTCHA v3 secret for server-side verification
- `FEATURE_ENABLE_CAPTCHA` (true|false) — enable CAPTCHA enforcement even if keys exist
- `RL_RSVP_PER_IP` — RSVPs per IP (default 10)
- `RL_RSVP_PER_EMAIL` — RSVPs per email (default 5)
- `RL_RSVP_WINDOW` - window in seconds for RSVP limits (default 86400)
- `RL_TOKEN_REQ_PER_IP` - token requests per IP (default 20)
- `RL_TOKEN_REQ_PER_EMAIL` - token requests per email (default 5)
- `RL_TOKEN_REQ_WINDOW` - window in seconds for token request limits (default 3600)
- `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`) — Upstash REST URL and token for rate limiting
- `SENDGRID_API_KEY` - optional SendGrid key for production email delivery

Notes on security and policies
- Keep the **Service Role** key secret (set it as a server-only env var in Vercel); server-side code uses this key and bypasses RLS.  
- For privacy, it's recommended to keep `rsvps` locked (RLS enabled) and do all reads/writes via server API routes that authenticate with the Service Role key (as this scaffold already does).

## Admin
A minimal password-protected admin page is included (set `ADMIN_PASSWORD`) which sends the password in the POST body to `/api/admin/rsvps`. This is convenient for a personal site; for production consider proper authentication (Supabase Auth, OAuth, or Vercel password protection).

## Development debug note 🔧
- During local development you may see dynamic route `params` being empty inside App Router API route handlers in some dev setups. The project includes a safe fallback: when `params` aren't populated the handler extracts the `id` from the request URL (this fallback is only enabled in development).
- Avoid committing temporary debug routes (e.g., `src/app/api/rsvp/[id]/inspect`) — they are helpful for troubleshooting but should be removed before deploying.
- To test token flows locally, you can use the provided scripts in `scripts/` (e.g., `request_token_and_send.js`, `simulate_put_with_token.js`, `test_request_token.js`) or call the endpoints directly: `POST /api/rsvp/request-token` and `GET /api/rsvp/verify-token`.
- **Note:** Test scripts have been hardened with defensive response handling and timestamped logging to improve reliability and diagnostics (e.g., `node scripts/full_verification_flow.js`).

## Recommended dev workflow (Windows)
- Start the dev server in a dedicated terminal so it runs independently:
  - Recommended: open a PowerShell/CMD window and run `npm run dev:win` (this opens a new `cmd` window running `npm run dev`).
  - Alternatively, run `start cmd /k "npm run dev"` from the project root.
- Always open a second terminal to run tests or other commands. Confirm the dev server is running before performing actions by checking:
  - `curl -I http://localhost:3000/` (HTTP 200 expected) or
  - `netstat -ano | findstr :3000` and check the node process PID.
- This prevents accidental stopping of the dev server when running other commands in the same terminal.

## Enabling reCAPTCHA (production / Vercel)
- Steps to enable production CAPTCHA (recommended order):
  1. Create reCAPTCHA v3 credentials in Google (site key + secret).
  2. Add the following Environment Variables in Vercel (Project > Settings > Environment Variables):
     - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (set for Production & Preview as public)
     - `RECAPTCHA_SECRET` (set for Production & Preview — server-only)
     - `FEATURE_ENABLE_CAPTCHA=true` (optional: enforce CAPTCHA even if keys present)
  3. Deploy or redeploy. The frontend will load grecaptcha (v3) with the site key, and the server will validate tokens. Start with Preview or a branch to test before enforcing globally.
- You can also enable `FEATURE_ENABLE_CAPTCHA` locally in `.env.local` to test enforcement, but prefer adding the real keys in Vercel for live verification and then toggle enforcement.


## Email verification
- RSVPs created with an email are created as `verified=false` and a verification email is sent containing a secure single-use link. Use `GET /api/rsvp/verify-token?token=<token>` to verify and set `verified=true`.
- Edit/cancel tokens are only sent for verified RSVPs; tokens are stored hashed (`token_hash`) in the database (raw tokens are never stored).
- This double‑opt-in approach reduces spam and ensures emails are valid before tokens are issued.

## CSV backups & scheduling
You can export RSVPs as CSV from the admin UI (Export CSV button) or email the CSV via `/api/admin/email-rsvps` (POST body: `{ "password": "...", "to": "you@example.com" }`). The email endpoint requires SMTP configuration via environment variables:

- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - optional (default 587)
- `SMTP_SECURE` - optional, 'true' if using TLS on connect
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `FROM_EMAIL` - the `from:` address for sent emails

For scheduled backups, configure a scheduled job (Vercel Cron, GitHub Actions, or any scheduler) that POSTs to `/api/admin/email-rsvps` with the admin password and destination email. Example curl (use a secret runner):

```
curl -X POST https://<your-deployment>/api/admin/email-rsvps \
  -H "Content-Type: application/json" \
  -d '{ "password": "<ADMIN_PASSWORD>", "to": "you@yourdomain.com" }'
```

If you prefer automatic backups handled by a 3rd-party, configure jobs to call the endpoint and keep SMTP secrets in your project environment.

---


---

This scaffold includes:
- App router pages: `/`, `/rsvp`, `/gallery`, `/travel`, `/admin`
- A simple `RSVPForm` component and API endpoints under `/api` to insert & fetch RSVPs.

Customize styles and content to match your desired design and the inspirations from your PDFs.