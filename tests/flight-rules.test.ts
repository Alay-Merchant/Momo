import assert from "node:assert/strict";
import test from "node:test";
import { flightFixtures } from "../src/lib/fixtures";
import { evaluateFlightCase } from "../src/lib/flight-rules";

const expected: Record<string, "LIKELY_WORTH_PURSUING" | "NEEDS_DETAIL" | "DIFFERENT_ROUTE"> = {
  "africa-connection": "NEEDS_DETAIL", "south-america-short-delay": "DIFFERENT_ROUTE", "asia-delhi-short-delay": "DIFFERENT_ROUTE", "asia-singapore-connection": "NEEDS_DETAIL", "north-america-los-angeles-short": "DIFFERENT_ROUTE", "south-america-buenos-aires-connection": "NEEDS_DETAIL", "europe-istanbul-short": "DIFFERENT_ROUTE",
};

for (const fixture of flightFixtures) {
  test(`${fixture.title} gives a safe, high-quality route`, () => {
    const assessment = evaluateFlightCase(fixture);
    assert.equal(assessment.caseState, expected[fixture.id] ?? "LIKELY_WORTH_PURSUING");
    assert.ok(assessment.ruleIds.length > 0, "must cite at least one rule card");
    assert.ok(assessment.prohibitedClaims.includes("guaranteed_compensation"));
    assert.ok(assessment.allowedClaims.length > 0, "must give a usable next action");
  });
}
