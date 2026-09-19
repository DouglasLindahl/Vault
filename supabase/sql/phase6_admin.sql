-- Phase 6: admin page. Run this in the Supabase SQL editor.
-- Admin *access* is env-var based (ADMIN_EMAILS), not stored in the DB —
-- this migration only adds the manual subscription-status flag the admin
-- page can set per user. Real billing (#7) is out of scope for now.

alter table public.profiles
  add column subscription_status text not null default 'free'
  check (subscription_status in ('free', 'trial', 'active', 'canceled'));
