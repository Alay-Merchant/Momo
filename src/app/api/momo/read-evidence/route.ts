import { NextRequest, NextResponse } from "next/server";
import { isSafeEvidence } from "@/lib/claim-security";
import { allowAiRequest } from "@/lib/ai-rate-limit";
import { readMomoEvidence } from "@/lib/momo-ai-provider";
import { safeMultipartBody, sameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";
const MAX_EVIDENCE_READ_BYTES = 3 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request was blocked for safety." }, { status: 403 });
  const sizeError = safeMultipartBody(request, MAX_EVIDENCE_READ_BYTES);
  if (sizeError) return NextResponse.json({ error: sizeError }, { status: 413 });
  if (!await allowAiRequest(request, "evidence")) return NextResponse.json({ error: "Please wait before asking Momo to read another file." }, { status: 429 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF, PNG, or JPG first." }, { status: 400 });
  if (file.size === 0 || file.size > MAX_EVIDENCE_READ_BYTES) return NextResponse.json({ error: "For a quick private reading, choose a PDF, PNG, or JPG under 3 MB." }, { status: 400 });
  if (file.type !== "application/pdf" && file.type !== "image/png" && file.type !== "image/jpeg") return NextResponse.json({ error: "Momo can read PDF, PNG, and JPG evidence only." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isSafeEvidence(file.type, bytes)) return NextResponse.json({ error: "That file does not match its claimed type." }, { status: 400 });
  try {
    const result = await readMomoEvidence({ bytes, mimeType: file.type, filename: file.name.slice(0, 120) });
    return NextResponse.json({ text: result.text, usage: result.usage });
  } catch {
    return NextResponse.json({ error: "Momo could not read that file right now. You can still paste the relevant part of the airline reply." }, { status: 503 });
  }
}
