-- Run this after schema.sql and community-insights.sql.
-- This powers the public "Momo wins" ticker without exposing a person, account,
-- booking, flight number, document, airline message, or exact date.

alter table public.profiles add column if not exists terms_version text;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, terms_version, terms_accepted_at)
  values (new.id, nullif(new.raw_user_meta_data ->> 'terms_version', ''), case when coalesce((new.raw_user_meta_data ->> 'terms_accepted')::boolean, false) then now() else null end)
  on conflict (id) do nothing;
  return new;
end;
$$;

alter table public.outcome_contributions add column if not exists social_proof_opt_in boolean not null default false;
alter table public.outcome_contributions add column if not exists city text check (city is null or char_length(city) between 2 and 60);

create table if not exists public.social_proof_events (
  id uuid primary key default gen_random_uuid(),
  city text not null check (char_length(city) between 2 and 60),
  compensation numeric(10,2) not null check (compensation between 1 and 50000),
  disruption_type text not null check (disruption_type in ('delay','cancellation','missed_connection','denied_boarding')),
  created_at timestamptz not null default now()
);

create table if not exists public.social_proof_consent_links (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.social_proof_events(id) on delete cascade,
  primary key (user_id, event_id)
);

alter table public.social_proof_events enable row level security;
alter table public.social_proof_consent_links enable row level security;

create or replace function public.create_social_proof_event()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare event_id uuid;
begin
  if new.social_proof_opt_in = true and new.city is not null and new.accepted_amount is not null and new.accepted_amount > 0 then
    insert into public.social_proof_events (city, compensation, disruption_type)
    values (new.city, new.accepted_amount, new.disruption_type)
    returning id into event_id;
    insert into public.social_proof_consent_links (user_id, event_id) values (new.user_id, event_id);
  end if;
  return new;
end;
$$;

drop trigger if exists create_social_proof_from_outcome on public.outcome_contributions;
create trigger create_social_proof_from_outcome
  after insert on public.outcome_contributions
  for each row execute procedure public.create_social_proof_event();

create or replace function public.momo_social_proof()
returns table(city text, compensation numeric, disruption_type text)
language sql
security definer set search_path = ''
volatile
as $$
  select city, compensation, disruption_type
  from public.social_proof_events
  where created_at >= now() - interval '180 days'
  order by random()
  limit 5;
$$;

create or replace function public.withdraw_momo_social_proof()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  delete from public.social_proof_events where id in (select event_id from public.social_proof_consent_links where user_id = auth.uid());
  delete from public.social_proof_consent_links where user_id = auth.uid();
end;
$$;

revoke all on public.social_proof_events, public.social_proof_consent_links from anon, authenticated;
grant execute on function public.momo_social_proof() to anon, authenticated;
grant execute on function public.withdraw_momo_social_proof() to authenticated;
