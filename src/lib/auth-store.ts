import "server-only";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const globalStore = globalThis as typeof globalThis & {
  momoAuthStore?: { users: Map<string, User>; sessions: Map<string, Session>; attempts: Map<string, { count: number; resetAt: number }> };
};
const store = globalStore.momoAuthStore ??= { users: new Map<string, User>(), sessions: new Map<string, Session>(), attempts: new Map<string, { count: number; resetAt: number }>() };
const users = store.users;
const sessions = store.sessions;
const attempts = store.attempts;
const SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 6;

export type SavedClaim = { id: string; title: string; status: string; savedAt: string };
type User = { id: string; email: string; passwordHash: string; claims: SavedClaim[] };
type Session = { userId: string; expiresAt: number };

export function cleanEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : null;
}

export function validPassword(value: unknown) {
  return typeof value === "string" && value.length >= 12 && value.length <= 128;
}

export function rateLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  current.count += 1;
  return current.count <= MAX_ATTEMPTS;
}

async function hash(password: string, salt = randomBytes(16).toString("hex")) {
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function register(email: string, password: string) {
  if (users.has(email)) return null;
  const user = { id: randomBytes(18).toString("hex"), email, passwordHash: await hash(password), claims: [] };
  users.set(email, user);
  return user;
}

export async function authenticate(email: string, password: string) {
  const user = users.get(email);
  if (!user) return null;
  const [salt, expected] = user.passwordHash.split(":");
  const actual = await hash(password, salt);
  const actualBytes = Buffer.from(actual.split(":")[1], "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes) ? user : null;
}

export function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_AGE_MS });
  return token;
}

export function getUser(token?: string) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) { sessions.delete(token); return null; }
  return [...users.values()].find((user) => user.id === session.userId) ?? null;
}

export function revokeSession(token?: string) { if (token) sessions.delete(token); }

export function saveClaim(user: User, title: string, status: string) {
  const existing = user.claims.find((claim) => claim.title === title);
  if (existing) { existing.status = status; existing.savedAt = new Date().toISOString(); return existing; }
  const claim = { id: randomBytes(12).toString("hex"), title: title.slice(0, 120), status: status.slice(0, 80), savedAt: new Date().toISOString() };
  user.claims.unshift(claim);
  return claim;
}

export const sessionCookie = { name: "momo_session", options: { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: SESSION_AGE_MS / 1000 } };
export function sessionCookieOptions(protocol: string | null) { return { ...sessionCookie.options, secure: protocol === "https" }; }
