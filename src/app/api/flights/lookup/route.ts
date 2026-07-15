import { NextRequest, NextResponse } from "next/server";
import { cleanFlightDate, cleanFlightNumber, toFlightLookupResult, type AeroDataBoxFlight } from "@/lib/flight-lookup";
import { rateLimit } from "@/lib/auth-store";
import { clientIp, jsonBody, sameOrigin } from "@/lib/request-security";
import { createSupabaseRouteClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request was blocked for safety." }, { status: 403 });
  if (!rateLimit(`flight-lookup:${clientIp(request)}`)) return NextResponse.json({ error: "Please wait before looking up another flight." }, { status: 429 });
  const parsed = await jsonBody(request, 1_000); if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.body as { flightNumber?: unknown; flightDate?: unknown };
  const flightNumber = cleanFlightNumber(body.flightNumber); const flightDate = cleanFlightDate(body.flightDate);
  if (!flightNumber || !flightDate) return NextResponse.json({ error: "Enter a flight number and travel date in YYYY-MM-DD format." }, { status: 400 });
  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseRouteClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to look up public flight data." }, { status: 401 });
  const apiKey = process.env.AERODATABOX_RAPIDAPI_KEY;
  if (!apiKey) return NextResponse.json({ error: "Public flight lookup is not configured yet. Add AERODATABOX_RAPIDAPI_KEY on the server." }, { status: 503 });
  const url = new URL(`https://aerodatabox.p.rapidapi.com/flights/Number/${encodeURIComponent(flightNumber)}/${flightDate}`);
  url.searchParams.set("dateLocalRole", "Both");
  try {
    const providerResponse = await fetch(url, { signal: AbortSignal.timeout(8_000), headers: { Accept: "application/json", "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com", "X-RapidAPI-Key": apiKey } });
    const providerData = await providerResponse.json().catch(() => null) as AeroDataBoxFlight[] | { message?: string } | null;
    if (!providerResponse.ok || !Array.isArray(providerData)) return NextResponse.json({ error: "The flight-data provider could not complete this lookup." }, { status: 502 });
    const flight = providerData.find((item) => item.number?.replace(/\s+/g, "").toUpperCase() === flightNumber) ?? providerData[0];
    if (!flight) return NextResponse.json({ error: "Momo could not find a matching public flight record." }, { status: 404 });
    const result = toFlightLookupResult(flight, flightNumber);
    return NextResponse.json({ flight: result, notice: "Public flight data can be incomplete or use a different arrival definition. Check it before using it in a claim." }, { headers: response.headers });
  } catch { return NextResponse.json({ error: "Momo could not reach the flight-data provider right now." }, { status: 502 }); }
}
