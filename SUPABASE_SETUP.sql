-- HaulLinks access control for Supabase
-- Run this entire file once in Supabase Dashboard > SQL Editor.
-- It creates NO public admin API and stores NO passwords.

create table if not exists public.haullinks_user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  changed_at timestamptz not null default now()
);

alter table public.haullinks_user_access enable row level security;

revoke all on table public.haullinks_user_access from anon;
revoke all on table public.haullinks_user_access from authenticated;
grant select on table public.haullinks_user_access to authenticated;

drop policy if exists "Users read their own HaulLinks access" on public.haullinks_user_access;
create policy "Users read their own HaulLinks access"
on public.haullinks_user_access
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.haullinks_set_access_changed_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.changed_at = now();
  return new;
end;
$$;

drop trigger if exists haullinks_access_changed_at on public.haullinks_user_access;
create trigger haullinks_access_changed_at
before update on public.haullinks_user_access
for each row execute function public.haullinks_set_access_changed_at();

create or replace function public.haullinks_add_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.haullinks_user_access (user_id, email, active)
  values (new.id, coalesce(new.email, ''), true)
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

revoke all on function public.haullinks_add_auth_user() from public;

drop trigger if exists haullinks_auth_user_created on auth.users;
create trigger haullinks_auth_user_created
after insert or update of email on auth.users
for each row execute function public.haullinks_add_auth_user();

-- Add access rows for users created before this SQL was run.
insert into public.haullinks_user_access (user_id, email, active)
select id, coalesce(email, ''), true
from auth.users
on conflict (user_id) do update set email = excluded.email;

-- Administration stays in Supabase Dashboard > Table Editor > haullinks_user_access.
-- Set active=false to force that user out of HaulLinks on the next access check.
-- Set active=true to restore access.
