import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient, userPayload } from "@/lib/supabase-server";
import { jsonBody, sameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request was blocked for safety." }, { status: 403 });
  const parsed = await jsonBody(request, 16_000); if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 }); const body = parsed.body as { title?: unknown; status?: unknown; caseData?: unknown };
  if (typeof body?.title !== "string" || typeof body?.status !== "string" || body.title.length > 120 || body.status.length > 160) return NextResponse.json({ error: "Invalid claim." }, { status: 400 });
  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseRouteClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to save a claim." }, { status: 401 });
  const caseData = typeof body.caseData === "object" && body.caseData !== null && !Array.isArray(body.caseData) ? body.caseData : {};
  const { data, error } = await supabase.from("cases").insert({ user_id: user.id, title: body.title, status: body.status, case_data: caseData }).select("id,title,status,updated_at").single();
  if (error) return NextResponse.json({ error: "Momo could not save this claim yet." }, { status: 500 });
  return NextResponse.json({ claim: { id: data.id, title: data.title, status: data.status, savedAt: data.updated_at }, user: await userPayload(supabase, user) }, { status: 201, headers: response.headers });
}
