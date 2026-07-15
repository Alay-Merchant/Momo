# Momo Council Implementation Plan

## Goal

Raise the council's current average score from **6.8/10** to **above 9.0/10**, with at least three reviewer scores above **9.5/10**. This plan prioritises product truthfulness, secure claim continuity, usability, and a credible B2B2C route to market before adding broad feature scope.

## Target scorecard

| Reviewer | Current | Target | Evidence required before re-review |
|---|---:|---:|---|
| Technical/security | 6.2 | 9.6 | Real persisted claim flow, durable abuse protection, route/E2E/security tests, production-readiness checklist passed. |
| 16-year-old user | 7.2 | 9.5 | Blank guided intake, clear progress, genuinely contextual reply loop, plain-language help. |
| 80-year-old/accessibility user | 7.2 | 9.5 | Accessible flow, readable controls, forward-stage gates, keyboard/screen-reader and mobile checks passed. |
| Marketing | 7.8 | 9.3 | Outcome-led positioning, clear trust proof, coherent activation journey, credible proof points. |
| Growth/strategy | 6.8 | 9.2 | Measurable funnel, trustworthy data flywheel, partner-ready B2B2C offering, claim-completion end state. |
| YC judge | 5.8 | 9.1 | Narrow UK261 wedge, measurable outcome proof, live intelligence, partner pilot and legal/privacy readiness. |
| **Average** | **6.8** | **9.4** | At least technical, teen, and accessibility reviewers score 9.5+. |

## Product guardrails

- Launch scope: **UK261 post-airline-rejection support**. Do not imply global legal coverage until each market is researched and reviewed.
- Momo explains, organises, and drafts; it does not promise compensation, submit a claim, or provide legal advice.
- Every AI response must identify its source facts, uncertainties, and relevant official sources.
- A user owns their claim data. Anonymous learning and public success examples remain separate, explicit opt-ins.
- Never display a community compensation pattern unless the underlying outcomes meet trust, privacy, and sample-size requirements.

---

## Phase 0 — Define the measurable happy path

**Outcome:** one agreed, honest journey from first visit to claim resolution.

1. Write the canonical journey: start own case → confirm facts → understand eligibility → add airline reply → receive grounded draft → save/send independently → track response → record outcome.
2. Replace the primary landing message with an outcome-led UK scope statement, for example: “Check whether your disrupted UK flight may be worth pursuing in about three minutes.”
3. Separate **Start my case** from **View a sample case**. The real path starts blank; fixtures are visibly labelled sample data.
4. Define product events: `case_started`, `facts_confirmed`, `assessment_viewed`, `reply_added`, `draft_generated`, `draft_copied`, `claim_saved`, `send_link_opened`, `outcome_recorded`.
5. Create a baseline dashboard/specification for conversion, completion, response time, accepted amount, and user confidence.

**Acceptance criteria**

- No primary screen presents fixture data as a user's own information.
- Every stage states the user's current position, what happens next, and that Momo will not send anything.
- Tracking excludes message contents, booking references, and unnecessary personal data.

## Phase 1 — Make the conversation truthful and useful

**Outcome:** “Generate Momo's reply” produces a response grounded in the latest airline message and the user's confirmed case facts.

1. Extend the protected OpenAI server route for a `claim_reply` task; reject non-Momo topics and prompt-injection attempts.
2. Send only the minimum structured context: confirmed facts, latest airline reply, prior high-level case events, relevant UK261 rule cards, and permitted official-source URLs.
3. Return a structured response: plain-English explanation, unanswered questions, recommended next action, editable draft, source list, uncertainty flags, and confidence rationale.
4. Replace the delayed local/static draft behaviour with loading, retry, error, and “template only” fallback states.
5. Render each message as a conversation event: airline, Momo analysis, user draft, and user decision. Clearly label AI-generated material.
6. Add a “Why this reply?” panel with the facts and sources used.

**Acceptance criteria**

- A different airline reply produces a materially different, evidence-linked response.
- The app never claims that a template was generated from a message when it was not.
- Prompt-injection, unrelated chat, missing context, provider timeout, and rate-limit tests pass.

## Phase 2 — Persist claims and evidence securely

**Outcome:** a signed-in user can safely return to their real claim story on another device.

1. Add Supabase tables for `claims`, `claim_events`, `claim_messages`, and `claim_files`; link every row to `auth.uid()` and enforce row-level security.
2. Add a private storage bucket for evidence. Use authenticated uploads, size/type validation, content-disposition protection, malware scanning/quarantine before access, and short-lived signed URLs.
3. Save messages, source metadata, generated drafts, and user actions as an append-only claim timeline.
4. Add claim retrieval, rename, delete/export, and clear data-retention/deletion controls.
5. Keep anonymous outcome data technically separated from private claim content.

**Acceptance criteria**

- A user can sign in on a second session and see only their own complete timeline and permitted files.
- Direct object URL guesses, cross-user reads/writes, oversized files, unsafe MIME types, and malicious filenames are denied.
- The UI never says “saved” until the server confirms persistence.

## Phase 3 — Make the journey effortless for first-time and older users

**Outcome:** someone who knows little about flight rules can complete the core path without help.

1. Replace prefilled facts with a short, conversational intake. Include “I don't know” choices and explain why each fact matters.
2. Keep completed stages clickable, but gate forward navigation until the prior stage has minimum valid information; state exactly what is missing.
3. Auto-calculate flight distance where possible, with an “I don't know” path and a plain-English explanation of UK261 terminology.
4. Change jargon such as “Found”, “Needed”, and “Confirmed” into clear sentences and supporting help text.
5. Increase small text and hit targets to accessible sizes; verify contrast, focus order, keyboard navigation, screen-reader labels, zoom at 200%, and mobile layout.
6. Make attachments staged: select → show filename/size → remove or add to conversation. Selecting a file must not accidentally submit typed text.

