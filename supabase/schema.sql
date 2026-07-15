-- Run this once in your Supabase project's SQL Editor.
-- It creates durable user profiles and saved Momo cases with row-level security.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  terms_version text,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  status text not null check (char_length(status) between 1 and 160),
  case_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.cases enable row level security;

create policy "Users can read their profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Users can create their profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users can read their own cases" on public.cases
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own cases" on public.cases
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own cases" on public.cases
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own cases" on public.cases
  for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, terms_version, terms_accepted_at)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'terms_version', ''),
    case when coalesce((new.raw_user_meta_data ->> 'terms_accepted')::boolean, false) then now() else null end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
