import { NextRequest, NextResponse } from "next/server";
import { getUser, saveClaim, sessionCookie } from "@/lib/auth-store";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const user = getUser(request.cookies.get(sessionCookie.name)?.value);
  if (!user) return NextResponse.json({ error: "Please sign in to save a claim." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.title !== "string" || typeof body?.status !== "string") return NextResponse.json({ error: "Invalid claim." }, { status: 400 });
  return NextResponse.json({ claim: saveClaim(user, body.title, body.status) }, { status: 201 });
}
