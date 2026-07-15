const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);

export function safeEvidenceName(name: string) {
  const clean = name.normalize("NFKC").replace(/[^a-zA-Z0-9._ -]/g, "_").replace(/\s+/g, " ").trim().slice(0, 120);
  return clean || "evidence";
}

export function isSafeEvidence(type: string, bytes: Uint8Array) {
  if (!ALLOWED_TYPES.has(type) || bytes.byteLength === 0 || bytes.byteLength > MAX_FILE_BYTES) return false;
  if (type === "application/pdf") return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  if (type === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export { MAX_FILE_BYTES };
