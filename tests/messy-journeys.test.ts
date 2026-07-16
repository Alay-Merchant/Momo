import assert from "node:assert/strict";
import test from "node:test";
import { messyJourneyFixtures } from "../src/lib/fixtures";
import { evaluateFlightCase } from "../src/lib/flight-rules";

test("messy journey fixtures keep connection and self-transfer uncertainty explicit", () => {
  assert.equal(messyJourneyFixtures.length, 5);
  const diverted = evaluateFlightCase(messyJourneyFixtures[0]);
  assert.ok(["LIKELY_WORTH_PURSUING", "NEEDS_DETAIL"].includes(diverted.caseState));
  const selfTransfer = evaluateFlightCase(messyJourneyFixtures[3]);
  assert.equal(selfTransfer.caseState, "NEEDS_DETAIL");
  assert.match(selfTransfer.materialUnknowns.join(" "), /one booking/i);
});
