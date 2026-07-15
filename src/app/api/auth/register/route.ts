import { NextRequest, NextResponse } from "next/server";
import { cleanEmail, rateLimit, validPassword } from "@/lib/auth-store";
import { createSupabaseRouteClient, userPayload } from "@/lib/supabase-server";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!rateLimit(`register:${ip}`)) return NextResponse.json({ error: "Please wait before trying again." }, { status: 429 });
  const body = await request.json().catch(() => null);
  const email = cleanEmail(body?.email);
  if (!email || !validPassword(body?.password)) return NextResponse.json({ error: "Use a valid email and a password of at least 12 characters." }, { status: 400 });
  if (body?.termsAccepted !== true) return NextResponse.json({ error: "Please read and accept Momo's Terms to create an account." }, { status: 400 });
  const response = NextResponse.json({ ok: true }, { status: 201 });
  const supabase = createSupabaseRouteClient(request, response);
  const { data, error } = await supabase.auth.signUp({ email, password: body.password, options: { emailRedirectTo: new URL("/", request.url).origin, data: { terms_accepted: true, terms_version: "2026-07-15" } } });
  if (error) {
    const isEmailRateLimit = /rate limit|too many requests/i.test(error.message);
    return NextResponse.json({ error: isEmailRateLimit ? "Supabase has temporarily paused confirmation emails. For local testing, turn off Confirm email in Supabase Authentication → Providers → Email, then try again." : error.message }, { status: isEmailRateLimit ? 429 : 400 });
  }
  if (!data.session || !data.user) return NextResponse.json({ needsEmailConfirmation: true, message: "Check your email to confirm your account, then sign in." }, { status: 202 });
  return NextResponse.json({ user: await userPayload(supabase, data.user) }, { status: 201, headers: response.headers });
}
