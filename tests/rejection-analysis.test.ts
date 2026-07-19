import assert from "node:assert/strict";
import test from "node:test";
import { fallbackRejectionAnalysis, parseRejectionAnalysis } from "../src/lib/rejection-analysis";
import { parseReplyAnalysis } from "../src/lib/reply-analysis";

const reply = "We cannot offer compensation because a technical fault was an extraordinary circumstance outside our control.";

test("dissection accepts only exact quoted airline text", () => {
  const analysis = parseRejectionAnalysis(JSON.stringify({ summary: "The airline gave a broad reason.", strategy: "Ask for a flight-specific explanation.", claims: [{ quote: "a technical fault was an extraordinary circumstance", status: "incomplete", explanation: "The reply does not explain the event or measures taken.", question: "What happened on this flight?" }] }), reply);
  assert.ok(analysis);
  assert.equal(analysis.claims[0].status, "incomplete");
});

test("dissection rejects invented quotes, amounts, and legal threats", () => {
  const invented = JSON.stringify({ summary: "The airline owes \u00a3520.", strategy: "Take them to court.", claims: [{ quote: "The plane was broken", status: "unsupported", explanation: "Guaranteed win", question: "Pay now" }] });
  assert.equal(parseRejectionAnalysis(invented, reply), null);
});

test("dissection fails closed when the structured section is missing or malformed", () => {
  assert.equal(parseRejectionAnalysis(JSON.stringify({ summary: "A broad reason", strategy: "Ask for detail", claims: [] }), reply), null);
  assert.equal(parseRejectionAnalysis("not json", reply), null);
});

test("model analysis rejects unsupported legal or eligibility conclusions", () => {
  assert.equal(parseReplyAnalysis(JSON.stringify({ explanation: "You qualify under EC261.", questions: ["What happened?"] })), null);
  assert.equal(parseRejectionAnalysis(JSON.stringify({ summary: "You are entitled to payment.", strategy: "Demand payment.", claims: [{ quote: "technical fault", status: "unsupported", explanation: "The airline is legally liable.", question: "Why?" }] }), reply), null);
});

test("model analysis rejects an invented disruption cause or number", () => {
  assert.equal(parseReplyAnalysis(JSON.stringify({ explanation: "The airline says a crew shortage caused the delay.", questions: ["What crew event happened?"] }), reply), null);
  assert.equal(parseRejectionAnalysis(JSON.stringify({ summary: "The airline cited technical trouble.", strategy: "Ask what happened in 2025.", claims: [{ quote: "technical fault", status: "incomplete", explanation: "The reason needs more detail.", question: "What happened?" }] }), reply), null);
});

test("deterministic dissection treats operational and technical explanations as incomplete", () => {
  const analysis = fallbackRejectionAnalysis(reply);
  assert.equal(analysis?.claims[0].status, "incomplete");
  assert.match(analysis?.claims[0].question ?? "", /specific event/i);
});

test("deterministic weather dissection remains cautious", () => {
  const analysis = fallbackRejectionAnalysis("We cannot offer compensation because severe weather at the departure airport affected the scheduled service.");
  assert.equal(analysis?.claims[0].status, "needs_check");
  assert.match(analysis?.claims[0].question ?? "", /weather affected this particular flight/i);
});
