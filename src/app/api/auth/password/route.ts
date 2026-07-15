import { NextRequest, NextResponse } from "next/server";
import { validPassword } from "@/lib/auth-store";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { jsonBody, sameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request was blocked for safety." }, { status: 403 });
  const parsed = await jsonBody(request, 1_000); if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 }); const body = parsed.body as { password?: unknown };
  if (!validPassword(body?.password)) return NextResponse.json({ error: "Use a password with at least 12 characters." }, { status: 400 });
  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseRouteClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "This password link has expired. Please request another one." }, { status: 401 });
  const { error } = await supabase.auth.updateUser({ password: body.password });
  if (error) return NextResponse.json({ error: "Momo could not update your password. Please request another link." }, { status: 400 });
  return response;
}
