import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

export function createSupabaseRouteClient(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");
  return createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
}

export type SavedCase = { id: string; title: string; status: string; savedAt: string };

export async function userPayload(supabase: ReturnType<typeof createSupabaseRouteClient>, user: { id: string; email?: string | null }) {
  const { data, error } = await supabase.from("cases").select("id,title,status,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
  if (error) throw error;
  return {
    email: user.email ?? "",
    claims: (data ?? []).map((claim) => ({ id: claim.id, title: claim.title, status: claim.status, savedAt: claim.updated_at })) as SavedCase[],
  };
}
