import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient, userPayload } from "@/lib/supabase-server";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (typeof body?.title !== "string" || typeof body?.status !== "string" || body.title.length > 120 || body.status.length > 160) return NextResponse.json({ error: "Invalid claim." }, { status: 400 });
  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseRouteClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to save a claim." }, { status: 401 });
  const { data, error } = await supabase.from("cases").insert({ user_id: user.id, title: body.title, status: body.status, case_data: body.caseData ?? {} }).select("id,title,status,updated_at").single();
  if (error) return NextResponse.json({ error: "Momo could not save this claim yet." }, { status: 500 });
  return NextResponse.json({ claim: { id: data.id, title: data.title, status: data.status, savedAt: data.updated_at }, user: await userPayload(supabase, user) }, { status: 201, headers: response.headers });
}
