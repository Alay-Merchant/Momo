import { NextRequest, NextResponse } from "next/server";
import { cleanEmail, rateLimit } from "@/lib/auth-store";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { clientIp, jsonBody, sameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request was blocked for safety." }, { status: 403 });
  if (!rateLimit(`reset:${clientIp(request)}`)) return NextResponse.json({ error: "Please wait before asking for another reset email." }, { status: 429 });
  const parsed = await jsonBody(request, 1_000); if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 }); const body = parsed.body as { email?: unknown };
  const email = cleanEmail(body?.email);
  if (!email) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  const response = NextResponse.json({ message: "If that email has a Momo account, we have sent a reset link." });
  const supabase = createSupabaseRouteClient(request, response);
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: new URL("/auth/confirm", request.url).toString() });
  if (error && !/rate limit|too many requests/i.test(error.message)) return NextResponse.json({ error: "Momo could not request a reset email yet. Please try again shortly." }, { status: 400 });
  if (error) return NextResponse.json({ error: "Supabase has temporarily paused email sending. Please wait before trying again." }, { status: 429 });
  return response;
}
