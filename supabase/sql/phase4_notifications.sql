-- Phase 4: notifications table + menu.
-- Run this in the Supabase SQL editor before using the notifications feature.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id);

create policy "notifications_insert_own" on public.notifications
  for insert with check (auth.uid() = user_id);

create index notifications_user_unread_idx
  on public.notifications (user_id, read, created_at desc);
