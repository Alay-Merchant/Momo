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
