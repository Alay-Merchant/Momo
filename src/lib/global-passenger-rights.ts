import type { FlightDisruption } from "@/lib/case-types";

export type GlobalCurrency = "CAD" | "USD" | "SGD";
export type GlobalGuidance = {
  jurisdiction: "Canada APPR" | "United States DOT" | "Singapore" | "Unverified local rule pack";
  currency: GlobalCurrency | null;
  headline: string;
  detail: string;
  amounts?: { label: string; largeCarrier?: number; smallCarrier?: number; fixedAmount?: number }[];
  officialSource?: { title: string; url: string };
  overlapNote?: string;
};

const countryByAirport: Record<string, "CA" | "US" | "SG"> = {
  YYZ: "CA", YVR: "CA", YUL: "CA", YYC: "CA", YOW: "CA", YHZ: "CA", YEG: "CA", YWG: "CA", YQB: "CA", YXE: "CA",
  JFK: "US", EWR: "US", LAX: "US", SFO: "US", ORD: "US", ATL: "US", MIA: "US", IAD: "US", BOS: "US", SEA: "US", DFW: "US", DEN: "US", IAH: "US", DCA: "US", MSP: "US", PHX: "US", LAS: "US",
  SIN: "SG",
};

const uncoveredHubCodes = new Set(["DXB", "DOH", "IST", "NRT", "HND", "HKG", "BKK", "SYD", "MEL", "AKL", "JNB", "CPT", "NBO", "DEL", "BOM", "MEX", "GRU", "EZE", "CAI"]);

function country(value: unknown) {
  const code = String(value ?? "").trim().toUpperCase();
  return countryByAirport[code] ?? null;
}

