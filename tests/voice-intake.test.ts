import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("voice intake requires consent and does not upload audio", () => {
  const source = readFileSync("src/app/story-intake.tsx", "utf8");
  assert.match(source, /allow this browser to request microphone access/i);
  assert.match(source, /disabled=\{!consent \|\| listening\}/);
  assert.doesNotMatch(source, /fetch\(|FormData|audio\//);
});
