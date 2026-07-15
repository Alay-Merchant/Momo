import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true, message: "Your public anonymous Momo wins have been removed." });
  const supabase = createSupabaseRouteClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const { error } = await supabase.rpc("withdraw_momo_social_proof");
  if (error) return NextResponse.json({ error: "Momo could not remove those examples yet." }, { status: 500 });
  return response;
}
