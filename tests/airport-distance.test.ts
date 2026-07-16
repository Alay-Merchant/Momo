import assert from "node:assert/strict";
import test from "node:test";
import { airportDistanceKm } from "../src/lib/airport-distance";

test("airport distance calculates only from two recognised airport codes", () => {
  assert.ok(airportDistanceKm("London Heathrow (LHR)", "New York JFK")! > 5500);
  assert.ok(airportDistanceKm("LHR", "JFK")! < 5600);
});

test("airport distance does not guess from unknown or incomplete routes", () => {
  assert.equal(airportDistanceKm("London", "Rome"), null);
  assert.equal(airportDistanceKm("LHR", "Unknown airport"), null);
});
