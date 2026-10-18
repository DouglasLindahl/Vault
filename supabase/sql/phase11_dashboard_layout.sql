-- Phase 11: per-user dashboard customization (edit mode, reached from
-- Settings). Holds the widget list + styling as JSON; null means "use the
-- default layout". The app validates it on every read and write — see
-- lib/dashboard-layout.ts (sanitizeLayout).
--
-- Covered by the existing profiles RLS policies (users can only read and
-- update their own row).

alter table public.profiles
  add column if not exists dashboard_layout jsonb;
