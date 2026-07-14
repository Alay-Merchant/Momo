import { NextRequest, NextResponse } from "next/server";
import { cleanEmail, createSession, rateLimit, register, sessionCookie, sessionCookieOptions, validPassword } from "@/lib/auth-store";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!rateLimit(`register:${ip}`)) return NextResponse.json({ error: "Please wait before trying again." }, { status: 429 });
  const body = await request.json().catch(() => null);
  const email = cleanEmail(body?.email);
  if (!email || !validPassword(body?.password)) return NextResponse.json({ error: "Use a valid email and a password of at least 12 characters." }, { status: 400 });
  const user = await register(email, body.password);
  if (!user) return NextResponse.json({ error: "An account already exists for this email. Try signing in." }, { status: 409 });
  const response = NextResponse.json({ user: { email: user.email, claims: user.claims } }, { status: 201 });
  response.cookies.set(sessionCookie.name, createSession(user.id), sessionCookieOptions(request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "")));
  return response;
}
