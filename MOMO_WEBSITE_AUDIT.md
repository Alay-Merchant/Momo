# Momo Website Functional Audit

**Audit date:** 19 July 2026  
**Scope:** Current local workspace, production build, automated tests, source-level workflow review, and safe negative-input checks.  
**Change policy:** No application code or configuration was changed during this audit. This report file is the only new file.

## Result summary

| Outcome | Count | Meaning |
| --- | ---: | --- |
| Pass | 20 | Behaviour was covered by automated tests, production build, or clear implementation review. |
| Bug | 6 | Reproducible defect or an inconsistent user-facing behaviour. |
| Needs live verification | 8 | Requires a real Supabase account, confirmation/reset email, OpenAI credit, flight-data provider response, or a browser session that can access localhost. |
| Environment limitation | 1 | The audit browser could not reach this machine's local development server; this does not by itself indicate an application defect. |

## Test evidence

| Check | Result | Evidence / notes |
| --- | --- | --- |
| Unit and safety test suite | Pass | `npm test` completed: **213 passed, 0 failed**. Coverage includes rules boundaries, request limits, outcome anonymisation, upload signatures, structured reply validation, help routing, story extraction, and text encoding. |
| Lint | Pass | `npm run lint` completed without errors or warnings. |
| Production build | Pass | `npm run build` completed successfully and generated all listed application/API routes. |
| Browser-driven local UI testing | Environment limitation | The browser automation environment received `ERR_CONNECTION_REFUSED` for `http://localhost:3000`, even when a shell-local server briefly returned HTTP 200. The local server process is not retained between isolated audit commands. No visual clicks were falsely marked as tested. |

## Public pages and navigation

| Area / workflow | Method | Result | Finding or known fix |
| --- | --- | --- | --- |
| Homepage loads in production build | Build | Pass | Root route is generated successfully. |
| Brand button returns to the homepage/start screen | Source review | Pass | Button calls `setScreen("start")`. |
| Help button opens `/help` | Source review + build route | Pass | Link is present and `/help` builds. |
| Help topic: delay | Source review + automated guidance test | Pass | Routes to the tailored facts flow with a delay case. |
| Help topic: cancellation | Source review + automated guidance test | Pass | Routes to cancellation facts and exposes cancellation-only fields. |
| Help topic: missed connection | Source review + automated guidance test | Pass | Routes to facts flow with connection guidance. |
| Help topic: denied boarding | Source review + automated guidance test | Pass | Routes to facts flow with boarding-specific fields. |
| Help topic: airline refusal | Source review + automated guidance test | Pass | Routes directly to the reply analysis flow rather than generic facts. |
| Help topic: airline offer | Source review + automated guidance test | Pass | Routes to results/offer flow; a next-step card points the user to flight facts for an actual comparison. |
| Help topic: expenses, international, hub, lookup | Source review + automated guidance test | Pass | Each visible help topic has a registered tailored guide and destination. |
| Terms & privacy link | Build + source review | **Bug — Medium** | The Terms page brand icon renders the literal word **“Panda”** instead of the Momo icon. **Known fix:** use the same safe panda entity/component used elsewhere. |
| Terms version recorded at sign-up | Source review | **Bug — High** | The page displays Terms version `2026-07-17`, but registration stores `terms_version: "2026-07-15"`. This weakens the audit trail for consent. **Known fix:** define one shared Terms version constant and use it in both locations. |
| Partners page | Build + source review | **Bug — Low** | The page contains visible character corruption (`ðŸ¼`, `âœ¦`) in source; the output may show broken icon text. **Known fix:** use Unicode escapes/HTML entities or shared icon components. |
| Password-reset page | Build + source review | **Bug — Low** | The page contains the same broken panda sequence in source. **Known fix:** replace with the safe emoji entity/component. |

## Core claim journey

