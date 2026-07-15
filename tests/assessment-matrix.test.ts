import assert from "node:assert/strict";
import test from "node:test";
import type { FlightCase } from "../src/lib/case-types";
import { calculateCompensation, evaluateFlightCase } from "../src/lib/flight-rules";

const scopes = [
  ["UK", "OTHER", "OTHER", true], ["OTHER", "UK", "UK", true], ["OTHER", "UK", "EU", true], ["EU", "OTHER", "OTHER", true], ["OTHER", "EU", "EU", true],
  ["OTHER", "UK", "OTHER", false], ["OTHER", "EU", "OTHER", false], ["OTHER", "EU", "UK", false], ["", "OTHER", "UK", false], ["UK", "", "UK", false],
] as const;
const disruptions: FlightCase["disruptionType"][] = ["delay", "missed_connection", "cancellation", "denied_boarding"];

function makeCase(departure: string, arrival: string, carrier: string, disruptionType: FlightCase["disruptionType"], delay: number): FlightCase {
  const facts = { departure_region: departure, arrival_region: arrival, operating_carrier_region: carrier, final_arrival_delay_minutes: delay, flight_distance_km: 5000, one_booking: "Yes", journey_is_intra_eu: "No" } as Record<string, string | number>;
  return { id: "matrix", title: "Matrix", disruptionType, airlineReply: "", facts: Object.entries(facts).map(([field, value]) => ({ id: field, field, label: field, value, provenance: "USER_CONFIRMED", sourceLabel: "test", confirmed: true })) };
}

for (const [departure, arrival, carrier, covered] of scopes) {
  for (const disruptionType of disruptions) {
    for (const delay of [120, 180, 240]) {
      test(`safety matrix ${departure || "unknown"}-${arrival || "unknown"}-${carrier || "unknown"} ${disruptionType} ${delay}`, () => {
        const flightCase = makeCase(departure, arrival, carrier, disruptionType, delay);
        const assessment = evaluateFlightCase(flightCase);
        const compensation = calculateCompensation(flightCase);
        if (!covered) {
          assert.notEqual(assessment.caseState, "LIKELY_WORTH_PURSUING");
          assert.equal(compensation.amount, null);
        }
        if (disruptionType === "cancellation" || disruptionType === "denied_boarding") assert.equal(compensation.amount, null);
        if (delay < 180) assert.equal(compensation.amount, null);
        assert.ok(assessment.prohibitedClaims.includes("guaranteed_compensation"));
      });
    }
  }
}
