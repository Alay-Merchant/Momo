# Momo Regulation Library & Case Advocate Plan

## Purpose

Make Momo's answers specific, source-backed and useful in a real airline dispute. Momo should identify the rules that may apply, state what evidence is missing, calculate only where the rules and facts permit it, and draft a calm, firm response a passenger can edit and send.

**Product position:** Momo is a case-advocacy and drafting tool, not a solicitor, law firm, claims-management company, or a guarantee of compensation.

## The standard

"Lawyer-grade" means:

- Every material assertion is traceable to a reviewed primary source or a confirmed user fact.
- Momo distinguishes facts, airline assertions, open questions and rule-based inferences.
- Momo never pretends the passenger has legal representation, threatens action without a basis, or states that compensation is guaranteed.
- Correspondence is precise and confident: it requests a reasoned reassessment, the factual basis for a refusal, and the applicable remedy.
- A user can inspect the source, rule version and facts that were used before copying a draft.

It does **not** mean bluffing, intimidation, fabricated citations, or giving legal advice.

## Initial launch scope

### In force: UK and EU rights packs

1. **UK261** — UK departures and qualifying inbound journeys, delay, cancellation, denied boarding, missed connections, assistance/care, rerouting/refund, and compensation assessment.
2. **EU261** — EU/EEA/Swiss coverage where the route and operating-carrier conditions are met. Support the same disruption categories, with the relevant Euro compensation structure and care/re-routing rights.
3. **UK and EU escalation paths** — official airline-complaint, ADR/ombudsman and national-enforcement information only where the route is confidently applicable.

### Explicitly out of scope until a researched pack exists

- Rules for non-UK/EU jurisdictions.
- Court procedure, limitation periods, litigation strategy, or representations that a passenger is legally represented.
- Pending or proposed reforms. A reform remains `under_review` and cannot affect an assessment until its effective date is independently confirmed.

## Official source policy

The source library starts with primary/public-authority material:

