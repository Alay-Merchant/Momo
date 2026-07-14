import type { Assessment, FlightCase, RuleCard } from "@/lib/case-types";

export const flightRuleCards: RuleCard[] = [
  { id: "UK_SCOPE_01", framework: "UK261", plainLanguage: "UK flight-disruption rules may apply to this journey. The exact route and airline still matter.", officialSource: { title: "CAA: Flight delays and cancellations", url: "https://www.caa.co.uk/air-passengers/travel-problems-and-rights/flight-delays-and-cancellations/delays/", reviewedAt: "2026-07-14" } },
  { id: "UK_DELAY_03", framework: "UK261", plainLanguage: "A delay of three hours or more at your final destination can matter when considering compensation.", officialSource: { title: "CAA: Am I entitled to compensation?", url: "https://www.caa.co.uk/air-passengers/travel-problems-and-rights/travel-complaints/making-a-claim/am-i-entitled-to-compensation/", reviewedAt: "2026-07-14" } },
  { id: "UK_EXCEPTION_01", framework: "UK261", plainLanguage: "The cause of a disruption can affect compensation. A broad reason needs more detail before it can be assessed.", officialSource: { title: "CAA: Am I entitled to compensation?", url: "https://www.caa.co.uk/air-passengers/travel-problems-and-rights/travel-complaints/making-a-claim/am-i-entitled-to-compensation/", reviewedAt: "2026-07-14" } },
];

export function evaluateFlightCase(flightCase: FlightCase): Assessment {
  const get = (field: string) => flightCase.facts.find((item) => item.field === field)?.value;
  const delay = get("final_arrival_delay_minutes");
  const minutes = typeof delay === "number" ? delay : Number(delay);
  const reason = String(get("airline_reason") ?? "");
  const booking = String(get("one_booking") ?? "");
  const uncertainBooking = flightCase.disruptionType === "missed_connection" && !/^yes$/i.test(booking);
  const vagueReason = /operational|no specific|first flight delay/i.test(reason);
  const materialUnknowns = [
    ...(uncertainBooking ? ["whether all flights were on one booking"] : []),
    ...(vagueReason ? ["the specific disruption cause"] : []),
  ];

  if (!Number.isFinite(minutes)) return { caseState: "NEEDS_DETAIL", frameworkCandidates: ["UK261"], possibleRoutes: ["request_delay_detail"], materialUnknowns: ["final arrival delay"], exceptionStatus: "UNRESOLVED", ruleIds: ["UK_SCOPE_01"], allowedClaims: ["request_clarification"], prohibitedClaims: ["guaranteed_compensation"] };
  if (uncertainBooking) return { caseState: "NEEDS_DETAIL", frameworkCandidates: ["UK261"], possibleRoutes: ["confirm_booking_structure", "request_reason_detail"], materialUnknowns, exceptionStatus: "UNRESOLVED", ruleIds: ["UK_SCOPE_01", "UK_EXCEPTION_01"], allowedClaims: ["request_clarification"], prohibitedClaims: ["guaranteed_compensation"] };
  if (flightCase.disruptionType === "delay" && minutes < 180) return { caseState: "DIFFERENT_ROUTE", frameworkCandidates: ["UK261"], possibleRoutes: ["request_expense_reimbursement"], materialUnknowns: [], exceptionStatus: "NOT_RAISED", ruleIds: ["UK_SCOPE_01"], allowedClaims: ["request_expense_reimbursement"], prohibitedClaims: ["guaranteed_compensation"] };
  return { caseState: "LIKELY_WORTH_PURSUING", frameworkCandidates: ["UK261"], possibleRoutes: vagueReason ? ["compensation_review", "request_reason_detail"] : ["compensation_review"], materialUnknowns, exceptionStatus: vagueReason ? "UNRESOLVED" : "INSUFFICIENT_EVIDENCE", ruleIds: ["UK_SCOPE_01", "UK_DELAY_03", "UK_EXCEPTION_01"], allowedClaims: ["request_reassessment", "request_clarification"], prohibitedClaims: ["guaranteed_compensation"] };
}

export type CompensationGuide = {
  amountGbp: number | null;
  reason: string;
  sourceUrl: string;
};

export function calculateUkCompensation(flightCase: FlightCase): CompensationGuide {
  const get = (field: string) => flightCase.facts.find((item) => item.field === field)?.value;
  const distance = Number(get("flight_distance_km"));
  const delay = Number(get("final_arrival_delay_minutes"));
  const reason = String(get("airline_reason") ?? "");
  const sourceUrl = "https://www.caa.co.uk/air-passengers/travel-problems-and-rights/flight-delays-and-cancellations/delays/";
  if (!Number.isFinite(distance) || distance <= 0) return { amountGbp: null, reason: "Momo needs the flight distance before it can show a fixed UK261 amount.", sourceUrl };
  if (!Number.isFinite(delay) || delay < 180) return { amountGbp: null, reason: "For a delay claim, Momo needs a final-arrival delay of at least three hours before it can show a fixed amount.", sourceUrl };
  if (/weather|air traffic control|security|extraordinary/i.test(reason)) return { amountGbp: null, reason: "The airline's stated cause may be outside its normal control. Momo will not state a fixed amount until that is resolved.", sourceUrl };
  if (distance <= 1500) return { amountGbp: 220, reason: "UK CAA guidance lists £220 per person for eligible flights up to 1,500 km.", sourceUrl };
  if (distance <= 3500) return { amountGbp: 350, reason: "UK CAA guidance lists £350 per person for eligible flights from 1,500 to 3,500 km.", sourceUrl };
  if (delay < 240) return { amountGbp: 260, reason: "UK CAA guidance lists £260 per person for eligible flights over 3,500 km arriving three to four hours late.", sourceUrl };
  return { amountGbp: 520, reason: "UK CAA guidance lists £520 per person for eligible flights over 3,500 km arriving more than four hours late.", sourceUrl };
}
