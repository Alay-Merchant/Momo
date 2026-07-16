# Momo

Momo is a friendly flight-disruption companion for UK/EU journeys. It helps a traveller organise confirmed facts, understand what may matter under UK261/EU261, paste airline replies, and create an editable evidence-led next message. It is not a law firm and does not promise an outcome.

## What it does

- Provides a no-account estimate path with safe sample cases.
- Saves private claim timelines, reply history, and evidence metadata for account holders.
- Uses deterministic scope and compensation safeguards for UK261/EU261 delay and connection journeys.
- Requires the right cancellation and denied-boarding facts before suggesting a fixed amount.
- Shows a Trust Receipt and Proof Map with confirmed facts, official sources, and unknowns.
- Offers airport help, public-flight lookup, manual delay entry, anonymous aggregate outcomes, and optional unresolved-case feedback.

## Architecture

```text
Traveller facts + airline reply
          ->
Server validation and decision receipt
          ->
Deterministic UK/EU rule engine + reviewed source cards
          ->
Bounded GPT-5.6 structured refusal analysis
          ->
Validated explanation + deterministic editable message
```

The rule engine, scope selection, compensation bands, sources, and final-letter safeguards are deterministic. AI can explain an airline reply and identify an evidence gap, but cannot change legal scope, compensation amount, source, or draft safety limits.

### Rejection Dissector

In **Analyse airline refusal**, Momo accepts pasted correspondence or supported evidence and returns a compact, reviewable analysis in the existing conversation:

- a clearly labelled paraphrase of the airline position;
- only exact quotes that occurred in the passenger-provided text;
- a claim status (`needs checking`, `incomplete`, or `unsupported`) and the next neutral question; and
- an editable draft built from the deterministic decision receipt and approved official sources.

GPT-5.6 is used only for structured extraction and wording. Its response is schema-validated against the passenger text and decision receipt. Unsupported facts, amounts, citations, guarantees, threats, legal conclusions, or malformed output are discarded and replaced with a deterministic fallback. Momo logs provider, model, request tier, validation outcome, and decision/model disagreements without retaining unnecessary correspondence content.

## AI limits and cost routing

- **Luna (`gpt-5.6-luna`)**: low-cost reply explanation and triage.
- **Terra (`gpt-5.6-terra`)**: bounded deeper evidence review when enabled.
- **Gemini**: optional outage fallback only.
- **Deterministic fallback**: used whenever AI is disabled, unavailable, or produces invalid output.

Momo never sends an airline message automatically. Airline replies are untrusted text, not instructions. A user does not need airline-internal evidence; Momo asks the airline to explain its asserted cause and measures.

Momo does **not** use AI to decide eligibility, jurisdiction, compensation, limitation periods, or legal conclusions. It does not present legal advice or promise a result.

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

The last migration enables optional, structured unresolved-case feedback. It does not store free-text airline correspondence as learning data.

## Verification and demo

```bash
npm test
npm run lint
npm run build
```

The suite covers rule boundaries, source-card freshness, scope safety, prompt-injection resistance, draft safety, airport normalisation/distance calculation, structured refusal analysis, anonymous-outcome validation, and a 120-case assessment safety matrix.

For the demo, start with **Paste an airline reply**, then choose one of the three clearly labelled sample refusals. The weather sample intentionally demonstrates that Momo advises caution rather than manufacturing a compensation claim.

## Security and privacy

- Server-side input allowlists, same-origin checks, request size limits, and rate limits.
- Supabase RLS for private claims and user-owned outcomes.
- Private evidence metadata and signed-access design; uploaded files are not public.
- Evidence processing is explicit, size-limited, signature-validated, and private by default. It may be processed by OpenAI only when the evidence-reading feature is used.
- Anonymous insights use derived outcome fields only, with sample thresholds before patterns are shown.
- Rule cards are checked for source URL, status, effective date, and review expiry. See `docs/RULE_SOURCE_REVIEW.md`.

Review `SECURITY_DEPLOYMENT_CHECKLIST.md` before production release. Before public-scale launch, replace the in-memory limiter with durable Vercel/Upstash limits, add upload quarantine/malware scanning, and publish a complete Privacy Notice. The visible outcome ticker remains demo content until verified, opt-in outcomes exist.

## Deployment

Deploy as a Next.js application on Vercel. Add the environment variables above in Vercel for Production, Preview, and Development as appropriate, then redeploy. The repository is connected to `https://github.com/Alay-Merchant/Momo`.

## Product limits

Momo currently focuses on UK/EU passenger-rights information. It must not be presented as legal advice, legal representation, or a guarantee of compensation. Obtain qualified legal and privacy review before commercial launch.

## Codex contribution log

Codex assisted with submission architecture, deterministic rule-engine safeguards, structured GPT-5.6 refusal analysis, accessible UI, adversarial/unit testing, mobile checks, and security review. Review generated code and content before production release.

## Hackathon demo assets

The three-minute recording outline is in [`docs/HACKATHON_DEMO_SCRIPT.md`](docs/HACKATHON_DEMO_SCRIPT.md). Use only demo fixtures unless a person has given explicit written permission for their claim details and outcome to appear in the video.
