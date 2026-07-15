import type { Assessment, FlightCase, RuleCard } from "@/lib/case-types";
import { activeCards, regulationCards, type Region, type RuleFramework } from "@/lib/regulations/library";
import { scopeFromAirportOrRegion } from "@/lib/scope-normalizer";

export const flightRuleCards: RuleCard[] = regulationCards.map((card) => ({
  id: card.id,
  framework: card.framework,
  plainLanguage: card.plainLanguage,
  officialSource: { ...card.officialSource, reviewedAt: card.reviewedAt },
  version: card.version,
  status: card.status,
  reviewDueAt: card.reviewDueAt,
}));

function factValue(flightCase: FlightCase, field: string) {
  return flightCase.facts.find((item) => item.field === field)?.value;
}

function region(value: unknown): Region {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text || /not sure|unknown|don't know/.test(text)) return "UNKNOWN";
  if (/^(uk|united kingdom|england|scotland|wales|northern ireland)$/.test(text)) return "UK";
  if (/eu|eea|switzerland|european/.test(text)) return "EU_EEA_CH";
  return "OTHER";
}

function frameworkFor(departure: Region, arrival: Region, carrier: Region): RuleFramework[] {
  const uk = departure === "UK" || (arrival === "UK" && (carrier === "UK" || carrier === "EU_EEA_CH"));
  const eu = departure === "EU_EEA_CH" || (arrival === "EU_EEA_CH" && carrier === "EU_EEA_CH");
  return [uk && "UK261", eu && "EU261"].filter(Boolean) as RuleFramework[];
}

function idsFor(frameworks: RuleFramework[], disruptionType: FlightCase["disruptionType"]) {
  return activeCards(regulationCards.filter((card) => frameworks.includes(card.framework) && card.disruptionTypes.includes(disruptionType)).map((card) => card.id)).map((card) => card.id);
}

export function evaluateFlightCase(flightCase: FlightCase): Assessment {
  const departure = scopeFromAirportOrRegion(factValue(flightCase, "departure_airport"), region(factValue(flightCase, "departure_region")));
  const arrival = scopeFromAirportOrRegion(factValue(flightCase, "arrival_airport"), region(factValue(flightCase, "arrival_region")));
  const carrier = region(factValue(flightCase, "operating_carrier_region"));
  const delay = Number(factValue(flightCase, "final_arrival_delay_minutes"));
  const reason = String(factValue(flightCase, "airline_reason") ?? "");
  const booking = String(factValue(flightCase, "one_booking") ?? "");
  const cancellationNotice = Number(factValue(flightCase, "cancellation_notice_days"));
  const boardingReady = String(factValue(flightCase, "boarding_ready") ?? "");
  const volunteered = String(factValue(flightCase, "denied_boarding_voluntary") ?? "");
  const validDocuments = String(factValue(flightCase, "travel_documents_valid") ?? "");
  const missingScope = [
    ...(departure === "UNKNOWN" ? ["where the journey started"] : []),
    ...(arrival === "UNKNOWN" ? ["the final destination"] : []),
    ...(carrier === "UNKNOWN" ? ["the operating airline's home region"] : []),
  ];
  const uncertainBooking = flightCase.disruptionType === "missed_connection" && !/^yes$/i.test(booking);
  const vagueReason = /operational|no specific|first flight delay/i.test(reason);
  const cancellationFactsMissing = flightCase.disruptionType === "cancellation" && !Number.isFinite(cancellationNotice);
  const deniedBoardingFactsMissing = flightCase.disruptionType === "denied_boarding" && (!/^(yes|no)$/i.test(boardingReady) || !/^(yes|no)$/i.test(volunteered) || !/^(yes|no)$/i.test(validDocuments));
  const frameworks = missingScope.length ? [] : frameworkFor(departure, arrival, carrier);
  const ruleIds = idsFor(frameworks, flightCase.disruptionType);
  const materialUnknowns = [...missingScope, ...(uncertainBooking ? ["whether all flights were on one booking"] : []), ...(cancellationFactsMissing ? ["when you were told about the cancellation"] : []), ...(deniedBoardingFactsMissing ? ["whether you were ready to travel, volunteered, and had valid documents"] : []), ...(vagueReason ? ["the airline's specific disruption cause and evidence"] : [])];
  const prohibitedClaims = ["guaranteed_compensation", "legal_representation", "unsupported_threat", "invented_citation"];

  if (missingScope.length || !Number.isFinite(delay) || cancellationFactsMissing || deniedBoardingFactsMissing) return { caseState: "NEEDS_DETAIL", frameworkCandidates: frameworks, possibleRoutes: ["confirm_scope_facts"], materialUnknowns: [...materialUnknowns, ...(!Number.isFinite(delay) ? ["final arrival delay"] : [])], exceptionStatus: "UNRESOLVED", ruleIds, sourceCardIds: ruleIds, allowedClaims: ["request_clarification"], prohibitedClaims };
  if (!frameworks.length) return { caseState: "OUT_OF_SCOPE", frameworkCandidates: [], possibleRoutes: ["show_official_resources"], materialUnknowns: [], exceptionStatus: "NOT_RAISED", ruleIds: [], sourceCardIds: [], allowedClaims: ["request_clarification"], prohibitedClaims };
  if (uncertainBooking) return { caseState: "NEEDS_DETAIL", frameworkCandidates: frameworks, possibleRoutes: ["confirm_booking_structure", "request_reason_detail"], materialUnknowns, exceptionStatus: "UNRESOLVED", ruleIds, sourceCardIds: ruleIds, allowedClaims: ["request_clarification"], prohibitedClaims };
  if (flightCase.disruptionType === "delay" && delay < 180) return { caseState: "DIFFERENT_ROUTE", frameworkCandidates: frameworks, possibleRoutes: ["request_expense_reimbursement"], materialUnknowns: [], exceptionStatus: "NOT_RAISED", ruleIds, sourceCardIds: ruleIds, allowedClaims: ["request_expense_reimbursement"], prohibitedClaims };
  return { caseState: "LIKELY_WORTH_PURSUING", frameworkCandidates: frameworks, possibleRoutes: vagueReason ? ["compensation_review", "request_reason_detail"] : ["compensation_review"], materialUnknowns, exceptionStatus: vagueReason ? "UNRESOLVED" : "INSUFFICIENT_EVIDENCE", ruleIds, sourceCardIds: ruleIds, allowedClaims: ["request_reassessment", "request_clarification", "request_expense_reimbursement"], prohibitedClaims };
}

