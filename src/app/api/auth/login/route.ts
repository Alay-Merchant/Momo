import { NextRequest, NextResponse } from "next/server";
import { cleanEmail, rateLimit } from "@/lib/auth-store";
import { createSupabaseRouteClient, userPayload } from "@/lib/supabase-server";
import { clientIp, jsonBody, sameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request was blocked for safety." }, { status: 403 });
  if (!rateLimit(`login:${clientIp(request)}`)) return NextResponse.json({ error: "Please wait before trying again." }, { status: 429 });
  const parsed = await jsonBody(request, 2_000); if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 }); const body = parsed.body as { email?: unknown; password?: unknown };
  const email = cleanEmail(body?.email);
  if (!email || typeof body?.password !== "string") return NextResponse.json({ error: "Email or password was not recognised." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseRouteClient(request, response);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: body.password });
  if (error || !data.user) return NextResponse.json({ error: "Email or password was not recognised." }, { status: 401 });
  return NextResponse.json({ user: await userPayload(supabase, data.user) }, { headers: response.headers });
}