- UK Civil Aviation Authority: [flight delays and cancellations](https://www.caa.co.uk/air-passengers/travel-problems-and-rights/flight-delays-and-cancellations/delays/)
- UK Civil Aviation Authority: [compensation eligibility](https://www.caa.co.uk/air-passengers/travel-problems-and-rights/travel-complaints/making-a-claim/am-i-entitled-to-compensation/)
- European Union: [Your Europe air-passenger rights](https://europa.eu/youreurope/citizens/travel/passenger-rights/air/index_en.htm)
- European Commission: [air passenger rights](https://transport.ec.europa.eu/transport-themes/passenger-rights/air_en)

Secondary summaries, airline webpages, law-firm blogs, and crowd-sourced claim outcomes may inform search terms or practical questions, but must never become a legal rule or eligibility source.

## Build phases

### Phase 1 — Structured, versioned rule library

Create a `regulations` domain module with immutable rule-card versions. Each card contains:

- `id`, `version`, `framework`, `status`, `effectiveFrom`, `reviewedAt`, `reviewDueAt`
- legal applicability conditions in code-readable form
- supported disruption types and available remedies
- compensation band/range metadata, currency, and calculation conditions
- exceptions and unresolved-fact requirements
- official source title, URL, exact relevant section/summary and source-check date
- plain-English explanation and a formal drafting proposition permitted by the rule

Keep calculation facts separate from prose. The model receives only selected, in-force cards and cannot invent another rule.

**Checkpoint:** Every UK261 rule currently embedded in `flight-rules.ts` is represented by a versioned source card; the existing result screen still produces the same outcome for current UK fixtures.

### Phase 2 — Applicability and remedy engine

Replace the current UK-only default with a deterministic decision engine. It will require or ask for:

- departure and final-destination countries/airports
- operating carrier (not just the booking brand)
- connection itinerary and booking structure
- disruption type, scheduled and actual final-arrival time
- notification timing for cancellations, re-routing details, and denied-boarding reason where relevant
- airline's stated cause and evidence, retained as an allegation until assessed

The engine returns one of: `NEEDS_DETAIL`, `OUT_OF_SCOPE`, `POSSIBLE_RIGHTS`, `LIKELY_WORTH_PURSUING`, or `DIFFERENT_REMEDY_PATH`. It also returns applicable rule IDs, material unknowns, permitted requests, prohibited assertions, and the source set.

**Checkpoint:** Momo does not show a UK amount for an EU-only flight, does not call a non-covered journey eligible, and gives a clear next question rather than guessing.

### Phase 3 — Evidence and refusal analysis

Create an evidence map for every response:

| Evidence type | How Momo treats it |
|---|---|
| Passenger-confirmed flight detail | A confirmed case fact |
| Boarding pass, booking, receipt or airline message | Evidence with its source and date |
| Airline explanation | The airline's assertion, not automatically a proven fact |
| Official regulation card | A reviewed rule source |
| Anonymous community outcome | Non-binding market context only |

For each airline refusal, Momo will identify what it says, what it does not establish, which question is fair to ask next, and which evidence would make the next message stronger. It must not label an airline dishonest or decide that an "extraordinary circumstance" is disproven without sufficient material.

**Checkpoint:** A vague refusal such as "operational circumstances" produces a request for the specific event and its effect on the journey, while a detailed evidence-backed refusal produces a proportionate response.

### Phase 4 — Case Advocate drafting system

Replace generic templates with structured drafting inputs and three tone modes:

1. **Clear and friendly** — a plain-language first request.
2. **Firm and evidence-led** — the default after a refusal; names confirmed facts, relevant rules and asks for a reasoned review.
3. **Formal escalation-ready** — only where the case has reached the relevant official escalation step; includes factual chronology and sourced next action, never an empty threat.

Every draft has a visible "Why this sentence is here" proof map linking it to a confirmed fact or in-force source card. The UI includes a prominent explanation that the user must check, edit and send the message themselves.

**Checkpoint:** Drafts cite only provided official links, contain no invented case law or deadlines, do not promise an outcome, and change materially when the airline's reply changes.

### Phase 5 — Intelligence from anonymous outcomes

Keep the existing anonymous outcome system separate from the rule engine. Add quality gates before an outcome can influence a negotiation range:

- only a signed-in claim owner can report one outcome for a resolved case
- record requested amount, offer amount, accepted amount, airline, issue category, route cohort and date band
- remove names, booking references, message text, flight number and exact travel date before aggregation
- require a minimum cohort size and display sample size, date range and confidence label
- cap insight wording to: "recent anonymous reports suggest offers in this range"; never "the airline owes this"

**Checkpoint:** A single fabricated report cannot influence advice or public proof; low-sample data is hidden or marked as insufficient.

### Phase 6 — Source governance and review

Add a reviewer workflow and audit log:

- `in_force`, `under_review`, `expired`, and `superseded` rule-card states
- source re-check schedule: monthly for high-impact compensation/applicability rules; quarterly for all other cards; immediate review after an official change notice
- manual approval required to publish a changed rule card
- a deployment report listing changed cards, source links, tests affected, reviewer and review date
- safe fallback: if no current card matches, say Momo cannot make a rule-based assessment yet and show official resources

**Checkpoint:** Rule changes cannot silently alter live recommendations; stale cards are excluded from compensation calculations.

### Phase 7 — Quality, safety and test suite

Build a deterministic test matrix before expanding jurisdiction:

- 20 UK/EU cases spanning delay, cancellation, denied boarding, missed connection, rerouting, care expenses, vague refusals and out-of-scope routes
- boundary tests for 2h59 vs 3h00 final-arrival delay, distance bands, currency, connection/booking uncertainty, operating-carrier uncertainty and cancellation-notice timing
- prompt-injection tests embedded in airline emails and uploads
- source tests: every active card has an HTTPS official URL, review date, status and no future/pending rule in calculations
- draft tests: no unsupported demand, no legal-representation claim, no threat, no promise, no fabricated citation
- user tests: a 16-year-old and an 80-year-old can tell what is fact, what is uncertain, and what to do next

**Checkpoint:** CI blocks a release if rule selection, allowed-claim controls, source metadata, or formal-draft safeguards regress.

## Technical changes

1. Introduce `src/lib/regulations/` for cards, schemas, source metadata, selector and calculators.
2. Evolve `FlightCase` to store structured route, operating-carrier and itinerary facts without exposing unnecessary personal data.
3. Preserve `flight-rules.ts` as an adapter during migration; remove the UK-only default only when all existing tests have equivalent coverage.
4. Extend `/api/momo/explain` to accept the deterministic decision receipt, selected rule-card summaries, allowed requests and source list. It must reject a prompt that tries to override them.
5. Render a Trust Receipt: framework considered, rule-card version(s), source links, facts used, material unknowns, calculation status and last checked date.
6. Add Supabase tables only for rule-card versions/audit records if we need an admin review workflow. Checked-in rule cards remain the safer v1 source of truth because they are code-reviewed and deploy-versioned.

## Recommended delivery order

1. Rule-card data model and UK261 migration.
2. Applicability questions and deterministic UK/EU selector.
3. EU261 rule pack and Euro calculations.
4. Trust Receipt and source UI.
5. Firm evidence-led drafting and proof map.
6. Anonymous-insight quality gates.
7. Source review workflow, 20-case test suite and production release checklist.

## Success measures

- At least 95% of fixture assessments select the expected framework/state.
- 100% of compensation outputs include a current primary source and calculation rationale.
- 0 draft tests contain unsupported threats, legal-representation claims, invented sources or compensation guarantees.
- Users can identify their next action and the key uncertainty in moderated testing.
- Recommendation quality rises because Momo can say exactly what to request, not merely advise a user to "contact the airline".

## Voice guide for Momo

Use: "Based on the confirmed facts, please review whether UK261/EU261 applies and explain the specific circumstances relied on for your decision. Please also confirm the basis for any conclusion that compensation is not payable."

Avoid: "My lawyer will take action", "You have broken the law", "Pay me immediately", or any statement that assumes a disputed fact is proven.

The goal is to make the airline see a well-organised, evidence-conscious passenger who knows what information to request — not to bluff or antagonise the person handling the case.
