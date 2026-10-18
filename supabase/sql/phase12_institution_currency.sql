-- Phase 12: each institution has its own currency. Its balance,
-- transactions and recurring amounts are in that currency; totals across
-- institutions are converted to the user's display currency
-- (profiles.currency) — see lib/currency.ts and lib/fx.ts.
--
-- Existing institutions default to USD, which is what the app showed them
-- as until now. Users can change it per institution on its page.

alter table public.institutions
  add column if not exists currency text not null default 'USD';
