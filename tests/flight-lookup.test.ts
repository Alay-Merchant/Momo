import assert from "node:assert/strict";
import test from "node:test";
import { arrivalDelay, cleanFlightDate, cleanFlightNumber, toFlightLookupResult } from "../src/lib/flight-lookup";

test("flight lookup validates and calculates reported arrival delay", () => {
  assert.equal(cleanFlightNumber("ba 123"), "BA123");
  assert.equal(cleanFlightDate("2026-07-14"), "2026-07-14");
  assert.equal(cleanFlightNumber("BA123<script>"), null);
  assert.equal(arrivalDelay("2026-07-14T10:00:00Z", "2026-07-14T13:42:00Z"), 222);
});

test("AeroDataBox records prefer UTC times and calculate the public arrival delay", () => {
  const result = toFlightLookupResult({
    number: "BA123",
    airline: { name: "British Airways" },
    status: "Delayed",
    departure: { scheduledTime: { utc: "2026-07-14T08:00:00Z" }, actualTime: { utc: "2026-07-14T08:31:00Z" } },
    arrival: { scheduledTime: { utc: "2026-07-14T10:00:00Z" }, actualTime: { utc: "2026-07-14T12:13:00Z" } },
  }, "BA123");
  assert.equal(result.actualArrival, "2026-07-14T12:13:00Z");
  assert.equal(result.arrivalDelayMinutes, 133);
  assert.equal(result.airline, "British Airways");
});
