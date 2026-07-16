# Momo Fresh Council Action Plan

_Created from the fresh 10-reviewer council and a new browser end-to-end run on 16 July 2026. Earlier ratings are not used here._

## Goal

Lift Momo from a strong but feature-dense **8.0/10** product to a focused, trustworthy claim companion. The next release should make the first useful result faster, every Help path truthful, and the production foundations safe enough for a real pilot.

## Product decision

Momo's primary promise remains: **help a passenger turn a flight disruption or airline refusal into a clear, evidence-led next step.**

- Lead with UK/EU claim support.
- Describe Canada, US, Singapore, and hub guidance as selective, clearly labelled support—not universal legal coverage.
- Keep deterministic rules authoritative for eligibility and amounts; Momo's AI reads and explains evidence but cannot decide legal entitlement.
- Do not add more country packs or partner features until the core claim-completion loop is faster and proven.

## Prioritised build sequence

### Sprint 1 — Honest Help and fast first value

**Why first:** Six visible Help cards currently promise tailored help but enter the generic facts screen. This is the most repeated council finding.

1. Give every Help card a real destination and an introductory sentence:
   - `rejection` -> airline-reply conversation with a prompt to paste/upload the refusal.
   - `offer` -> offer comparison with a clear “what was offered?” prompt.
   - `expenses` -> care/receipts checklist, then relevant claim facts.
   - `lookup` -> flight number/date lookup expanded first.
   - `international` and `hub` -> airport-led intake and a plain coverage explanation.
2. Add a **Quick start** to the landing page: “Paste an airline reply”, “Upload a screenshot”, “Enter a flight number”, or “Tell Momo what happened”.
3. Make flight number/date or pasted airline text the preferred starting point. Ask route, operator region, distance, and connection facts only when they materially change the answer.
4. Repair the flight-delay helper wording so it describes the actual text entry control.
5. Add browser tests for every Help route and the quick-start choices.

**Acceptance criteria**

- Each Help link opens an observable, topic-specific starting state.
- A first-time user can reach an initial useful next step without completing seven fields.
- Desktop and 375px mobile browser tests cover all Help paths.

### Sprint 2 — Close the claim loop

**Why second:** The best retention feature is a case that guides the user after they copy the first message.

1. Make the claim command centre the single next-action panel: `draft ready`, `sent`, `waiting`, `offer received`, `resolved`, or `not resolved`.
2. For signed-in users, add opt-in follow-up dates and reminders at 7/14 days; never send reminders without consent.
3. Add a visible timeline: sent date, latest airline reply, requested response date, next action, and any escalation route.
4. Build a “business trip” branch: passenger vs claim owner, employer-paid expenses, downloadable receipt/evidence checklist, and follow-up date.
5. Make outcome capture currency-aware end to end. Never force a GBP outcome when the case is CAD, USD, EUR, or SGD.

**Acceptance criteria**

- A saved signed-in claim can be reopened and has exactly one clear next action.
- A user can mark a claim sent, receive a consented reminder, add a later airline reply, and record resolution without re-entering the case.
- Tests cover every claim state and currency-safe outcome capture.

### Sprint 3 — Accessibility, clarity, and brand polish

1. Make authentication dialogs keyboard-complete: initial focus, focus trap, Escape close, return focus to trigger, and inert background.
2. Add a skip-to-content link; mark the current workflow step with `aria-current`; show field-level missing-detail guidance and an accessible error summary.
3. Add a pause control for the Momo scene/ticker and fully respect `prefers-reduced-motion`.
4. Simplify the result page above the fold to: **next action**, **possible amount/currency when safe**, and **why Momo thinks this**. Move care, work, escalation, and community modules into progressive disclosure.
5. Establish consistent button variants and 44px minimum targets. Label external official-source links as opening in a new tab.
6. Replace emoji-only Momo scenes with a small custom SVG pose set after the workflow changes are complete; retain one static no-motion pose.

**Acceptance criteria**

- Keyboard-only user completes login, a sample claim, and the Help page without a focus escape.
- 200% zoom and 375px checks have no clipped controls or horizontal scroll.
- A user can explain the next action after viewing the result in under 15 seconds.

