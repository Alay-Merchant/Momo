import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { sameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request was blocked for safety." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseRouteClient(request, response);
  await supabase.auth.signOut();
  return response;
}
