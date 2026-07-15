import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { sameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request was blocked for safety." }, { status: 403 });
  const response = NextResponse.json({ ok: true, message: "Your public anonymous Momo wins have been removed." });
  const supabase = createSupabaseRouteClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const { error } = await supabase.rpc("withdraw_momo_social_proof");
  if (error) return NextResponse.json({ error: "Momo could not remove those examples yet." }, { status: 500 });
  return response;
}