### Sprint 4 — Production safety, privacy, and legal governance

1. Replace process-memory rate limits with durable per-IP and per-user limits (Vercel WAF plus Upstash/KV or equivalent). Cover auth, claims, Momo explanation, evidence reading, flight lookup, outcomes, and research routes.
2. Limit claim creation per user and validate/allow-list persisted `caseData` fields and sizes.
3. Move all Supabase SQL into ordered, versioned migrations; add a staging check that required migrations and RLS policies are present.
4. Add an upload quarantine plan: re-encode images, scan/quarantine PDFs, retain private storage, and only use expiring signed URLs. Do not render untrusted documents inline.
5. Publish a real Privacy Notice before public launch: controller/contact, purpose, lawful basis, retention, deletion/export, processors, international transfers, and OpenAI evidence-reading disclosure.
6. Tighten legal content governance: owner, reviewed date, expiry behaviour, primary-source snapshots, changelog, and automated expiry tests. Treat Switzerland separately from EU/EEA where rules differ.
7. Add browser E2E, RLS cross-user, rate-limit, auth, upload, provider-unavailable, and mobile smoke tests to CI.

**Acceptance criteria**

- Rate limits persist across serverless instances and cannot be bypassed by a spoofed forwarded-IP header.
- Staging tests prove one user cannot read/write another user's claims or evidence.
- Every user-facing evidence upload clearly explains OpenAI processing before submission.

## Startup and hackathon track (run in parallel, but do not clutter the core flow)

1. Align homepage copy with the actual coverage: UK/EU first, selected international guidance second.
2. Change sample CTA to an outcome: **“See a £350 claim example”** while retaining its visible demo label.
3. Add a privacy-safe event taxonomy: case started, facts confirmed, assessment viewed, reply added, draft generated, draft copied, claim saved, sent, resolved. Do not collect message text, booking references, or documents in analytics.
4. Add a low-pressure companion-share action only after value has been delivered; never gate claims or rewards on sharing.
5. Turn the partner page into one narrow pilot: UK employer travel benefit, bank, or insurer. Include a contact/pilot CTA, aggregate recovery/time-saved metric, and a clear commercial-disclosure policy.
6. Demo story: airline refusal -> Momo's source-backed uncertainty -> bounded AI evidence explanation -> editable reply -> claim timeline. Keep global rules and partner panels secondary.

## Council score targets for re-review

| Reviewer | Fresh score | Target after Sprints 1–4 | Primary proof |
|---|---:|---:|---|
| Accessibility / older user | 7.4 | 9.0 | Keyboard, reduced-motion, zoom, and Help-route tests |
| Frequent traveller | 7.5 | 9.0 | Paste-first quick start and business-trip follow-up |
| Legal / compliance | 7.8 | 9.0 | Privacy Notice, coverage precision, governance |
| Product manager | 8.0 | 9.2 | Faster intake and closed claim loop |
| Growth | 8.0 | 9.0 | Aligned scope and a credible pilot CTA |
| Design | 8.1 | 9.0 | Simplified results and owned Momo illustration |
| Technical / QA | 8.1–8.2 | 9.3 | Durable limits, migrations, CI E2E/RLS tests |
| YC | 8.4 | 9.1 | Pilot evidence, KPI dashboard, production posture |
| Teen user | 8.6 | 9.2 | Conversational quick start and lower friction |

## Implementation order

1. Sprint 1, including Help-route browser tests.
2. Sprint 3 accessibility fixes that directly affect Sprint 1 screens.
3. Sprint 2 claim loop and reminders.
4. Sprint 4 production safety/privacy work before public launch.
5. Startup/hackathon assets once the quick path is demonstrably smooth.

## Release gate

Do not market Momo as production-ready until all Sprint 4 acceptance criteria are met. For a hackathon demo, the required minimum is: a pristine no-login sample, working guided Help paths, a visible deterministic evidence trail, one bounded AI reply example, and clear demo/coverage labels.
