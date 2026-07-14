import { NextRequest, NextResponse } from "next/server";
import { authenticate, cleanEmail, createSession, rateLimit, sessionCookie, sessionCookieOptions } from "@/lib/auth-store";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!rateLimit(`login:${ip}`)) return NextResponse.json({ error: "Please wait before trying again." }, { status: 429 });
  const body = await request.json().catch(() => null);
  const email = cleanEmail(body?.email);
  const user = email && typeof body?.password === "string" ? await authenticate(email, body.password) : null;
  if (!user) return NextResponse.json({ error: "Email or password was not recognised." }, { status: 401 });
  const response = NextResponse.json({ user: { email: user.email, claims: user.claims } });
  response.cookies.set(sessionCookie.name, createSession(user.id), sessionCookieOptions(request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "")));
  return response;
}
