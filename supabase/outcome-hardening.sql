-- Run after community-insights.sql and social-proof.sql.
-- Adds durable database checks that complement Vercel Firewall / rate-limit rules.

create unique index if not exists outcome_contributions_user_created_day_idx
  on public.outcome_contributions (user_id, ((created_at at time zone 'UTC')::date), airline, disruption_type, reason_category);

create or replace function public.momo_social_proof()
returns table(city text, compensation numeric, disruption_type text)
language sql
security definer set search_path = ''
volatile
as $$
  select city, round(compensation / 10) * 10, disruption_type
  from public.social_proof_events
  where created_at >= now() - interval '180 days'
  order by random()
  limit 5;
$$;
