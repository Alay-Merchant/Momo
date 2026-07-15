import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/auth-store";
import { clientIp, jsonBody, sameOrigin } from "@/lib/request-security";
import { createSupabaseRouteClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
const eventTypes = new Set(["airline_reply", "momo_reply", "user_draft", "status_change"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request was blocked for safety." }, { status: 403 });
  if (!rateLimit(`claim-event:${clientIp(request)}`)) return NextResponse.json({ error: "Please wait before saving another claim event." }, { status: 429 });
  const parsed = await jsonBody(request, 8_000); if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.body as { eventType?: unknown; content?: unknown; sourceFacts?: unknown };
  if (typeof body.eventType !== "string" || !eventTypes.has(body.eventType) || typeof body.content !== "string" || !body.content.trim() || body.content.length > 5_000) return NextResponse.json({ error: "That claim event is not valid." }, { status: 400 });
  const response = NextResponse.json({ ok: true }); const supabase = createSupabaseRouteClient(request, response);
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Please sign in to save your claim story." }, { status: 401 });
  const { id } = await params;
  const { data, error } = await supabase.from("claim_events").insert({ case_id: id, user_id: user.id, event_type: body.eventType, content: body.content.trim(), source_facts: Array.isArray(body.sourceFacts) ? body.sourceFacts.slice(0, 20) : [] }).select("id,event_type,content,created_at").single();
  if (error) return NextResponse.json({ error: "Momo could not save that event yet. Run claim-timeline.sql in Supabase if this is your first setup." }, { status: 500 });
  return NextResponse.json({ event: data }, { status: 201, headers: response.headers });
}
