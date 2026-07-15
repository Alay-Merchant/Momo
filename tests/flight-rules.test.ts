import assert from "node:assert/strict";
import test from "node:test";
import type { FlightCase } from "../src/lib/case-types";
import { calculateCompensation, evaluateFlightCase, flightRuleCards } from "../src/lib/flight-rules";
import { regulationCards, ruleCardProblems } from "../src/lib/regulations/library";

function caseFor(overrides: Record<string, string | number | null>, disruptionType: FlightCase["disruptionType"] = "delay"): FlightCase {
  return {
    id: "test", title: "Test flight", disruptionType, airlineReply: "", facts: Object.entries(overrides).map(([field, value]) => ({
      id: field, field, label: field, value, provenance: "USER_CONFIRMED", sourceLabel: "test", confirmed: true,
    })),
  };
}

const base = { departure_region: "UK", arrival_region: "OTHER", operating_carrier_region: "UK", final_arrival_delay_minutes: 250, flight_distance_km: 5000, one_booking: "Yes" };

const scenarios: Array<{ name: string; facts: Record<string, string | number | null>; state: string; frameworks: string[]; amount?: number | null; currency?: string | null }> = [
  { name: "UK departure applies to any operator", facts: { ...base, operating_carrier_region: "OTHER" }, state: "LIKELY_WORTH_PURSUING", frameworks: ["UK261"], amount: 520, currency: "GBP" },
  { name: "UK inbound on UK operator is in scope", facts: { ...base, departure_region: "OTHER", arrival_region: "UK", operating_carrier_region: "UK" }, state: "LIKELY_WORTH_PURSUING", frameworks: ["UK261"], amount: 520, currency: "GBP" },
  { name: "UK inbound on EU operator is in scope", facts: { ...base, departure_region: "OTHER", arrival_region: "UK", operating_carrier_region: "EU" }, state: "LIKELY_WORTH_PURSUING", frameworks: ["UK261"], amount: 520, currency: "GBP" },
  { name: "UK inbound on non-UK/EU operator is safely out of scope", facts: { ...base, departure_region: "OTHER", arrival_region: "UK", operating_carrier_region: "OTHER" }, state: "OUT_OF_SCOPE", frameworks: [], amount: null, currency: null },
  { name: "EU departure applies to any operator", facts: { ...base, departure_region: "EU", arrival_region: "OTHER", operating_carrier_region: "OTHER", flight_distance_km: 1400 }, state: "LIKELY_WORTH_PURSUING", frameworks: ["EU261"], amount: 250, currency: "EUR" },
  { name: "EU inbound on EU operator is in scope", facts: { ...base, departure_region: "OTHER", arrival_region: "EU", operating_carrier_region: "EU" }, state: "LIKELY_WORTH_PURSUING", frameworks: ["EU261"], amount: null, currency: null },
  { name: "EU inbound on non-EU operator is safely out of scope", facts: { ...base, departure_region: "OTHER", arrival_region: "EU", operating_carrier_region: "OTHER" }, state: "OUT_OF_SCOPE", frameworks: [], amount: null, currency: null },
  { name: "UK carrier to EU is not incorrectly treated as UK261-covered", facts: { ...base, departure_region: "OTHER", arrival_region: "EU", operating_carrier_region: "UK" }, state: "OUT_OF_SCOPE", frameworks: [], amount: null, currency: null },
  { name: "missing carrier is never guessed", facts: { ...base, operating_carrier_region: null }, state: "NEEDS_DETAIL", frameworks: [], amount: null, currency: null },
  { name: "missing route scope is never guessed", facts: { ...base, departure_region: null }, state: "NEEDS_DETAIL", frameworks: [], amount: null, currency: null },
  { name: "179-minute UK delay follows a different remedy path", facts: { ...base, final_arrival_delay_minutes: 179 }, state: "DIFFERENT_ROUTE", frameworks: ["UK261"], amount: null, currency: null },
  { name: "180-minute UK delay reaches the compensation threshold", facts: { ...base, final_arrival_delay_minutes: 180, flight_distance_km: 1500 }, state: "LIKELY_WORTH_PURSUING", frameworks: ["UK261"], amount: 220, currency: "GBP" },
  { name: "UK 1501km band is £350", facts: { ...base, flight_distance_km: 1501 }, state: "LIKELY_WORTH_PURSUING", frameworks: ["UK261"], amount: 350, currency: "GBP" },
  { name: "UK long-haul 3h59 band is £260", facts: { ...base, final_arrival_delay_minutes: 239 }, state: "LIKELY_WORTH_PURSUING", frameworks: ["UK261"], amount: 260, currency: "GBP" },
  { name: "UK long-haul exact four-hour band is £260", facts: { ...base, final_arrival_delay_minutes: 240 }, state: "LIKELY_WORTH_PURSUING", frameworks: ["UK261"], amount: 260, currency: "GBP" },
  { name: "UK long-haul more-than-four-hour band is £520", facts: { ...base, final_arrival_delay_minutes: 241 }, state: "LIKELY_WORTH_PURSUING", frameworks: ["UK261"], amount: 520, currency: "GBP" },
  { name: "EU 1501km band is €400", facts: { ...base, departure_region: "EU", operating_carrier_region: "OTHER", flight_distance_km: 1501 }, state: "LIKELY_WORTH_PURSUING", frameworks: ["EU261"], amount: 400, currency: "EUR" },
  { name: "EU long-haul amount waits for the intra-EU route fact", facts: { ...base, departure_region: "EU", operating_carrier_region: "OTHER", flight_distance_km: 3501 }, state: "LIKELY_WORTH_PURSUING", frameworks: ["EU261"], amount: null, currency: null },
  { name: "EU non-intra-EU long-haul three-to-under-four-hour band is €300", facts: { ...base, departure_region: "EU", operating_carrier_region: "OTHER", flight_distance_km: 3501, final_arrival_delay_minutes: 239, journey_is_intra_eu: "No" }, state: "LIKELY_WORTH_PURSUING", frameworks: ["EU261"], amount: 300, currency: "EUR" },
  { name: "EU non-intra-EU long-haul four-hour band is €600", facts: { ...base, departure_region: "EU", operating_carrier_region: "OTHER", flight_distance_km: 3501, final_arrival_delay_minutes: 240, journey_is_intra_eu: "No" }, state: "LIKELY_WORTH_PURSUING", frameworks: ["EU261"], amount: 600, currency: "EUR" },
  { name: "EU intra-EU long-haul band is €400", facts: { ...base, departure_region: "EU", arrival_region: "EU", operating_carrier_region: "EU", flight_distance_km: 3501, journey_is_intra_eu: "Yes" }, state: "LIKELY_WORTH_PURSUING", frameworks: ["EU261"], amount: 400, currency: "EUR" },
  { name: "weather remains contested rather than an automatic loss", facts: { ...base, airline_reason: "Weather disruption" }, state: "LIKELY_WORTH_PURSUING", frameworks: ["UK261"], amount: null, currency: null },
  { name: "missed connection needs a single booking confirmed", facts: { ...base, one_booking: "Not sure" }, state: "NEEDS_DETAIL", frameworks: ["UK261"], amount: null, currency: null },
  { name: "separate tickets are not treated as one protected itinerary", facts: { ...base, one_booking: "No" }, state: "NEEDS_DETAIL", frameworks: ["UK261"], amount: null, currency: null },
];

