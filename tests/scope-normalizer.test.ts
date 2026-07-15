import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAirportScope } from "../src/lib/scope-normalizer";

test("known airport codes establish scope without guessing from free text", () => {
  assert.deepEqual(normalizeAirportScope("lhr"), { code: "LHR", region: "UK" });
  assert.deepEqual(normalizeAirportScope("cdg"), { code: "CDG", region: "EU_EEA_CH" });
  assert.deepEqual(normalizeAirportScope("jfk"), { code: "JFK", region: "UNKNOWN" });
});
