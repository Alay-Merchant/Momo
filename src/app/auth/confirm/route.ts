import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const response = NextResponse.redirect(new URL("/reset-password", request.url));
  if (!tokenHash || type !== "recovery") return NextResponse.redirect(new URL("/reset-password?error=invalid", request.url));
  const supabase = createSupabaseRouteClient(request, response);
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
  return error ? NextResponse.redirect(new URL("/reset-password?error=expired", request.url)) : response;
}
