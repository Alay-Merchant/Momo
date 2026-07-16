import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/auth-store";
import { createSupabaseRouteClient, userPayload } from "@/lib/supabase-server";
import { clientIp, jsonBody, sameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request was blocked for safety." }, { status: 403 });
  if (!rateLimit(`claims:${clientIp(request)}`)) return NextResponse.json({ error: "Please wait before saving another claim." }, { status: 429 });
  const parsed = await jsonBody(request, 16_000); if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 }); const body = parsed.body as { title?: unknown; status?: unknown; caseData?: unknown };
  if (typeof body?.title !== "string" || typeof body?.status !== "string" || body.title.length > 120 || body.status.length > 160) return NextResponse.json({ error: "Invalid claim." }, { status: 400 });
  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseRouteClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to save a claim." }, { status: 401 });
  const caseData = typeof body.caseData === "object" && body.caseData !== null && !Array.isArray(body.caseData) ? body.caseData : {};
  if (JSON.stringify(caseData).length > 12_000) return NextResponse.json({ error: "Claim details are too large." }, { status: 400 });
  const { count } = await supabase.from("cases").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if ((count ?? 0) >= 100) return NextResponse.json({ error: "Momo limits saved claims to 100 per account." }, { status: 429 });
  const { data, error } = await supabase.from("cases").insert({ user_id: user.id, title: body.title, status: body.status, case_data: caseData }).select("id,title,status,updated_at").single();
  if (error) return NextResponse.json({ error: "Momo could not save this claim yet." }, { status: 500 });
  return NextResponse.json({ claim: { id: data.id, title: data.title, status: data.status, savedAt: data.updated_at }, user: await userPayload(supabase, user) }, { status: 201, headers: response.headers });
}
