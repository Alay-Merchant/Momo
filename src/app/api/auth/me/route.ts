import { NextRequest, NextResponse } from "next/server";
import { getUser, sessionCookie } from "@/lib/auth-store";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const user = getUser(request.cookies.get(sessionCookie.name)?.value);
  return user ? NextResponse.json({ user: { email: user.email, claims: user.claims } }) : NextResponse.json({ user: null });
}
