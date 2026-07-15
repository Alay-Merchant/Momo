import { NextRequest, NextResponse } from "next/server";
import { cleanFlightDate, cleanFlightNumber, arrivalDelay } from "@/lib/flight-lookup";
import { rateLimit } from "@/lib/auth-store";
import { clientIp, jsonBody, sameOrigin } from "@/lib/request-security";
import { createSupabaseRouteClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
type ProviderFlight = { flight?: { iata?: string }; airline?: { name?: string }; flight_status?: string; departure?: { scheduled?: string; actual?: string; estimated?: string }; arrival?: { scheduled?: string; actual?: string; estimated?: string } };

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
  const accessKey = process.env.AVIATIONSTACK_API_KEY;
  if (!accessKey) return NextResponse.json({ error: "Public flight lookup is not configured yet. Add AVIATIONSTACK_API_KEY on the server." }, { status: 503 });
  const url = new URL("https://api.aviationstack.com/v1/flights");
  url.searchParams.set("access_key", accessKey); url.searchParams.set("flight_iata", flightNumber); url.searchParams.set("flight_date", flightDate); url.searchParams.set("limit", "5");
  try {
    const providerResponse = await fetch(url, { signal: AbortSignal.timeout(8_000), headers: { Accept: "application/json" } });
    const providerData = await providerResponse.json().catch(() => null) as { data?: ProviderFlight[]; error?: { message?: string } } | null;
    if (!providerResponse.ok || providerData?.error) return NextResponse.json({ error: "The flight-data provider could not complete this lookup." }, { status: 502 });
    const flight = providerData?.data?.find((item) => item.flight?.iata?.replace(/\s+/g, "").toUpperCase() === flightNumber) ?? providerData?.data?.[0];
    if (!flight) return NextResponse.json({ error: "Momo could not find a matching public flight record." }, { status: 404 });
    const actualArrival = flight.arrival?.actual ?? flight.arrival?.estimated ?? null;
    const result = { flightNumber: flight.flight?.iata ?? flightNumber, airline: flight.airline?.name ?? null, status: flight.flight_status ?? null, scheduledDeparture: flight.departure?.scheduled ?? null, actualDeparture: flight.departure?.actual ?? flight.departure?.estimated ?? null, scheduledArrival: flight.arrival?.scheduled ?? null, actualArrival, arrivalDelayMinutes: arrivalDelay(flight.arrival?.scheduled, actualArrival) };
    return NextResponse.json({ flight: result, notice: "Public flight data can be incomplete or use a different arrival definition. Check it before using it in a claim." }, { headers: response.headers });
  } catch { return NextResponse.json({ error: "Momo could not reach the flight-data provider right now." }, { status: 502 }); }
}
