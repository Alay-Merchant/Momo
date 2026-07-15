import { NextRequest, NextResponse } from "next/server";
import { cleanAirline, delayBand, money, resolutionTypes, reasonCategories, disruptionTypes, validChoice } from "@/lib/community-insights";
import { rateLimit } from "@/lib/auth-store";
import { createSupabaseRouteClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!rateLimit(`outcome:${ip}`)) return NextResponse.json({ error: "Please wait before sharing another outcome." }, { status: 429 });
  const body = await request.json().catch(() => null);
  const airline = cleanAirline(body?.airline);
  if (!airline || !validChoice(body?.disruptionType, disruptionTypes) || !validChoice(body?.reasonCategory, reasonCategories) || !validChoice(body?.resolutionType, resolutionTypes) || body?.optedIn !== true) return NextResponse.json({ error: "Please complete the anonymous outcome details and choose to share them." }, { status: 400 });
  const requestedAmount = money(body?.requestedAmount);
  const offeredAmount = money(body?.offeredAmount);
  const acceptedAmount = money(body?.acceptedAmount);
  if ((body?.requestedAmount !== "" && requestedAmount === null) || (body?.offeredAmount !== "" && offeredAmount === null) || (body?.acceptedAmount !== "" && acceptedAmount === null)) return NextResponse.json({ error: "Amounts must be between 0 and 50,000." }, { status: 400 });
  const currency = typeof body?.currency === "string" && /^[A-Z]{3}$/.test(body.currency) ? body.currency : "GBP";
  const response = NextResponse.json({ ok: true, message: "Thank you. Only the anonymous outcome details were added to Momo's learning pool." });
  const supabase = createSupabaseRouteClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in before sharing an anonymous outcome." }, { status: 401 });
  const { error } = await supabase.from("outcome_contributions").insert({ user_id: user.id, airline, disruption_type: body.disruptionType, delay_band: delayBand(body.delayMinutes), reason_category: body.reasonCategory, resolution_type: body.resolutionType, requested_amount: requestedAmount, offered_amount: offeredAmount, accepted_amount: acceptedAmount, currency, opted_in: true });
  if (error) return NextResponse.json({ error: "Momo could not save that outcome yet." }, { status: 500 });
  return response;
}
