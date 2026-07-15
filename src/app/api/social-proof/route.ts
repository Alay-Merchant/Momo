import { NextResponse } from "next/server";
import { demoSocialProof } from "@/lib/social-proof";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ entries: demoSocialProof, demo: true });
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.rpc("momo_social_proof");
    if (error || !data?.length) return NextResponse.json({ entries: demoSocialProof, demo: true });
    return NextResponse.json({ entries: data, demo: false }, { headers: { "Cache-Control": "public, max-age=120" } });
  } catch { return NextResponse.json({ entries: demoSocialProof, demo: true }); }
}
