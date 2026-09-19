-- Fixes: deleting a user's auth account (via Settings → Delete account, or
-- the admin page) left their profiles row behind, since profiles.id had no
-- ON DELETE CASCADE back to auth.users(id).
--
-- Finds whatever the existing FK constraint is actually named (Postgres/
-- Supabase auto-naming can vary) and replaces it with one that cascades,
-- rather than guessing the name.

do $$
declare
  fk_name text;
begin
  select tc.constraint_name into fk_name
  from information_schema.table_constraints tc
  join information_schema.constraint_column_usage ccu
    on tc.constraint_name = ccu.constraint_name
   and tc.table_schema = ccu.table_schema
  where tc.table_schema = 'public'
    and tc.table_name = 'profiles'
    and tc.constraint_type = 'FOREIGN KEY'
    and ccu.table_schema = 'auth'
    and ccu.table_name = 'users';

  if fk_name is not null then
    execute format('alter table public.profiles drop constraint %I', fk_name);
  end if;

  alter table public.profiles
    add constraint profiles_id_fkey
    foreign key (id) references auth.users(id) on delete cascade;
end $$;
