-- Run once in the Supabase SQL Editor after community-insights.sql.
alter table public.outcome_contributions add column if not exists unresolved_reason text check (unresolved_reason is null or unresolved_reason in ('airline_did_not_reply','airline_refused','needed_more_evidence','momo_misunderstood','different_help_needed','other'));
alter table public.outcome_contributions drop constraint if exists outcome_contributions_resolution_type_check;
alter table public.outcome_contributions add constraint outcome_contributions_resolution_type_check check (resolution_type in ('cash_payment','voucher','refund','rerouting','expenses','no_offer','not_resolved','other'));
