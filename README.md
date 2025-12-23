# Mette & Sigve — Wedding Site (Next.js scaffold)

This is a simple Next.js scaffold for a wedding site with RSVP handling using Supabase.

## Local setup
1. Copy `.env.example` to `.env.local` and fill the Supabase values.
2. Install packages: `npm install`.
3. Start dev server: `npm run dev`.

## Supabase setup
Create a table for RSVPs. Example SQL:

```sql
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
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and in Vercel.

## Admin
A minimal password-protected admin page is included (set `ADMIN_PASSWORD`), which fetches RSVPs via a server API route that uses the service role key.

---

This scaffold includes:
- App router pages: `/`, `/rsvp`, `/gallery`, `/travel`, `/admin`
- A simple `RSVPForm` component and API endpoints under `/api` to insert & fetch RSVPs.

Customize styles and content to match your desired design and the inspirations from your PDFs.