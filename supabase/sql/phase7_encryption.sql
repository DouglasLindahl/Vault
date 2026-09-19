-- Phase 7: field-level encryption.
--
-- IMPORTANT ORDER OF OPERATIONS — this migration only changes column types
-- from numeric to text; it does NOT encrypt existing data. Follow this
-- sequence exactly to avoid a window where plaintext and ciphertext rows
-- coexist:
--
--   1. Deploy the application code from this phase (lib/encryption.ts and
--      the updated query-layer files) to an environment where it is NOT
--      yet receiving traffic, with ENCRYPTION_KEY set.
--   2. Run this SQL file in the Supabase SQL editor.
--   3. Run `npx tsx scripts/encrypt-existing-data.ts` once (uses
--      SUPABASE_SERVICE_ROLE_KEY + ENCRYPTION_KEY) to encrypt every
--      existing row's name/amount/balance columns in place.
--   4. Only then point traffic at the new application code.
--
-- Before step 2, check Supabase → Database → Triggers/Functions for
-- anything referencing current_balance, starting_balance, or amount —
-- this repo has no version-controlled triggers, so this migration can't
-- account for one that exists only in the hosted project.

alter table public.transactions
  alter column amount type text using amount::text;

alter table public.recurring_transactions
  alter column amount type text using amount::text;

alter table public.institutions
  alter column starting_balance type text using starting_balance::text;

alter table public.institutions
  alter column current_balance type text using current_balance::text;

-- `name` columns on all three tables are already `text` — no type change,
-- only their contents become ciphertext (handled by the backfill script).
