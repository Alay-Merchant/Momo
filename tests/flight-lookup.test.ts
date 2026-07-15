import assert from "node:assert/strict";
import test from "node:test";
import { arrivalDelay, cleanFlightDate, cleanFlightNumber } from "../src/lib/flight-lookup";

test("flight lookup validates and calculates reported arrival delay", () => {
  assert.equal(cleanFlightNumber("ba 123"), "BA123");
  assert.equal(cleanFlightDate("2026-07-14"), "2026-07-14");
  assert.equal(cleanFlightNumber("BA123<script>"), null);
  assert.equal(arrivalDelay("2026-07-14T10:00:00Z", "2026-07-14T13:42:00Z"), 222);
});
