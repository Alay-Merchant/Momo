import { NextRequest, NextResponse } from "next/server";
import { cleanEmail, rateLimit, validPassword } from "@/lib/auth-store";
import { createSupabaseRouteClient, userPayload } from "@/lib/supabase-server";
import { clientIp, jsonBody, sameOrigin } from "@/lib/request-security";
import { MOMO_TERMS_VERSION } from "@/lib/legal";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request was blocked for safety." }, { status: 403 });
  if (!rateLimit(`register:${clientIp(request)}`)) return NextResponse.json({ error: "Please wait before trying again." }, { status: 429 });
  const parsed = await jsonBody(request, 2_000); if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 }); const body = parsed.body as { email?: unknown; password?: unknown; termsAccepted?: unknown };
  const email = cleanEmail(body?.email);
  if (!email || !validPassword(body?.password)) return NextResponse.json({ error: "Use a valid email and a password of at least 12 characters." }, { status: 400 });
  if (body?.termsAccepted !== true) return NextResponse.json({ error: "Please read and accept Momo's Terms to create an account." }, { status: 400 });
  const response = NextResponse.json({ ok: true }, { status: 201 });
  const supabase = createSupabaseRouteClient(request, response);
  const { data, error } = await supabase.auth.signUp({ email, password: body.password, options: { emailRedirectTo: new URL("/", request.url).origin, data: { terms_accepted: true, terms_version: MOMO_TERMS_VERSION } } });
  if (error) {
    const isEmailRateLimit = /rate limit|too many requests/i.test(error.message);
    return NextResponse.json({ error: isEmailRateLimit ? "Supabase has temporarily paused confirmation emails. For local testing, turn off Confirm email in Supabase Authentication → Providers → Email, then try again." : error.message }, { status: isEmailRateLimit ? 429 : 400 });
  }
  if (!data.session || !data.user) return NextResponse.json({ needsEmailConfirmation: true, message: "Check your email to confirm your account, then sign in." }, { status: 202 });
  return NextResponse.json({ user: await userPayload(supabase, data.user) }, { status: 201, headers: response.headers });
}
