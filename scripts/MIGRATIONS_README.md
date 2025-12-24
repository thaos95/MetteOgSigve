Migration application options

1) Run with Node (recommended if you have direct DB URL locally)

- Ensure `.env.local` contains a usable connection string in one of: `POSTGRES_URL_NON_POOLING`, `POSTGRES_PRISMA_URL`, or `POSTGRES_URL`.
- Run: `node scripts/run_migration.js`  (the runner now applies all files in `scripts/migrations` in order; set `MIGRATION_SKIP_SSL_VERIFY=true` if you need to bypass TLS verification in local/dev environments)

2) Use psql (if you have a psql client and a connection string):

- psql "${POSTGRES_URL_NON_POOLING}" -f scripts/migrations/001-add-rsvp-party-columns.sql

3) Use Supabase SQL editor (recommended if you prefer UI):

- Open your Supabase project -> SQL Editor -> New script
- Paste the contents of `scripts/migrations/001-add-rsvp-party-columns.sql` and run.

Notes:
- The migration is idempotent (uses IF NOT EXISTS for adding columns) and will backfill `first_name` and `last_name` where possible.
- After applying, consider adding a GIN index for `party` JSONB if you plan to query party members frequently.
- The repo includes a fallback in the API for environments where the migration hasn't been applied yet.
