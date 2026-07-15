import "server-only";

const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 6;
const globalStore = globalThis as typeof globalThis & { momoAttempts?: Map<string, { count: number; resetAt: number }> };
const attempts = globalStore.momoAttempts ??= new Map<string, { count: number; resetAt: number }>();

export function cleanEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : null;
}

export function validPassword(value: unknown): value is string { return typeof value === "string" && value.length >= 12 && value.length <= 128; }

// This is a local safety belt. Enable Vercel Firewall/rate limiting in production for a durable distributed limit.
export function rateLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt < now) { attempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS }); return true; }
  current.count += 1;
  return current.count <= MAX_ATTEMPTS;
}
