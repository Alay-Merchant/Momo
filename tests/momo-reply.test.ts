import assert from "node:assert/strict";
import test from "node:test";
import { parseMomoReply } from "../src/lib/momo-reply";

test("Momo reply parser keeps a valid structured response", () => {
  const reply = parseMomoReply('{"explanation":"The airline has not named the event.","questions":["What happened?"],"draft":"Dear airline, please explain the event."}');
  assert.equal(reply.explanation, "The airline has not named the event.");
  assert.equal(reply.draft, "Dear airline, please explain the event.");
  assert.deepEqual(reply.questions, ["What happened?"]);
});

test("Momo reply parser has a safe fallback for invalid provider output", () => {
  const reply = parseMomoReply("A plain explanation from the provider.");
  assert.match(reply.draft, /Please identify the specific event/);
  assert.equal(reply.questions.length, 1);
});
