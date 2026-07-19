import assert from "node:assert/strict";
import test from "node:test";
import { extractStoryFacts } from "../src/lib/story-extraction";
import { parseAiStoryFacts } from "../src/lib/story-extraction-ai";

test("story extraction finds only clear draft facts", () => {
  const facts = extractStoryFacts("Our BA123 flight was delayed 12 hours on one booking via Bogota. We were diverted near Leticia.");
  assert.deepEqual(facts, [
    { field: "flight_number", value: "BA123" },
    { field: "final_arrival_delay_minutes", value: 720 },
    { field: "one_booking", value: "Yes" },
    { field: "connection_airports", value: "Bogota" },
    { field: "disruption_location", value: "Leticia" },
  ]);
});

test("AI story extraction accepts only supported, bounded draft facts", () => {
  const facts = parseAiStoryFacts(JSON.stringify({
    facts: [
      { field: "flight_number", value: "BA123" },
      { field: "route", value: "London to Madrid" },
      { field: "final_arrival_delay_minutes", value: 240 },
      { field: "compensation", value: 600 },
      { field: "final_arrival_delay_minutes", value: 999999 },
    ],
  }));
  assert.deepEqual(facts, [
    { field: "flight_number", value: "BA123" },
    { field: "route", value: "London to Madrid" },
    { field: "final_arrival_delay_minutes", value: 240 },
  ]);
});
