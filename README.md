# Momo

Momo helps a traveller turn an airline's vague disruption response into a source-backed, editable next message. It is designed for stressful, messy journeys: delays, diversions, missed connections, poor care, and unclear offers.

Momo is not a law firm, does not provide legal advice, does not promise compensation, and never sends a claim for the traveller.

## Licence

Copyright © 2026 Alay Merchant. All rights reserved. Momo is proprietary software: the repository may be viewed for evaluation, but it may not be copied, reused, modified, distributed, or used commercially without prior written permission. See [LICENSE](LICENSE).

## Live demo

[Try the live demo](https://askmomo.vercel.app/)

For a no-login demo, choose **Paste an airline reply**, select a sample refusal, review Momo's explanation, and open the editable draft.

## What it does

- Provides a no-account UK/EU disruption estimate and editable claim-message flow.
- Keeps a connected journey focused on the final ticketed destination while distinguishing one booking from separate tickets.
- Lets a traveller describe a messy journey in their own words, then drafts only clear facts for review.
- Gives a practical stranded-now checklist for care, rerouting, receipts, and vouchers.
- Analyses an airline refusal using exact passenger-provided quotes and neutral follow-up questions.
- Compares airline offers with explicit currencies, including labelled unsupported currencies without unsafe conversion.
- Supports private accounts, saved claims, evidence metadata, outcomes, and unresolved-case feedback.

## How it works

```text
Traveller facts, airline reply, and optional evidence
                    |
                    v
Server validation + deterministic decision receipt
                    |
                    v
Reviewed UK/EU rules and official source cards
                    |
                    v
Bounded GPT-5.6 structured explanation (optional)
                    |
                    v
Schema and rule validation -> editable traveller-controlled draft
```

The deterministic rules engine is the authority for scope, fact gates, compensation bands, sources, and uncertainty. GPT-5.6 may extract airline claims, identify missing explanations, and suggest neutral wording. It cannot decide eligibility, jurisdiction, compensation, limitation periods, or legal conclusions.

## Safety and privacy

- Airline text and uploaded evidence are untrusted input, never instructions.
- Model output is schema-validated; unsupported quotes, amounts, sources, threats, guarantees, and legal assertions are rejected.
- Request size limits, input allowlists, same-origin checks, authentication checks, and route limits protect API routes.
- Private claims and evidence are designed for Supabase row-level security.
- The visible Momo wins ticker uses demo examples until a verified, opt-in outcome workflow exists.
- Never commit `.env.local`, service-role credentials, API keys, real correspondence, booking references, or personal documents.

Before public-scale launch, use a durable distributed rate limit, malware/quarantine scanning for uploads, and solicitor/privacy review.

## Built with Codex and GPT-5.6

Codex accelerated product architecture, deterministic rule-engine safeguards, refusal-analysis UI, connected-journey design, security hardening, mobile QA, and automated testing. GPT-5.6 is deliberately bounded to structured airline-reply analysis and drafting assistance; deterministic validation remains in control.

## For hackathon judges

Momo is submitted to **Apps for Your Life**. The fastest no-login test is: choose **Paste an airline reply**, select a sample refusal, review the exact-quote analysis, then open and edit the draft. Also try the weather sample: Momo should remain cautious rather than treating every disruption as a compensation claim.

The main technical distinction is that GPT-5.6 is constrained to evidence extraction and neutral drafting. A deterministic TypeScript receipt controls scope, fact gates, compensation bands, source cards, and uncertainty; unsupported model facts, quotes, amounts, citations, threats, guarantees, and legal conclusions are rejected.

The Codex feedback Session ID is provided in the Devpost submission's `/feedback` field. The public demo video shows the complete no-login journey and explains the Codex and GPT-5.6 contribution.

## Local setup

Requirements: Node.js 20+ and a Supabase project for accounts/saved claims. OpenAI is optional for the bounded analysis feature.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

### Environment variables

Use your own values locally and in your deployment platform. Do not publish values in issues, commits, screenshots, videos, or documentation.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MOMO_RATE_LIMIT_SALT=
MOMO_GUEST_AI_DAILY_LIMIT=30
OPENAI_API_KEY=
MOMO_AI_PROVIDER=openai
MOMO_AI_MODE=gpt56_review
MOMO_OPENAI_QUICK_MODEL=gpt-5.6-luna
MOMO_OPENAI_RESEARCH_MODEL=gpt-5.6-luna
MOMO_OPENAI_DEEP_MODEL=gpt-5.6-terra
```

Optional integrations are documented in `.env.example`.

## Database setup

Apply the project SQL files in the Supabase SQL Editor, including community insights, claim timeline, outcome hardening, social proof, unresolved feedback, and `ai-rate-limits.sql`. Confirm Row Level Security policies before enabling accounts or evidence storage. Set a private `MOMO_RATE_LIMIT_SALT` and keep the service-role key server-only so expensive guest AI routes have a durable, privacy-preserving quota.

## Test and verify

```bash
npm test
npm run lint
npm run build
```

The suite covers deterministic rules, compensation boundaries, source freshness, hostile model output, prompt injection, request limits, story extraction, connection/self-transfer safety, currency handling, and mobile-oriented UI safeguards.

## Submission and public-site notes

For the OpenAI Build Week submission, this repository accompanies a working demo, a public demonstration video, and a clear explanation of how Codex and GPT-5.6 contributed to the project. The recommended demo journey is: airline refusal -> exact quote -> neutral follow-up question -> editable draft.

If Momo becomes publicly available, keep the product limits and privacy safeguards visible, publish a full Privacy Notice, use durable distributed rate limits and upload scanning, maintain reviewed rule sources, and obtain appropriate legal and data-protection review before presenting the service at scale.

## Product limits

Momo's judged flow focuses on UK/EU passenger-rights information. Selective international guidance is intentionally conservative: it may show verified official resources and labelled currencies, but it does not invent universal compensation rights or exchange-rate comparisons.
