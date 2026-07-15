-- Run this after schema.sql in the Supabase SQL Editor.
-- Private contributions are linked to a user only long enough to enforce access controls.
-- A trigger copies approved, derived fields into an anonymous learning table with no user id,
-- case id, booking reference, original message, document, email, or IP address.

create table if not exists public.outcome_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  airline text not null check (char_length(airline) between 2 and 80),
  disruption_type text not null check (disruption_type in ('delay','cancellation','missed_connection','denied_boarding')),
  delay_band text not null check (delay_band in ('under_3h','3_to_4h','4h_plus','unknown')),
  reason_category text not null check (reason_category in ('operational','technical','crew','weather','air_traffic_control','security','other','unspecified')),
  resolution_type text not null check (resolution_type in ('cash_payment','voucher','refund','rerouting','expenses','no_offer','other')),
  requested_amount numeric(10,2) check (requested_amount is null or requested_amount between 0 and 50000),
  offered_amount numeric(10,2) check (offered_amount is null or offered_amount between 0 and 50000),
  accepted_amount numeric(10,2) check (accepted_amount is null or accepted_amount between 0 and 50000),
  currency char(3) not null default 'GBP' check (currency ~ '^[A-Z]{3}$'),
  opted_in boolean not null default false check (opted_in),
  created_at timestamptz not null default now()
);

create table if not exists public.anonymous_outcomes (
  id uuid primary key default gen_random_uuid(),
  airline text not null,
  disruption_type text not null,
  delay_band text not null,
  reason_category text not null,
  resolution_type text not null,
  requested_amount numeric(10,2),
  offered_amount numeric(10,2),
  accepted_amount numeric(10,2),
  currency char(3) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.research_cache (
  id uuid primary key default gen_random_uuid(),
  topic_key text not null unique,
  summary text not null check (char_length(summary) between 1 and 2000),
  source_urls jsonb not null default '[]'::jsonb,
  verified boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.research_runs (
  id uuid primary key default gen_random_uuid(),
  topic_key text not null,
  created_at timestamptz not null default now()
);

alter table public.outcome_contributions enable row level security;
alter table public.anonymous_outcomes enable row level security;
alter table public.research_cache enable row level security;
alter table public.research_runs enable row level security;

create policy "Users can add their own opted-in outcome" on public.outcome_contributions
  for insert to authenticated with check ((select auth.uid()) = user_id and opted_in = true);
create policy "Users can read their own outcome contributions" on public.outcome_contributions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Anyone can read only fresh verified research" on public.research_cache
  for select to anon, authenticated using (verified = true and expires_at > now());

create or replace function public.copy_anonymous_outcome()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.anonymous_outcomes (airline, disruption_type, delay_band, reason_category, resolution_type, requested_amount, offered_amount, accepted_amount, currency)
  values (new.airline, new.disruption_type, new.delay_band, new.reason_category, new.resolution_type, new.requested_amount, new.offered_amount, new.accepted_amount, new.currency);
  return new;
end;
$$;

drop trigger if exists anonymise_outcome_contribution on public.outcome_contributions;
create trigger anonymise_outcome_contribution
  after insert on public.outcome_contributions
  for each row execute procedure public.copy_anonymous_outcome();

create or replace function public.momo_compensation_patterns(
  p_airline text,
  p_disruption_type text,
  p_delay_band text,
  p_reason_category text
)
returns table(sample_count bigint, offered_low numeric, offered_high numeric, accepted_low numeric, accepted_high numeric, common_resolution text)
language sql
security definer set search_path = ''
stable
as $$
  select count(*)::bigint,
    min(offered_amount), max(offered_amount), min(accepted_amount), max(accepted_amount),
    mode() within group (order by resolution_type)
  from public.anonymous_outcomes
  where lower(airline) = lower(p_airline)
    and disruption_type = p_disruption_type
    and delay_band = p_delay_band
    and reason_category = p_reason_category
  having count(*) >= 10;
$$;

revoke all on public.anonymous_outcomes from anon, authenticated;
revoke all on public.research_runs from anon, authenticated;
grant execute on function public.momo_compensation_patterns(text, text, text, text) to anon, authenticated;