**Acceptance criteria**

- A novice can start a blank case, understand the next action, and reach a useful draft in under five minutes in moderated testing.
- No forward stage can show an unexplained assessment/draft from unconfirmed data.
- WCAG 2.2 AA automated checks pass, followed by manual keyboard and screen-reader checks.

## Phase 4 — Secure the learning system and production edge

**Outcome:** community insights cannot be cheaply manipulated or expose people.

1. Replace in-memory limits with a durable Redis/KV limiter plus Vercel WAF rules for authentication, AI, uploads, outcomes, and all write routes.
2. Permit one anonymous outcome per verified/resolved saved claim; apply anomaly detection, moderation/review, and audit logs before using it in guidance or public social proof.
3. Use broad cohorts and confidence/sample indicators when data is sparse. Never imply an amount is guaranteed.
4. Minimise ticker data: broad region/city threshold, rounded compensation values, optional delayed publication, and separate explicit consent/withdrawal.
5. Complete a production security review: Supabase RLS tests, CSP, dependency scan, secret scanning, file-upload threat model, incident response, backups, and monitoring.

**Acceptance criteria**

- Repeated/fabricated outcomes cannot alter a recommendation or ticker without review.
- Rate limits continue to apply across serverless instances and deployments.
- Security, privacy, and abuse test suites pass against a staging environment.

## Phase 5 — Complete the claim outcome loop

**Outcome:** Momo helps users move from draft to resolution, not only to copy/paste.

1. Provide official airline claim-channel links and a clear “I sent this” action; Momo never submits on the user's behalf.
2. Add response-date tracking, reminder notifications with consent, and a timeline status such as awaiting airline / offer received / resolved.
3. When appropriate, show sourced escalation information (for example, ADR/ombudsman routes) with jurisdiction and eligibility caveats.
4. Capture offer, requested amount, accepted amount, and resolution with a simple end-of-case flow.
5. Instrument outcome metrics: claim completion rate, response rate, resolution time, accepted value, source confidence, and user trust score.

**Acceptance criteria**

- A user has a clear, safe next action at every end state.
- Momo can measure whether it improved recovery or time-to-resolution without using private message content in analytics.

## Phase 6 — Establish the commercial wedge and data moat

**Outcome:** a focused B2B2C pilot that benefits users without compromising recommendations.

1. Create a partner offering for one initial segment: employer travel benefit, premium-card bank, or travel insurer.
2. Build a co-branded hosted flow and partner-safe reporting: activation, completed claims, verified recovery value, and privacy-safe aggregate outcomes.
3. Define transparent pricing: per covered traveller, per activated member, or per resolved claim. Do not introduce a consumer subscription.
4. Add a partner disclosure policy: referrals or commercial arrangements cannot change eligibility guidance or compensation recommendations.
5. Recruit one design partner and run a limited UK261 pilot with a written success metric.

**Acceptance criteria**

- One signed pilot or documented partner validation process exists.
- The pilot has an agreed success metric, data-processing agreement, support process, and user-facing commercial disclosure.

## Phase 7 — Evidence, legal readiness, and council re-review

**Outcome:** the score target is supported by proof, not aspiration.

1. Obtain a solicitor review of Terms, Privacy Notice, UK261 wording, claims-management boundary, escalation/referral model, and marketing claims.
2. Run a data-protection assessment for evidence uploads, AI processing, anonymous learning, and partner data sharing.
3. Run automated API/E2E/accessibility/security tests in CI, plus manual mobile and assistive-technology testing.
4. Recruit usability participants spanning first-time, young, and older users; measure completion, comprehension, and trust.
5. Re-run the six-person council using the live staging app, a blank-case journey, an airline-reply loop, a saved claim, and an outcome flow.

**Release gate**

- Average council score exceeds 9.0/10.
- Technical, 16-year-old, and 80-year-old reviewers each score 9.5/10 or above.
- No P0/P1 security, privacy, product-truthfulness, or accessibility issues remain.
- The team can demonstrate a measurable outcome metric and a focused partner/distribution hypothesis.

## Sequencing and dependencies

| Order | Workstream | Depends on |
|---:|---|---|
| 1 | Phase 0: honest journey and instrumentation | None |
| 2 | Phase 1: grounded reply generation | Phase 0 product contract |
| 3 | Phase 2: timeline and evidence persistence | Phase 1 message model, Supabase migration approval |
| 4 | Phase 3: blank intake and accessible workflow | Phase 0; integrate with Phases 1–2 as they land |
| 5 | Phase 4: integrity and production hardening | Phase 2 outcome/file model |
| 6 | Phase 5: send/track/resolve loop | Phases 1–3 |
| 7 | Phase 6: partner pilot | Phases 4–5 plus legal review |
| 8 | Phase 7: final validation and re-review | All prior phases |

## First implementation sprint

1. Replace the fixture-first start with separate **Start my case** and **View a sample** paths.
2. Design the claim event schema and Supabase RLS policies.
3. Connect the chat button to a constrained, structured Momo reply endpoint.
4. Add loading/error/source states and tests proving the latest airline reply changes the generated draft.
5. Add forward-stage gates and clear missing-information messages.
6. Add durable rate-limit infrastructure design before enabling persisted uploads/outcomes.

This sprint removes the council's two largest trust gaps: a chat that looks more intelligent than it is, and a saved claim that does not retain the user's real story.
