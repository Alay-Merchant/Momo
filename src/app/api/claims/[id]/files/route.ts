import { NextRequest, NextResponse } from "next/server";
import { isSafeEvidence, MAX_FILE_BYTES, safeEvidenceName } from "@/lib/claim-security";
import { rateLimit } from "@/lib/auth-store";
import { clientIp, sameOrigin } from "@/lib/request-security";
import { createSupabaseRouteClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request was blocked for safety." }, { status: 403 });
  if (!rateLimit(`claim-file:${clientIp(request)}`)) return NextResponse.json({ error: "Please wait before uploading another file." }, { status: 429 });
  const response = NextResponse.json({ ok: true }); const supabase = createSupabaseRouteClient(request, response);
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Please sign in to save evidence." }, { status: 401 });
  const form = await request.formData().catch(() => null); const file = form?.get("file");
  if (!(file instanceof File) || file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Choose a PDF, PNG, or JPG under 10 MB." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isSafeEvidence(file.type, bytes)) return NextResponse.json({ error: "That file type or file contents are not supported." }, { status: 400 });
  const { id } = await params;
  const { data: claim } = await supabase.from("cases").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!claim) return NextResponse.json({ error: "Momo could not find that saved claim." }, { status: 404 });
  const name = safeEvidenceName(file.name); const storagePath = `${user.id}/${id}/${crypto.randomUUID()}-${name}`;
  const { error: uploadError } = await supabase.storage.from("case-evidence").upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "Momo could not upload that file yet. Check that storage.sql has been run." }, { status: 500 });
  const { data, error } = await supabase.from("claim_files").insert({ case_id: id, user_id: user.id, storage_path: storagePath, original_name: name, mime_type: file.type, byte_size: file.size }).select("id,original_name,mime_type,byte_size,created_at").single();
  if (error) { await supabase.storage.from("case-evidence").remove([storagePath]); return NextResponse.json({ error: "Momo could not save this evidence record. Run claim-timeline.sql in Supabase." }, { status: 500 }); }
  return NextResponse.json({ file: data }, { status: 201, headers: response.headers });
}
