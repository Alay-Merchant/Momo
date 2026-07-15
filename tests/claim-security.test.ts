import assert from "node:assert/strict";
import test from "node:test";
import { isSafeEvidence, safeEvidenceName } from "../src/lib/claim-security";

test("evidence validation accepts supported file signatures only", () => {
  assert.equal(isSafeEvidence("application/pdf", new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])), true);
  assert.equal(isSafeEvidence("image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47])), true);
  assert.equal(isSafeEvidence("image/jpeg", new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), true);
  assert.equal(isSafeEvidence("image/jpeg", new Uint8Array([0x25, 0x50, 0x44, 0x46])), false);
  assert.equal(safeEvidenceName("../../booking<>.pdf"), ".._.._booking__.pdf");
});
