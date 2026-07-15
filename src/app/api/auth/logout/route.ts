import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseRouteClient(request, response);
  await supabase.auth.signOut();
  return response;
}
