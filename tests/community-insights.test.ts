import assert from "node:assert/strict";
import test from "node:test";
import { cleanAirline, delayBand, money, needsResearch } from "../src/lib/community-insights";

const cases = [
  ["British Airways operational delay", "British   Airways", 195, "3_to_4h"],
  ["easyJet technical delay", "easyJet", 242, "4h_plus"],
  ["Ryanair weather cancellation", "Ryanair", 0, "under_3h"],
  ["Virgin Atlantic crew delay", "Virgin Atlantic", 179, "under_3h"],
  ["KLM air traffic control disruption", "KLM", 180, "3_to_4h"],
  ["Lufthansa denied boarding", "Lufthansa", 480, "4h_plus"],
  ["Air France missed connection", "Air France", 215, "3_to_4h"],
  ["Emirates unspecified reason", "Emirates", 75, "under_3h"],
  ["Qatar Airways long delay", "Qatar Airways", 660, "4h_plus"],
  ["Turkish Airlines uncertain delay", "Turkish Airlines", null, "unknown"],
] as const;

for (const [name, airline, delay, expectedBand] of cases) {
  test(`${name} is safely normalised for anonymous learning`, () => {
    assert.ok(cleanAirline(airline));
    assert.equal(delayBand(delay), expectedBand);
    assert.equal(needsResearch(9, false), true, "fewer than ten outcomes should allow an official-source check");
    assert.equal(needsResearch(10, false), false, "ten outcomes should use the anonymous pattern instead");
  });
}

test("anonymous learning rejects unsafe or unreasonable values", () => {
  assert.equal(cleanAirline("<script>alert(1)</script>"), null);
  assert.equal(cleanAirline(""), null);
  assert.equal(money("50000.005"), null);
  assert.equal(money("250.50"), 250.5);
  assert.equal(delayBand(-1), "unknown");
});
