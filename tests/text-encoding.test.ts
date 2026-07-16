import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(process.cwd(), "src");
const extensions = /\.(ts|tsx|css)$/;
const mojibakeMarkers = [
  String.fromCodePoint(0x00c2, 0x00a3), // broken pound sign
  String.fromCodePoint(0x00e2, 0x20ac, 0x00a6), // broken ellipsis
  String.fromCodePoint(0x00e2, 0x2020, 0x2019), // broken right arrow
  String.fromCodePoint(0x00f0, 0x0178), // beginning of a broken emoji
];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return extensions.test(entry.name) ? [path] : [];
  });
}

test("shipped source does not contain common UTF-8 mojibake sequences", () => {
  const offenders = sourceFiles(root).flatMap((file) => {
    const text = readFileSync(file, "utf8");
    return mojibakeMarkers.some((marker) => text.includes(marker)) ? [file] : [];
  });

  assert.deepEqual(offenders, []);
});
