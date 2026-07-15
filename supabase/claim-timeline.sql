-- Run after schema.sql and storage.sql in the Supabase SQL Editor.
-- Private claim events and evidence metadata. All access is restricted to the claim owner.

create table if not exists public.claim_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('airline_reply', 'momo_reply', 'user_draft', 'status_change')),
  content text not null check (char_length(content) between 1 and 5000),
  source_facts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.claim_files (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null check (char_length(original_name) between 1 and 180),
  mime_type text not null check (mime_type in ('application/pdf', 'image/png', 'image/jpeg')),
  byte_size integer not null check (byte_size > 0 and byte_size <= 10485760),
  created_at timestamptz not null default now()
);

create index if not exists claim_events_case_created_idx on public.claim_events(case_id, created_at);
create index if not exists claim_files_case_created_idx on public.claim_files(case_id, created_at);

alter table public.claim_events enable row level security;
alter table public.claim_files enable row level security;

create policy "Users can read their own claim events" on public.claim_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own claim events" on public.claim_events for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.cases where id = case_id and user_id = (select auth.uid())));
create policy "Users can delete their own claim events" on public.claim_events for delete to authenticated using ((select auth.uid()) = user_id);
create policy "Users can read their own claim files" on public.claim_files for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own claim files" on public.claim_files for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.cases where id = case_id and user_id = (select auth.uid())));
create policy "Users can delete their own claim files" on public.claim_files for delete to authenticated using ((select auth.uid()) = user_id);