export type CompensationGuide = { amount: number | null; currency: "GBP" | "EUR" | null; reason: string; sourceUrl: string; framework: RuleFramework | null };

export function calculateCompensation(flightCase: FlightCase): CompensationGuide {
  const assessment = evaluateFlightCase(flightCase);
  const frameworks = assessment.frameworkCandidates;
  const framework = frameworks.includes("UK261") ? "UK261" : frameworks.includes("EU261") ? "EU261" : null;
  const distance = Number(factValue(flightCase, "flight_distance_km"));
  const delay = Number(factValue(flightCase, "final_arrival_delay_minutes"));
  const reason = String(factValue(flightCase, "airline_reason") ?? "");
  const sourceUrl = framework === "EU261" ? "https://europa.eu/youreurope/citizens/travel/passenger-rights/air/index_en.htm" : "https://www.caa.co.uk/air-passengers/travel-problems-and-rights/flight-delays-and-cancellations/delays/";
  if (!framework) return { amount: null, currency: null, framework: null, sourceUrl, reason: "Momo cannot safely calculate compensation until it knows which flight rules apply." };
  if (assessment.caseState !== "LIKELY_WORTH_PURSUING") return { amount: null, currency: null, framework, sourceUrl, reason: "Momo needs the missing case details before it can show a possible fixed amount." };
  if (flightCase.disruptionType !== "delay" && flightCase.disruptionType !== "missed_connection") return { amount: null, currency: null, framework, sourceUrl, reason: "Momo needs the cancellation notice and rerouting details, or the denied-boarding facts, before it can show a possible fixed amount." };
  if (!Number.isFinite(distance) || distance <= 0) return { amount: null, currency: null, framework, sourceUrl, reason: "Momo needs the flight distance before it can show a possible fixed amount." };
  if (!Number.isFinite(delay) || delay < 180) return { amount: null, currency: null, framework, sourceUrl, reason: "For a delay claim, Momo needs a final-arrival delay of at least three hours before it can show a possible fixed amount." };
  if (/weather|air traffic control|security|extraordinary/i.test(reason)) return { amount: null, currency: null, framework, sourceUrl, reason: "The airline's stated cause may be outside normal control. Momo will not state a fixed amount until the airline's evidence and reasonable measures can be reviewed." };
  if (framework === "EU261") {
    const intraEu = String(factValue(flightCase, "journey_is_intra_eu") ?? "");
    if (distance > 3500 && !/^(yes|no)$/i.test(intraEu)) return { amount: null, currency: null, framework, sourceUrl, reason: "Momo needs to know whether the whole journey stayed within the EU/EEA/Switzerland before it can choose the correct EU long-distance band." };
    const amount = distance <= 1500 ? 250 : distance <= 3500 || /^yes$/i.test(intraEu) ? 400 : delay < 240 ? 300 : 600;
    return { amount, currency: "EUR", framework, sourceUrl, reason: `EU guidance lists €${amount} per person for an eligible delay in this distance and delay band. Rerouting and the airline's evidence can still affect the final result.` };
  }
  if (distance <= 1500) return { amount: 220, currency: "GBP", framework, sourceUrl, reason: "UK CAA guidance lists £220 per person for an eligible flight up to 1,500 km." };
  if (distance <= 3500) return { amount: 350, currency: "GBP", framework, sourceUrl, reason: "UK CAA guidance lists £350 per person for an eligible flight from 1,500 to 3,500 km." };
  if (delay <= 240) return { amount: 260, currency: "GBP", framework, sourceUrl, reason: "UK CAA guidance lists £260 per person for an eligible flight over 3,500 km arriving three to four hours late." };
  return { amount: 520, currency: "GBP", framework, sourceUrl, reason: "UK CAA guidance lists £520 per person for an eligible flight over 3,500 km arriving more than four hours late." };
}

/** @deprecated Use calculateCompensation. Kept while existing integrations migrate. */
export function calculateUkCompensation(flightCase: FlightCase) {
  const guide = calculateCompensation(flightCase);
  return { amountGbp: guide.currency === "GBP" ? guide.amount : null, reason: guide.reason, sourceUrl: guide.sourceUrl };
}
