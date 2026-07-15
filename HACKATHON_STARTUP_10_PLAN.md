# Momo: 10/10 Hackathon and Startup Plan

## Outcome

Build Momo into the most trustworthy flight-disruption advocate in the **Apps for Your Life** track: a passenger turns an airline's vague response into a source-backed, editable next message in minutes.

The score target is **9.5+ in each internal review category**, not merely a high average. The app must remain simple enough for a first-time 16-year-old user and an 80-year-old user who is nervous about forms.

## Official-rule requirements that affect the build

This project fits **Apps for Your Life**. The official rules require a working/runnable project built with **Codex and GPT-5.6**, a public demonstration video under three minutes with audio that explains both, a working demo URL, repository access, a README describing the collaboration with Codex, and the main `/feedback` Codex Session ID. The judging criteria are equally weighted: technological implementation, design, potential impact, and quality of the idea. [Official rules](https://openai.devpost.com/rules)

### Non-negotiable decision

Keep deterministic code as the authority for legal scope, rule selection, compensation bands, and prohibited statements. Add **one narrow GPT-5.6 feature** that makes the product more useful but cannot alter a legal conclusion:

> **Explain Their Reply — GPT-5.6-assisted evidence gap analysis**

It receives only the deterministic decision receipt, approved source cards, and the latest airline reply. It returns strict JSON identifying the airline's asserted reason, missing evidence, and three plain-English questions. A validator rejects any unsupported fact, source, amount, legal assertion, threat, or guarantee. Momo's final advocate letter remains deterministic and receipt-backed.

This preserves the trust architecture while giving judges a genuine, visible GPT-5.6 capability to evaluate.

### Credit and cost guardrail

Request the Build Week free-credit allocation before the official request cutoff. Use it only for GPT-5.6 testing and the recorded demo. Add a hard environment switch:

- `MOMO_AI_MODE=deterministic` — no model requests; default for public demo reliability.
- `MOMO_AI_MODE=gpt56_review` — enables only the bounded reply-analysis route after the user explicitly asks for it.
- No Gemini runtime path in the judged build.
- Per-case request cap, input redaction reminder, server-side rate limit, audit metadata, and a deterministic fallback.

## Judge-proof product story

### One-sentence pitch

**Airlines have scripts. Momo gives passengers a source-backed case record, so a vague refusal becomes the exact evidence-led next message.**

### The unforgettable demo moment

1. Paste: “We cannot compensate you because of operational circumstances.”
2. Momo shows the confirmed route, governing rule pack, possible amount, unknown cause, and official source.
3. GPT-5.6 highlights the missing evidence in plain English.
4. Momo produces a firm editable letter asking for the specific event, causal link, reasonable measures, and a reasoned review.
5. The user opens the proof map: every sentence is linked to a confirmed fact or reviewed rule card.

This is more memorable than “a chatbot wrote an email” and more credible than an ungrounded claims calculator.

## Build sequence

### Sprint A — Pass Stage One and make the demo unmissable

1. Add the bounded GPT-5.6 `Explain Their Reply` analysis with strict JSON schema, decision receipt, output validator, model/audit label, deterministic fallback, and no legal-decision authority.
2. Add a visible **Trust Receipt** after every assessment:
   - facts confirmed by the user
   - rules considered and version/review date
   - official source links
   - material unknowns
   - calculation rationale or explicit reason no amount is shown
3. Add a sentence-level **Proof Map** beside the editable letter.
4. Add a polished **Case Strength** card using plain language: `Strong next step`, `One detail needed`, `Different help may apply`, or `Outside Momo's current coverage`.
5. Add a short three-step promise to the landing page: `Check your rights → Build your evidence-led message → Track the airline reply`.
6. Create a real demo mode with safe, clearly-labelled fixtures. The sample must never stall and must require no login or API key.

**Acceptance gate:** an unfamiliar judge can complete the sample journey in under two minutes and see Codex + GPT-5.6's distinct contributions without reading documentation.

### Sprint B — Make UK/EU assessments defensible

1. Replace broad self-declared regions with departure/arrival airport or country fields and an operating-carrier identity field. Keep a manual “I don't know” route.
2. Add a country/airport normalizer and explain its result before the user confirms it.
3. Add an itinerary model: each leg, operating carrier, final destination, single booking vs self-transfer, passenger count, and prior settlement/benefit.
4. Extend deterministic rule packs, source cards, and tests for:
   - cancellation notice timing, refund/reroute choice, reroute arrival timing, and care
   - denied boarding: involuntary denial, check-in, valid documents, volunteer distinction, and reroute reduction
   - missed connections on one booking vs separate tickets
   - reasonable care/expense reimbursement independent of compensation
   - extraordinary-circumstances evidence, causal link, and reasonable-measures request
5. Add UK/EU overlap and no-double-recovery guardrails.
6. Keep fixed compensation hidden when a required fact is missing or a route/re-routing reduction cannot be assessed.

**Acceptance gate:** 100 adjudicated-style fixtures with expected scope, state, source cards, allowed requests, and compensation/no-compensation outcome. Every active card uses a primary source and is versioned.

### Sprint C — Make the UX genuinely effortless

1. Replace legal-region terminology with friendly questions:
   - “Which airport did you leave from?”
   - “Where did you finally arrive?”
   - “Which airline actually operated the disrupted flight?”
2. Show only the next needed question. Explain why it matters in one short sentence.
3. Ensure all required scope facts are visibly required before “What Momo found.” Never count “I’m not sure” as confirmed.
4. Increase helper/progress/timestamp text to at least 16px; enforce 44px controls, keyboard navigation, focus states, 200–400% zoom reflow, reduced motion, and a pause control for the ticker.
5. Add `Explain simply`, `Make this shorter`, and `What does this mean?` controls. These must preserve the deterministic conclusion.
6. Make “Paste reply → Ask Momo” the clear primary action; retain “Save without analysing” as secondary to prevent duplicate messages.
7. Add an airline-reply privacy reminder and character count.

**Acceptance gate:** moderated 16-year-old and 80-year-old users each complete the core journey without assistance and accurately explain Momo’s next action and uncertainty.

### Sprint D — Build startup credibility without diluting the hackathon

1. Add an optional **Evidence Bundle**: a downloadable/shareable claim packet containing confirmed facts, timeline, rule cards, official links, expense checklist, and the editable letter. No legal representation language.
2. Add resolution tracking: sent, awaiting airline, offer received, accepted/rejected, resolved. Ask for anonymous outcome sharing only after resolution.
3. Improve outcome quality: one outcome per resolved owned claim, moderation, broad cohorting, minimum sample size, confidence labels, opt-in/withdrawal, and no private content in analytics.
4. Turn `/partners` into a pilot page with one clear CTA, employer/bank/insurer value story, privacy/security summary, aggregate metrics mock, and per-resolved-case value proposition.
5. Define a single initial pilot: **UK employer travel benefit** or **premium-card travel protection**. Use one metric: verified recovery value or time-to-resolution.
6. Keep startup-only features behind feature flags until after the judging demo; they must not make the core flight-reply journey feel overloaded.

**Acceptance gate:** Momo can explain its consumer value, data boundaries, revenue model, and one partner-pilot metric in under 30 seconds.

### Sprint E — Production and submission readiness

1. Replace in-memory limits with a durable Vercel/KV/Supabase-backed limiter. Keep Vercel Firewall/WAF rules for public paths.
2. Enforce upload quarantine/malware scan, private storage, signed URL expiry, MIME/content checks, and cross-user RLS tests.
3. Add rule-card expiry CI: fail build if an in-force card is overdue for review or lacks a primary source.
4. Create a source-review audit log and change report: reviewer, reason, effective date, test impact, source URL.
5. Add E2E, accessibility, security, cross-user RLS, rate-limit, and adverse-input test suites to CI.
6. Obtain solicitor and privacy/data-protection review before any public commercial launch. Do not hold this out as legal advice in the hackathon demo.

## Judge-facing submission package

### README

Include:

- problem, audience, and why generic chat is unsafe here
- architecture diagram: evidence → confirmed facts → deterministic rule engine → bounded GPT-5.6 reply analysis → deterministic proof-mapped draft
- exact GPT-5.6 role, safeguards, fallback, and cost controls
- Codex contribution log: architecture, test generation, security review, UI iteration, and source-library workflow
- local setup, environment variables, demo mode, test command, and production URL
- a clear “new during Build Week” changelog with dated commits/session evidence

### Three-minute video structure

| Time | What judges see | Criterion served |
|---:|---|---|
| 0:00–0:20 | Stressed traveller gets a vague airline refusal; Momo's promise | Impact + idea |
| 0:20–1:15 | Sample case: sources, scope, uncertainty, amount where safe | Design + impact |
| 1:15–2:00 | Explain Their Reply: GPT-5.6 evidence-gap analysis with guardrails | Technology |
| 2:00–2:35 | Proof Map and deterministic advocate message | Design + quality |
| 2:35–3:00 | Startup wedge: anonymous outcome intelligence and B2B2C pilot | Impact + idea |

### Submission checklist

- [ ] Apps for Your Life category selected
- [ ] Hosted, working judge URL and a no-login sample path
- [ ] Public or properly shared repository
- [ ] README explains Codex and GPT-5.6 contribution
- [ ] Main `/feedback` Codex Session ID added
- [ ] Public YouTube video under three minutes, English audio, no unlicensed music/trademarks
- [ ] No user PII, booking references, private airline emails, or unlicensed third-party content in video/screenshots
- [ ] All instructions in English; demo credentials/instructions if needed
- [ ] Final demo tested in a clean browser and on mobile

## Scorecard and release gates

| Dimension | Target | Proof required |
|---|---:|---|
| Technological implementation | 9.6 | Bounded GPT-5.6 feature, deterministic legal engine, provenance, tests, Codex evidence |
| Design | 9.6 | Two-minute judge path, accessible blank flow, proof map, no dead ends |
| Potential impact | 9.5 | Specific UK/EU post-rejection wedge, user outcome metric, partner-pilot story |
| Quality of idea | 9.5 | Case graph + outcome intelligence moat, distinct from generic chat/claim calculators |
| Legal quality | 9.5 | Reviewed primary sources, country/carrier verification, full fact gates, conservative fallback |
| Security/privacy | 9.5 | Durable limits, RLS/upload tests, consented anonymous outcomes, source audit trail |
| Teen usability | 9.5 | Moderated completion and comprehension test |
| Older-adult usability | 9.5 | Keyboard, zoom, screen-reader, readable controls test |

No release is considered 9.5+ if a legal amount is generated from unconfirmed scope facts, a model may alter the legal conclusion, a source is stale, a user can see another user's data, or the demo cannot run without credentials/paid calls.

## Startup recommendations that help, rather than hurt, judging

- **Business model:** B2B2C travel benefit for employers, premium-card banks, insurers, and booking partners. Charge per covered traveller, activated member, or resolved claim—not a consumer subscription.
- **Trust policy:** commercial partners never alter Momo’s eligibility guidance, compensation recommendation, or source selection.
- **Data moat:** private case data stays private; consented, de-identified, moderated outcomes form a separate offer-pattern dataset with cohort confidence—not a legal database.
- **Initial wedge:** UK261 post-airline-rejection support for UK-based travellers. Win one route before expanding country packs.
- **Pilot pitch:** “Give travellers a clear next step in minutes, while your organisation sees only privacy-safe recovery and resolution metrics.”

## Priority order

1. Request Hackathon credits; enable bounded GPT-5.6 feature and record its role.
2. Build Trust Receipt, Case Strength, Proof Map, and pristine no-login demo.
3. Complete airport/carrier normalization and delay/cancellation/denied-boarding fact gates.
4. Create the 100-fixture quality suite, submission README, and three-minute video.
5. Add production hardening and partner-pilot materials after the core demo is judge-proof.

This order maximises the equally weighted judging criteria without sacrificing the startup’s long-term trust advantage.
