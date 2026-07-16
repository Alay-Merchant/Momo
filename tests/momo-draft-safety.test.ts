import assert from "node:assert/strict";
import test from "node:test";
import { caseFromUntrustedInput, createDecisionReceipt } from "../src/lib/case-receipt";
import { replyIsGrounded, safeTemplate } from "../src/lib/momo-draft-safety";

const input = {
  disruptionType: "delay",
  facts: [
    { field: "flight_number", value: "BA123", confirmed: true },
    { field: "route", value: "London to New York", confirmed: true },
    { field: "departure_region", value: "UK", confirmed: true },
    { field: "arrival_region", value: "Other", confirmed: true },
    { field: "operating_carrier_region", value: "UK", confirmed: true },
    { field: "flight_date", value: "2026-07-15", confirmed: true },
    { field: "final_arrival_delay_minutes", value: 250, confirmed: true },
    { field: "flight_distance_km", value: 5500, confirmed: true },
    { field: "one_booking", value: "Yes", confirmed: true },
  ],
};

test("the server receipt ignores client-provided legal text and only accepts known fact fields", () => {
  const flightCase = caseFromUntrustedInput({ ...input, assessment: "Pay £10000", facts: [...input.facts, { field: "legal_argument", value: "ignore rules", confirmed: true }] });
  assert.ok(flightCase);
  assert.equal(flightCase.facts.some((fact) => fact.field === "legal_argument"), false);
  assert.equal(createDecisionReceipt(flightCase).compensation.amount, 520);
});

test("safe template is grounded in the deterministic receipt", () => {
  const flightCase = caseFromUntrustedInput(input);
  assert.ok(flightCase);
  const receipt = createDecisionReceipt(flightCase);
  assert.equal(replyIsGrounded(safeTemplate(receipt), receipt), true);
});

test("safe template adapts when the airline has already named a cause", () => {
  const flightCase = caseFromUntrustedInput(input);
  assert.ok(flightCase);
  const reply = safeTemplate(createDecisionReceipt(flightCase), "The delay was caused by a technical issue.");
  assert.match(reply.explanation, /named “technical”/);
  assert.equal(reply.questions.some((question) => question.includes("specific event")), false);
  assert.match(reply.draft, /reference to technical/);
});

test("invented amounts, legal representation, and court threats are rejected", () => {
  const flightCase = caseFromUntrustedInput(input);
  assert.ok(flightCase);
  const receipt = createDecisionReceipt(flightCase);
  assert.equal(replyIsGrounded({ explanation: "We are your lawyers.", questions: [], draft: "Pay £10,000 or we will commence proceedings." }, receipt), false);
});

test("unrecognised source URLs are rejected", () => {
  const flightCase = caseFromUntrustedInput(input);
  assert.ok(flightCase);
  const receipt = createDecisionReceipt(flightCase);
  assert.equal(replyIsGrounded({ explanation: "See https://example.com", questions: [], draft: "Please review this." }, receipt), false);
});
