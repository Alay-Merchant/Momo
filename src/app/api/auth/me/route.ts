import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient, userPayload } from "@/lib/supabase-server";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const response = NextResponse.json({ user: null });
  const supabase = createSupabaseRouteClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();
  return user ? NextResponse.json({ user: await userPayload(supabase, user) }, { headers: response.headers }) : response;
}
