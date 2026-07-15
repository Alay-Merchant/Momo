import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const response = NextResponse.json({ ok: true }); const supabase = createSupabaseRouteClient(request, response);
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Please sign in to view this claim." }, { status: 401 });
  const { id } = await params;
  const { data: claim, error } = await supabase.from("cases").select("id,title,status,case_data,created_at,updated_at").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error || !claim) return NextResponse.json({ error: "Momo could not find that claim." }, { status: 404 });
  const [{ data: events }, { data: files }] = await Promise.all([
    supabase.from("claim_events").select("id,event_type,content,source_facts,created_at").eq("case_id", id).eq("user_id", user.id).order("created_at"),
    supabase.from("claim_files").select("id,original_name,mime_type,byte_size,created_at").eq("case_id", id).eq("user_id", user.id).order("created_at"),
  ]);
  return NextResponse.json({ claim, events: events ?? [], files: files ?? [] }, { headers: response.headers });
}
