-- Add first_name, last_name, and party JSONB to rsvps
BEGIN;
ALTER TABLE rsvps
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS party JSONB DEFAULT '[]'::JSONB;

-- Backfill first/last name from existing 'name' column where possible
UPDATE rsvps
SET first_name = split_part(name, ' ', 1),
    last_name = (regexp_split_to_array(name, '\s+'))[array_length(regexp_split_to_array(name, '\s+'),1)];

COMMIT;

-- Optional: add index to improve last_name / party queries
CREATE INDEX IF NOT EXISTS idx_rsvps_last_name ON rsvps (lower(last_name));

-- Consider adding a GIN index for party JSONB if you plan to query party members often
-- CREATE INDEX IF NOT EXISTS idx_rsvps_party_gin ON rsvps USING GIN (party jsonb_path_ops);