for (const scenario of scenarios) {
  test(scenario.name, () => {
    const flightCase = caseFor(scenario.facts, scenario.name.includes("connection") || scenario.name.includes("tickets") ? "missed_connection" : "delay");
    const assessment = evaluateFlightCase(flightCase);
    const compensation = calculateCompensation(flightCase);
    assert.equal(assessment.caseState, scenario.state);
    assert.deepEqual(assessment.frameworkCandidates, scenario.frameworks);
    assert.equal(compensation.amount, scenario.amount ?? null);
    assert.equal(compensation.currency, scenario.currency ?? null);
    assert.ok(assessment.prohibitedClaims.includes("guaranteed_compensation"));
    assert.ok(assessment.prohibitedClaims.includes("legal_representation"));
  });
}

test("every active rule card is versioned and cites HTTPS official guidance", () => {
  for (const card of flightRuleCards.filter((card) => card.status === "in_force")) {
    assert.ok(card.version);
    assert.ok(card.reviewDueAt);
    assert.match(card.officialSource.url, /^https:\/\//);
  }
});

test("active rule cards have current review dates and cannot silently become stale", () => {
  assert.deepEqual(ruleCardProblems(regulationCards, "2026-07-16"), []);
  assert.match(ruleCardProblems([{ ...regulationCards[0], reviewDueAt: "2026-07-15" }], "2026-07-16")[0], /overdue/);
});

test("cancellation waits for notice timing before assessing a fixed amount", () => {
  const assessment = evaluateFlightCase(caseFor(base, "cancellation"));
  assert.equal(assessment.caseState, "NEEDS_DETAIL");
  assert.ok(assessment.materialUnknowns.includes("when you were told about the cancellation"));
  assert.equal(calculateCompensation(caseFor(base, "cancellation")).amount, null);
});

test("denied boarding waits for readiness, volunteer, and document facts", () => {
  const assessment = evaluateFlightCase(caseFor(base, "denied_boarding"));
  assert.equal(assessment.caseState, "NEEDS_DETAIL");
  assert.ok(assessment.materialUnknowns.some((item) => item.includes("volunteered")));
  assert.equal(calculateCompensation(caseFor(base, "denied_boarding")).amount, null);
});
