# Momo production security checklist

- Run `supabase/schema.sql`, `supabase/storage.sql`, `supabase/community-insights.sql`, `supabase/social-proof.sql`, `supabase/claim-timeline.sql`, and `supabase/outcome-hardening.sql` in that order.
- Add production-only server secrets in Vercel: `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `AERODATABOX_RAPIDAPI_KEY`. Never use `NEXT_PUBLIC_` for these values.
- Enable Vercel WAF rules for `/api/*`, and durable rate limits (Vercel Firewall or Redis/KV) for login, registration, password reset, Momo reply generation, uploads, and outcome submissions.
- Keep Supabase storage bucket `case-evidence` private. Do not make claim evidence public.
- Before public launch, add malware scanning/quarantine to the evidence-upload pipeline. The app currently validates size, MIME type, and file signatures, but these do not replace malware scanning.
- Run dependency updates, secret scanning, RLS policy tests, E2E accessibility checks, and an external legal/privacy review before launch.
