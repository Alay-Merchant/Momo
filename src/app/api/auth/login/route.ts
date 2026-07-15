import { NextRequest, NextResponse } from "next/server";
import { cleanEmail, rateLimit } from "@/lib/auth-store";
import { createSupabaseRouteClient, userPayload } from "@/lib/supabase-server";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!rateLimit(`login:${ip}`)) return NextResponse.json({ error: "Please wait before trying again." }, { status: 429 });
  const body = await request.json().catch(() => null);
  const email = cleanEmail(body?.email);
  if (!email || typeof body?.password !== "string") return NextResponse.json({ error: "Email or password was not recognised." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseRouteClient(request, response);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: body.password });
  if (error || !data.user) return NextResponse.json({ error: "Email or password was not recognised." }, { status: 401 });
  return NextResponse.json({ user: await userPayload(supabase, data.user) }, { headers: response.headers });
}
