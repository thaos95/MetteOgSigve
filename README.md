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

Notes on security and policies
- Keep the **Service Role** key secret (set it as a server-only env var in Vercel); server-side code uses this key and bypasses RLS.  
- For privacy, it's recommended to keep `rsvps` locked (RLS enabled) and do all reads/writes via server API routes that authenticate with the Service Role key (as this scaffold already does).

## Admin
A minimal password-protected admin page is included (set `ADMIN_PASSWORD`) which sends the password in the POST body to `/api/admin/rsvps`. This is convenient for a personal site; for production consider proper authentication (Supabase Auth, OAuth, or Vercel password protection).

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