| Area / workflow | Method | Result | Finding or known fix |
| --- | --- | --- | --- |
| Start a new case | Source review | Pass | Resets case facts, conversation, draft, active guide, and claim state. |
| Load sample case | Source review | Pass | Loads fixture facts and message without sending a claim. |
| Required fact gating | Automated rule tests + source review | Pass | Results/reply cannot be opened until the seven required assessment facts are present. |
| Optional / add-if-known labels | Source review | Pass | Field classifications are explicit and the distance field remains optional. |
| Story text storage | Source review | Pass | The original story is stored as the private `traveller_story` fact. |
| Story → AI fact extraction | Automated parser test + source review | Needs live verification | The primary **Use this story** action calls `/api/momo/extract-story`, accepts only bounded allowed fields, marks them “please check,” and falls back to basic matching. A successful live OpenAI response was not run to avoid charging the API during this audit. |
| Story → basic extraction fallback | Automated test + source review | Pass | Flight number, delay, one-booking, connection and diversion patterns are extracted conservatively. |
| Story with no safely extractable details | Source review | Pass | Story is retained and user receives a clear prompt to complete required fields. |
| Airport helper buttons | Source review | Pass | Common airport buttons write the selected three-letter code through the shared fact update path. |
| Arrival delay hours/minutes | Source review | Pass | Delay field uses bounded hours/minutes conversion; manual lookup accepts `2h 30m`. |
| Public flight lookup, invalid/missing details | Source review + input validation test | Pass | Server rejects missing/invalid number/date cleanly; client provides manual-delay path. |
| Public flight lookup, provider result | Needs third-party live call | Needs live verification | Requires a valid AeroDataBox/RapidAPI response. No paid/provider call was made. |
| Deterministic UK/EU assessment and amount gates | 213-test suite | Pass | Tests cover UK/EU scope, delay thresholds, distance bands, cancellations, denied boarding, uncertainty, and no-guess boundaries. |
| International guidance / currencies | Automated tests + source review | Pass | Canada, US, Singapore and uncovered hubs use separate guidance and do not invent fixed payments. |
| Offer Compass: GBP/EUR/USD/CAD/SGD/custom code | Source review | Pass | User can select a defined currency or enter a three-letter code; differing currencies are not compared as equal. |
| Offer comparison per-person clarity | Source review | Needs live/manual verification | It displays Momo's estimate as “per person,” but the offer itself has no passenger-count control. This is a product limitation rather than a crash; review whether offers are also per person before release. |

## Airline reply, evidence and drafting

| Area / workflow | Method | Result | Finding or known fix |
| --- | --- | --- | --- |
| Paste an airline reply | Source review | Pass | “Ask Momo for a reply” invokes analysis; “Save for later” only saves text and is now labelled as such. |
| Reply analysis safety | Automated tests | Pass | Unsupported legal/eligibility conclusions, invented quotes, amounts, threats and citations are rejected; deterministic receipt remains authoritative. |
| AI unavailable fallback | Source review + parser tests | Pass | Reply endpoint returns a deterministic, source-backed fallback rather than failing the user journey. |
| Three rejection demo cases | Source review + rejection tests | Pass | Technical/operational and weather-caution demonstrations are present. |
| Evidence upload type and signature protection | Automated tests + source review | Pass | Accepts only PDF/PNG/JPEG, checks size (3 MB) and verifies file signature before reading. |
| Evidence reader live extraction | Needs OpenAI call | Needs live verification | Requires a supported OpenAI vision/file request and a non-sensitive test file. Not exercised to avoid transmitting a file or spending API credit. |
| Editable final message and copy action | Source review | Pass | Draft remains editable; copy uses browser clipboard API. Clipboard permission behaviour needs one browser-local confirmation. |

## Account, consent, claims and password reset

| Area / workflow | Method | Result | Finding or known fix |
| --- | --- | --- | --- |
| Sign-up form fields and T&C checkbox | Source review | Pass | HTML validation requires valid email, 12–128 character password, and checked Terms checkbox; server repeats these checks. |
| Sign-up confirmation path | Needs real email/Supabase | Needs live verification | Would create an account and send confirmation email, so it was not run without an explicitly approved test account/email. |
| Sign-in validation | Source review | Pass | Generic error avoids disclosing whether an email exists. |
| Sign-in success/session restore | Needs real account | Needs live verification | Requires a test account and real Supabase session. |
| Forgot-password request | Needs real email/Supabase | Needs live verification | Endpoint is present, rate-limited, and returns a privacy-preserving message. Sending a reset email was not authorised for this audit. |
| Password reset page | Source review | Needs live verification | Client-side mismatch and password-length validation work in code; final update requires an active Supabase recovery session. |
| Auth modal keyboard behaviour | Source review | Pass | Focus moves to email on open, Escape closes, Tab is trapped, and close restores focus to the trigger. Browser keyboard interaction could not be visually exercised due to the localhost limitation. |
| Save a claim / continue saved claim | Source review + API security tests | Needs live verification | Auth/ownership checks and per-account cap are implemented; successful persistence requires a real signed-in account and database row. |
| Client error state for account actions | Source review | **Bug — Medium** | Account-panel submit/logout/withdraw calls do not catch network/JSON failures. A network outage can leave an unhandled error with no user message. **Known fix:** wrap each `fetch`/`json` sequence in `try/catch` and set a visible status message. |

