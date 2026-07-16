import { NextRequest, NextResponse } from "next/server";
import {
  cleanAirline,
  delayBand,
  money,
  resolutionTypes,
  reasonCategories,
  disruptionTypes,
  validChoice,
} from "@/lib/community-insights";
import { rateLimit } from "@/lib/auth-store";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { clientIp, jsonBody, sameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "This request was blocked for safety." },
      { status: 403 },
    );
  if (!rateLimit(`outcome:${clientIp(request)}`))
    return NextResponse.json(
      { error: "Please wait before sharing another outcome." },
      { status: 429 },
    );
  const parsed = await jsonBody(request, 4_000);
  if ("error" in parsed)
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.body as Record<string, unknown>;
  const airline = cleanAirline(body?.airline);
  if (
    !airline ||
    !validChoice(body?.disruptionType, disruptionTypes) ||
    !validChoice(body?.reasonCategory, reasonCategories) ||
    !validChoice(body?.resolutionType, resolutionTypes) ||
    body?.optedIn !== true
  )
    return NextResponse.json(
      {
        error:
          "Please complete the anonymous outcome details and choose to share them.",
      },
      { status: 400 },
    );
  const requestedAmount = money(body?.requestedAmount);
  const offeredAmount = money(body?.offeredAmount);
  const acceptedAmount = money(body?.acceptedAmount);
  if (
    (body?.requestedAmount !== "" && requestedAmount === null) ||
    (body?.offeredAmount !== "" && offeredAmount === null) ||
    (body?.acceptedAmount !== "" && acceptedAmount === null)
  )
    return NextResponse.json(
      { error: "Amounts must be between 0 and 50,000." },
      { status: 400 },
    );
  const currency =
    typeof body?.currency === "string" && /^[A-Z]{3}$/.test(body.currency)
      ? body.currency
      : "GBP";
  const city =
    typeof body?.city === "string" ? body.city.trim().replace(/\s+/g, " ") : "";
  const socialProofOptIn = body?.shareInTicker === true;
  if (socialProofOptIn)
    return NextResponse.json(
      { error: "Public outcome sharing is paused while the Momo wins ticker uses demo examples." },
      { status: 400 },
    );
  const unresolvedReason = typeof body?.unresolvedReason === "string" && ["airline_did_not_reply", "airline_refused", "needed_more_evidence", "momo_misunderstood", "different_help_needed", "other"].includes(body.unresolvedReason) ? body.unresolvedReason : null;
  if (body?.resolutionType === "not_resolved" && !unresolvedReason) return NextResponse.json({ error: "Please choose why this case was not resolved." }, { status: 400 });
  if (
    socialProofOptIn &&
    (!/^[\p{L} .'-]{2,60}$/u.test(city) ||
      acceptedAmount === null ||
      acceptedAmount <= 0)
  )
    return NextResponse.json(
      {
        error: "A public Momo win needs a city and a positive accepted amount.",
      },
      { status: 400 },
    );
  const response = NextResponse.json({
    ok: true,
    message:
      "Thank you. Only the anonymous outcome details were added to Momo's learning pool.",
  });
  const supabase = createSupabaseRouteClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Please sign in before sharing an anonymous outcome." },
      { status: 401 },
    );
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("outcome_contributions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= 3)
    return NextResponse.json(
      {
        error:
          "Momo limits anonymous outcome sharing to three entries in 30 days to protect the community data.",
      },
      { status: 429 },
    );
  const { error } = await supabase
    .from("outcome_contributions")
    .insert({
      user_id: user.id,
      airline,
      disruption_type: body.disruptionType,
      delay_band: delayBand(body.delayMinutes),
      reason_category: body.reasonCategory,
      resolution_type: body.resolutionType,
      requested_amount: requestedAmount,
      offered_amount: offeredAmount,
      accepted_amount: acceptedAmount,
      currency,
      opted_in: true,
      social_proof_opt_in: socialProofOptIn,
      city: socialProofOptIn ? city : null,
      unresolved_reason: unresolvedReason,
    });
  if (error)
    return NextResponse.json(
      { error: "Momo could not save that outcome yet." },
      { status: 500 },
    );
  return response;
}
