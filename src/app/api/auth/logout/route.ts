import { NextRequest, NextResponse } from "next/server";
import { revokeSession, sessionCookie, sessionCookieOptions } from "@/lib/auth-store";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  revokeSession(request.cookies.get(sessionCookie.name)?.value);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie.name, "", { ...sessionCookieOptions(request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "")), maxAge: 0 });
  return response;
}
