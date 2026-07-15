import { NextRequest } from "next/server";

export function clientIp(request: NextRequest) { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"; }

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return origin === request.nextUrl.origin;
}

export async function jsonBody(request: NextRequest, maxBytes = 12_000): Promise<{ body: unknown } | { error: string }> {
  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (!contentType.toLowerCase().startsWith("application/json")) return { error: "This request must use JSON." };
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return { error: "That request is too large." };
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Please provide a valid request." };
  return { body };
}

export function momoSupportContext(reply: unknown, assessment: unknown) {
  if (typeof reply !== "string" || typeof assessment !== "string") return false;
  const context = `${reply}\n${assessment}`.toLowerCase();
  return /\b(flight|airline|airport|delay|cancel|boarding|booking|journey|compensation|disruption)\b/.test(context);
}
