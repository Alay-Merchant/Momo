import type { CaseFact, FlightCase, FlightDisruption } from "@/lib/case-types";
import { calculateCompensation, evaluateFlightCase, flightRuleCards } from "@/lib/flight-rules";

const fields = new Set([
  "flight_number", "route", "departure_region", "arrival_region", "departure_airport", "arrival_airport", "operating_carrier_region", "operating_carrier_name", "flight_date",
  "final_arrival_delay_minutes", "airline_reason", "one_booking", "flight_distance_km", "journey_is_intra_eu", "cancellation_notice_days", "rerouting_arrival_delay_minutes", "boarding_ready", "denied_boarding_voluntary", "travel_documents_valid",
]);
const disruptions = new Set<FlightDisruption>(["delay", "cancellation", "denied_boarding", "missed_connection"]);

type RawFact = { field?: unknown; value?: unknown; confirmed?: unknown };

export function caseFromUntrustedInput(value: unknown): FlightCase | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as { disruptionType?: unknown; facts?: unknown };
  if (!disruptions.has(input.disruptionType as FlightDisruption) || !Array.isArray(input.facts) || input.facts.length > 20) return null;
  const facts: CaseFact[] = [];
  for (const item of input.facts as RawFact[]) {
    if (!item || typeof item !== "object" || !fields.has(String(item.field)) || item.confirmed !== true) continue;
    const factValue = item.value;
    if (factValue !== null && typeof factValue !== "string" && typeof factValue !== "number") return null;
    if (typeof factValue === "string" && factValue.length > 300) return null;
    if (typeof factValue === "number" && (!Number.isFinite(factValue) || Math.abs(factValue) > 1_000_000)) return null;
    facts.push({ id: String(item.field), field: String(item.field), label: String(item.field), value: factValue, provenance: "USER_CONFIRMED", sourceLabel: "User confirmed", confirmed: true });
  }
  return { id: "untrusted-request", title: "Flight disruption", disruptionType: input.disruptionType as FlightDisruption, facts, airlineReply: "" };
}

export function createDecisionReceipt(flightCase: FlightCase) {
  const assessment = evaluateFlightCase(flightCase);
  const compensation = calculateCompensation(flightCase);
  const cards = flightRuleCards.filter((card) => assessment.ruleIds.includes(card.id));
  const facts = flightCase.facts.map(({ field, value }) => ({ field, value }));
  return {
    assessment,
    compensation,
    facts,
    cards: cards.map((card) => ({ id: card.id, framework: card.framework, proposition: card.plainLanguage, source: card.officialSource.url, reviewedAt: card.officialSource.reviewedAt })),
  };
}

export function receiptSummary(receipt: ReturnType<typeof createDecisionReceipt>) {
  return `Assessment: ${receipt.assessment.caseState}. Rules: ${receipt.assessment.frameworkCandidates.join(", ") || "none"}. Unknowns: ${receipt.assessment.materialUnknowns.join(", ") || "none"}. Allowed requests: ${receipt.assessment.allowedClaims.join(", ") || "clarification"}.`;
}
