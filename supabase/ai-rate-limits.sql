-- Run this once in Supabase before publicly enabling AI-assisted routes.
-- Stores a salted hash rather than a raw IP address. Only server-side
-- service-role calls can consume a quota; browser clients have no access.

create table if not exists public.ai_rate_limits (
  bucket text not null check (char_length(bucket) between 1 and 80),
  subject_hash text not null check (subject_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  primary key (bucket, subject_hash)
);

alter table public.ai_rate_limits enable row level security;

create or replace function public.momo_consume_rate_limit(
  p_bucket text,
  p_subject_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_allowed boolean := false;
begin
  if p_limit < 1 or p_limit > 500 or p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'Invalid rate-limit configuration';
  end if;

  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.ai_rate_limits as limits (bucket, subject_hash, window_started_at, request_count)
  values (p_bucket, p_subject_hash, v_window, 1)
  on conflict (bucket, subject_hash) do update
    set window_started_at = excluded.window_started_at,
        request_count = case
          when limits.window_started_at < excluded.window_started_at then 1
          else limits.request_count + 1
        end
    where limits.window_started_at < excluded.window_started_at
       or limits.request_count < p_limit
  returning true into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

revoke all on table public.ai_rate_limits from anon, authenticated;
revoke all on function public.momo_consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.momo_consume_rate_limit(text, text, integer, integer) to service_role;
