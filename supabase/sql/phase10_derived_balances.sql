-- Phase 10: bank balances become derived instead of a running total.
-- Run this in the Supabase SQL editor BEFORE deploying the matching app
-- code.
--
-- balance = starting_balance + sum(transactions dated >= starting_balance_date)
-- (see lib/queries/institutions.ts). The old running `current_balance`
-- was patched read-then-write on every transaction insert/delete, which
-- lost updates when requests overlapped (the recurring due-check runs on
-- every page load).
--
-- Existing rows start as `false`; the app migrates each one on the next
-- page load by anchoring it to its current stored balance as of today
-- (migrateLegacyBalances), so nothing visibly jumps.

alter table public.institutions
  add column if not exists balance_anchored boolean not null default false;
