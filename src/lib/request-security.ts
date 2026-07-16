import { NextRequest } from "next/server";

export function clientIp(request: NextRequest) {
  // Vercel supplies this at its trusted edge. Do not accept a caller-provided
  // generic x-forwarded-for value as a rate-limit identity.
  return request.headers.get("x-vercel-forwarded-for")?.trim() || request.headers.get("x-real-ip")?.trim() || "local";
}

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return origin === request.nextUrl.origin;
}

export async function jsonBody(request: NextRequest, maxBytes = 12_000): Promise<{ body: unknown } | { error: string }> {
  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (!contentType.toLowerCase().startsWith("application/json")) return { error: "This request must use JSON." };
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return { error: "That request is too large." };
  const reader = request.body?.getReader();
  if (!reader) return { error: "Please provide a valid request." };
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        return { error: "That request is too large." };
      }
      chunks.push(value);
    }
  } catch {
    return { error: "Please provide a valid request." };
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let body: unknown;
  try { body = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { return { error: "Please provide a valid request." }; }
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Please provide a valid request." };
  return { body };
}

export function momoSupportContext(reply: unknown, assessment: unknown) {
  if (typeof reply !== "string" || typeof assessment !== "string") return false;
  const context = `${reply}\n${assessment}`.toLowerCase();
  return /\b(flight|airline|airport|delay|cancel|boarding|booking|journey|compensation|disruption)\b/.test(context);
}
