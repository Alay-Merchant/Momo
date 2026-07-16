# Momo

Momo is a friendly flight-disruption companion for UK/EU journeys. It helps a traveller organise confirmed facts, understand what may matter under UK261/EU261, paste airline replies, and create an editable evidence-led next message. It is not a law firm and does not promise an outcome.

## What it does

- No-account estimate path with a safe sample case.
- Account-backed private claim timeline, reply history, and evidence metadata.
- Deterministic scope and compensation guardrails for UK261/EU261 delay and connection scenarios.
- Conservative cancellation and denied-boarding fact gates: Momo asks for notice, rerouting, readiness, volunteer, and document details before suggesting a fixed amount.
- Trust Receipt and Proof Map: visible confirmed facts, official source cards, unknowns, and why a draft asks each question.
- Airport helper, public-flight lookup, manual delay entry, anonymous outcome patterns, optional Momo-win ticker, and optional unresolved-case feedback.

## Architecture

```text
Traveller facts + airline reply
          ↓
Server validation and decision receipt
          ↓
Deterministic UK/EU rule engine + reviewed source cards
          ↓
Optional bounded GPT-5.6 evidence-gap analysis
          ↓
Validated explanation + deterministic editable message
```

The rule engine, scope selection, compensation bands, sources, and final letter safeguards are deterministic. AI can explain an airline reply and identify the next evidence gap; it cannot change legal scope, a compensation amount, source, or draft safety limits.

## AI and cost routing

- **Luna (`gpt-5.6-luna`)**: low-cost reply explanation and triage.
- **Terra (`gpt-5.6-terra`)**: bounded deeper evidence review when enabled.
- **Gemini**: optional outage fallback only.
- **Deterministic fallback**: used whenever AI is disabled, unavailable, or produces output that fails validation.

Momo never sends an airline message automatically. Airline replies are treated as untrusted text, not instructions. A user does not need airline-internal evidence; Momo asks the airline to explain its asserted cause and measures.

## Local setup

Requirements: Node.js 20+, a Supabase project, and optionally an OpenAI API key.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

### Environment variables

Required for accounts and saved claims:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MOMO_SESSION_SECRET=
```

Optional AI configuration:

```env
OPENAI_API_KEY=
MOMO_AI_PROVIDER=openai
MOMO_AI_MODE=gpt56_review
MOMO_OPENAI_QUICK_MODEL=gpt-5.6-luna
MOMO_OPENAI_DEEP_MODEL=gpt-5.6-terra
MOMO_GEMINI_FALLBACK=false
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

Optional public-flight lookup:

```env
AERODATABOX_RAPIDAPI_KEY=
```

Never commit `.env.local` or server keys.

## Supabase setup

Run the SQL files in the Supabase SQL Editor in this order:

1. Base project schema (if not already applied).
2. `supabase/community-insights.sql`
3. `supabase/claim-timeline.sql`
4. `supabase/outcome-hardening.sql`
5. `supabase/social-proof.sql`
6. `supabase/unresolved-feedback.sql`

The last migration enables the optional, structured “not resolved” feedback category. It does not store free-text airline correspondence as learning data.

## Verification

```bash
npm test
npm run lint
npm run build
```

The suite includes rule boundaries, source-card freshness, scope safety, prompt-injection resistance, draft safety, airport normalisation, anonymous-outcome validation, and a 120-case assessment safety matrix.

## Security and privacy

- Server-side input allowlists, same-origin checks, request size limits, and rate limits.
- Supabase RLS for private claims and user-owned outcomes.
- Private evidence metadata and signed-access design; do not treat uploaded files as public.
- Anonymous insights use derived outcome fields only, with sample thresholds before patterns are shown.
- Rule cards are checked for source URL, status, effective date, and review expiry. See `docs/RULE_SOURCE_REVIEW.md`.

Review `SECURITY_DEPLOYMENT_CHECKLIST.md` before production release. Replace the in-memory limiter with a durable store before meaningful public traffic.

## Deployment

Deploy as a Next.js application on Vercel. Add the environment variables above in Vercel for Production, Preview, and Development as appropriate, then redeploy. The repository is connected to `https://github.com/Alay-Merchant/Momo`.

## Product limits

Momo currently focuses on UK/EU passenger-rights information. It should not be presented as legal advice, legal representation, or a guarantee of compensation. Obtain qualified legal and privacy review before commercial launch.