function airportCode(value: unknown) {
  const code = String(value ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}

function outsideAirlineControl(reason: string) {
  return /weather|air traffic|security|medical emergency|airport closure|natural disaster|war|government|wildlife/i.test(reason);
}

export function globalPassengerGuidance({
  departureAirport,
  arrivalAirport,
  disruptionType,
  delayMinutes,
  airlineReason = "",
  cancellationNoticeDays = null,
  boardingReady = "",
  volunteered = "",
  documentsValid = "",
  hasUkOrEuFramework = false,
}: {
  departureAirport?: unknown;
  arrivalAirport?: unknown;
  disruptionType: FlightDisruption;
  delayMinutes: number | null;
  airlineReason?: string;
  cancellationNoticeDays?: number | null;
  boardingReady?: string;
  volunteered?: string;
  documentsValid?: string;
  hasUkOrEuFramework?: boolean;
}): GlobalGuidance[] {
  const departureCountry = country(departureAirport);
  const arrivalCountry = country(arrivalAirport);
  const countries = new Set([departureCountry, arrivalCountry]);
  const overlapNote = hasUkOrEuFramework
    ? "Do not add or seek duplicate fixed-compensation amounts for the same disruption. Keep each route separate and check official guidance before accepting or pursuing payment."
    : undefined;
  const guidance: GlobalGuidance[] = [];

  if (countries.has("CA")) {
    const delayAmounts = [
      { label: "3 to under 6 hours late", largeCarrier: 400, smallCarrier: 125 },
      { label: "6 to under 9 hours late", largeCarrier: 700, smallCarrier: 250 },
      { label: "9 or more hours late", largeCarrier: 1000, smallCarrier: 500 },
    ];
    const deniedBoardingAmounts = [
      { label: "Under 6 hours late", fixedAmount: 900 },
      { label: "6 to under 9 hours late", fixedAmount: 1800 },
      { label: "9 or more hours late", fixedAmount: 2400 },
    ];
    const controlled = !outsideAirlineControl(airlineReason);
    const delayEligible = delayMinutes !== null && delayMinutes >= 180 && controlled;
    const cancellationNoticeAfter14 = cancellationNoticeDays !== null && cancellationNoticeDays > 14;
    const cancellationEligible = disruptionType === "cancellation" && cancellationNoticeDays !== null && cancellationNoticeDays <= 14 && delayEligible;
    const deniedFactsConfirmed = /^(yes)$/i.test(boardingReady) && /^(no)$/i.test(volunteered) && /^(yes)$/i.test(documentsValid);
    const deniedEligible = disruptionType === "denied_boarding" && controlled && deniedFactsConfirmed;
    const showDelayAmounts = disruptionType === "delay" ? delayEligible : cancellationEligible;
    guidance.push({
      jurisdiction: "Canada APPR",
      currency: "CAD",
      headline: deniedEligible || showDelayAmounts
        ? "Canadian compensation may be relevant."
        : "Canadian rebooking or refund rights may still be relevant.",
      detail: outsideAirlineControl(airlineReason)
        ? "The airline's stated reason may be outside its control. Canadian rules can still require communication, rebooking or refunds, but Momo will not show fixed inconvenience compensation while control is unresolved."
        : disruptionType === "denied_boarding" && !deniedFactsConfirmed
          ? "Canadian denied boarding has its own CAD schedule. Momo needs to confirm that you were ready to travel, did not volunteer, and had valid documents before showing it."
          : disruptionType === "denied_boarding"
            ? "This is the Canadian denied-boarding schedule for an involuntary denial within airline control and not required for safety. It is not a large/small-carrier split."
            : disruptionType === "cancellation" && cancellationNoticeDays === null
              ? "For a Canadian cancellation, Momo needs to know when you were told about it before showing fixed CAD compensation bands. Rebooking or refund rights may still matter."
              : disruptionType === "cancellation" && cancellationNoticeAfter14
                ? "You reported notice more than 14 days before departure, so Momo will not show Canadian fixed inconvenience-compensation bands. Check rebooking, refund and ticket terms instead."
                : "For airline-controlled disruptions not required for safety, Canadian fixed compensation depends on arrival delay and airline size. Momo shows both large- and small-carrier figures until airline size is confirmed.",
      amounts: deniedEligible ? deniedBoardingAmounts : showDelayAmounts ? delayAmounts : undefined,
      officialSource: {
        title: disruptionType === "denied_boarding"
          ? "Canadian Transportation Agency: denied boarding"
          : "Canadian Transportation Agency: delays, cancellations, refunds and compensation",
        url: disruptionType === "denied_boarding"
          ? "https://protection-passager-passenger.otc-cta.gc.ca/en/refunds-and-compensation/bumping-denied-boarding-rebooking-refunds-compensation"
          : "https://protection-passager-passenger.otc-cta.gc.ca/en/refunds-and-compensation/flight-delays-cancellations-rebooking-refunds-compensation",
      },
      overlapNote,
    });
  }

  if (countries.has("US")) {
    const domesticUsJourney = departureCountry === "US" && arrivalCountry === "US";
    const threshold = domesticUsJourney ? 180 : 360;
    const significantDelay = delayMinutes !== null && delayMinutes >= threshold;
    const deniedBoarding = disruptionType === "denied_boarding";
    guidance.push({
      jurisdiction: "United States DOT",
      currency: "USD",
      headline: deniedBoarding
        ? "US denied boarding needs a dedicated review."
        : disruptionType === "cancellation"
          ? "A US refund choice may be relevant if you decline the cancelled flight's alternatives."
          : significantDelay
            ? "A US refund choice may be relevant if you decline the significantly delayed flight's alternatives."
            : "Momo cannot yet treat this US delay as a significant-delay refund case.",
      detail: deniedBoarding
        ? "US involuntary denied boarding uses a separate DOT route. Momo needs your fare, whether you volunteered, and replacement-arrival timing before it can guide the next step; it will not invent a USD amount."
        : `For a cancelled flight or significant delay/change, DOT guidance says a passenger who chooses not to travel or accept an alternative may be entitled to a refund. For this ${domesticUsJourney ? "US domestic" : "international"} route, Momo uses ${domesticUsJourney ? "3" : "6"} hours as the published significant-delay threshold. Momo does not show a fixed USD delay-compensation amount because the federal rule is a refund right, not a general statutory delay payment.`,
      officialSource: {
        title: deniedBoarding
          ? "US Department of Transportation: denied boarding and oversales"
          : "US Department of Transportation: airline refunds",
        url: deniedBoarding
          ? "https://www.transportation.gov/individuals/aviation-consumer-protection/bumping-oversales"
          : "https://www.transportation.gov/individuals/aviation-consumer-protection/refunds",
      },
      overlapNote,
    });
  }

  if (countries.has("SG")) {
    guidance.push({
      jurisdiction: "Singapore",
      currency: "SGD",
      headline: "Momo cannot safely show a fixed Singapore delay-compensation amount.",
      detail: "Singapore's transport ministry says there is no single international norm for delay compensation. Consumer and contract routes may matter, but Momo will not invent an SGD entitlement. Keep evidence and check the airline's terms and consumer routes.",
      officialSource: {
        title: "Singapore Ministry of Transport: refunds and significant flight delays",
        url: "https://www.mot.gov.sg/news-resources/newsroom/written-reply-to-parliamentary-question-on-introducing-regulations-for-seamless-refunds-for-significant-flight-delays-based-on-international-norms/",
      },
      overlapNote,
    });
  }

  const codes = [airportCode(departureAirport), airportCode(arrivalAirport)].filter(Boolean) as string[];
  if (!guidance.length && codes.some((code) => uncoveredHubCodes.has(code))) {
    guidance.push({
      jurisdiction: "Unverified local rule pack",
      currency: null,
      headline: "Momo does not yet have a verified local rule pack for this hub.",
      detail: "Momo will not guess a local fixed-compensation amount or currency. Your UK/EU assessment can still apply where its scope rules are met; otherwise check the airline's official terms and the local aviation or consumer authority.",
    });
  }

  return guidance;
}