## Community data, outcomes and research

| Area / workflow | Method | Result | Finding or known fix |
| --- | --- | --- | --- |
| Anonymous outcomes require opt-in and sign-in | Source review + community tests | Pass | Backend validates choice fields, explicit opt-in, amount bounds, and authenticated user. |
| “Not resolved” learning reason | Source review | Pass | UI makes a reason mandatory and backend accepts a controlled category only. |
| Outcome currency | Source review | **Bug — Medium** | The outcome form sends `currency: "GBP"` unconditionally and labels all amounts in GBP, despite offer/custom-currency support elsewhere. **Known fix:** add a currency selector/custom three-letter field and submit that selected value. |
| Public ticker consent option | Source review | **Bug — Medium** | The UI offers “show a short anonymous win,” but the backend always rejects it because public sharing is paused. **Known fix:** disable/hide this checkbox with a “demo ticker only” explanation, or implement the verified opt-in publication path. |
| Anonymous patterns lookup | Source review | Needs live verification | Needs Supabase SQL functions/data. Empty/unconfigured state has a defined message. |
| Live official-source research | Source review | **Bug / configuration risk — Medium** | The route hard-codes `gpt-5.6-luna` rather than using the configured model variable, which can break deployments or bypass cost-control configuration. **Known fix:** use a dedicated environment variable with a validated default and record usage. |
| Client error state for community/outcome actions | Source review | **Bug — Medium** | `CommunityInsights` and `OutcomePanel` do not catch failed network requests/invalid JSON. Users may see no useful feedback during a network failure. **Known fix:** add `try/catch` and a clear retry message. |

## Security and resilience checks

| Check | Method | Result | Notes |
| --- | --- | --- | --- |
| Same-origin protection | Source review + request-security tests | Pass | State-changing routes check same origin. |
| Request body limits | Automated test + source review | Pass | JSON limits are enforced even when `Content-Length` is absent. |
| Input validation / allowlists | Automated tests + source review | Pass | Claim facts, outcome fields, story fields, flight numbers/dates and reply-analysis schema are constrained. |
| Prompt injection / unsupported claim outputs | Automated tests | Pass | Momo limits the task domain and rejects unsafe model output. |
| Evidence signatures | Automated test | Pass | File bytes are checked rather than trusting MIME type alone. |
| Rate limiting | Source review | Needs production verification | Current limiter is in-memory and is explicitly documented as a local safety belt. Configure durable Vercel/Upstash limits before public launch. |
| Secrets in source | Build/source review | Pass | No key values were written into this report or found in committed source during this audit. |

## Recommended priority order

| Priority | Issue | Why it matters |
| --- | --- | --- |
| P0 | Align Terms display version and accepted version | Consent records must identify the exact terms the user accepted. |
| P1 | Fix all public-page icon/text corruption | Terms, reset and partner pages should look professional and consistent for judges/users. |
| P1 | Add user-facing fetch failure handling | Prevents silent failures in sign-up, outcomes and account management. |
| P1 | Make outcome currency selectable | Prevents incorrect anonymous learning data for non-GBP journeys. |
| P2 | Hide/disable the currently paused public-ticker consent option | Avoids offering an action that is guaranteed to fail. |
| P2 | Make live-research model configurable | Keeps deployment model choice and spend under the configured control. |
| P2 | Run a live smoke test with a dedicated test mailbox and non-sensitive PDF | Verifies Supabase confirmation/reset, OpenAI story/evidence, persistence, and provider lookup end to end. |

## Not performed deliberately

- No account was created, no confirmation/reset email was sent, and no password was changed.
- No personal or airline evidence file was uploaded.
- No paid OpenAI research/evidence/story call or paid flight-data call was intentionally made.
- No database rows, claims, outcomes, ticker entries, or settings were modified.

