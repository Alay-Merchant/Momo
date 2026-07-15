# Rule-source review log

Momo only uses checked-in `in_force` rule cards with a primary official source, a review date, and a future review deadline. A release test fails if an active card is overdue, lacks HTTPS source metadata, or has an effective date in the future.

## Review record

| Review date | Pack | Reviewer action | Impact |
|---|---|---|---|
| 2026-07-15 | UK261 and EU261 initial packs | Cross-checked the selected public-authority source links and compensation/scope boundaries in the deterministic tests. | Rule cards `UK261_SCOPE_01`, `UK261_DELAY_03`, `EU261_SCOPE_01`, `EU261_DELAY_03`; boundary tests updated. |

## Change procedure

1. Record the official source URL and the effective date.
2. Add a new versioned card or mark the former card `superseded`; do not overwrite history without a review note.
3. Add or amend deterministic fixtures for every changed legal outcome.
4. Run `npm test`, lint, and production build before deployment.
5. If no current official source supports a rule, mark it under review and remove it from live calculations.
