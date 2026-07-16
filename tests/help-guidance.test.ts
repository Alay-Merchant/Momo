import assert from "node:assert/strict";
import test from "node:test";
import { getHelpGuide, helpGuides } from "../src/lib/help-guidance";

test("every visible Help topic has a tailored destination", () => {
  assert.deepEqual(Object.keys(helpGuides).sort(), ["cancellation", "delay", "denied_boarding", "expenses", "hub", "international", "lookup", "missed_connection", "offer", "rejection"]);
  for (const topic of Object.keys(helpGuides)) {
    const guide = getHelpGuide(topic);
    assert.ok(guide?.title.length);
    assert.ok(guide?.description.length);
    assert.ok(guide?.nextAction.length);
  }
});

test("airline refusal and offer guides do not route to a generic facts screen", () => {
  assert.equal(getHelpGuide("rejection")?.screen, "reply");
  assert.equal(getHelpGuide("offer")?.screen, "result");
  assert.equal(getHelpGuide("lookup")?.screen, "facts");
});
