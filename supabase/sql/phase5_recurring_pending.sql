-- Phase 5: "amount varies" recurring transactions + due-occurrence tracking.
-- Run this in the Supabase SQL editor before using the feature.

create table public.recurring_transaction_pending (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recurring_transaction_id uuid not null references public.recurring_transactions(id) on delete cascade,
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'skipped')),
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (recurring_transaction_id, due_date)
);

alter table public.recurring_transaction_pending enable row level security;

create policy "recurring_pending_owner" on public.recurring_transaction_pending
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Prevents the per-page-load due-check from double-generating a fixed-amount
-- occurrence if two requests race (e.g. two tabs open at once).
create unique index transactions_recurring_occurrence_idx
  on public.transactions (recurring_transaction_id, date)
  where recurring_transaction_id is not null;
