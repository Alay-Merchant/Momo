import "server-only";

import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { clientIp } from "@/lib/request-security";

type AiRoute = "story" | "reply" | "evidence";

const memory = new Map<string, { count: number; resetAt: number }>();
const limits: Record<AiRoute, { perWindow: number; windowSeconds: number }> = {
  story: { perWindow: 8, windowSeconds: 900 },
  reply: { perWindow: 6, windowSeconds: 900 },
  evidence: { perWindow: 2, windowSeconds: 900 },
};

function localLimit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const current = memory.get(key);
  if (!current || current.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1_000 });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

function subjectFor(request: NextRequest) {
  // The database receives a one-way identifier, never the visitor's raw IP.
  const salt = process.env.MOMO_RATE_LIMIT_SALT;
  const identity = clientIp(request);
  return createHash("sha256").update(`${salt ?? "local-only"}:${identity}`).digest("hex");
}

async function consumeDurableQuota(bucket: string, subject: string, limit: number, windowSeconds: number) {
  const supabase = createSupabaseAdminClient();
  if (!supabase || !process.env.MOMO_RATE_LIMIT_SALT) return null;
  const { data, error } = await supabase.rpc("momo_consume_rate_limit", {
    p_bucket: bucket,
    p_subject_hash: subject,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error || typeof data !== "boolean") return null;
  return data;
}

/**
 * Applies a short burst limit and a daily spend guard. When the provided
 * Supabase migration and server-only salt are configured, both are durable
 * across Vercel instances. The memory limiter remains a local safety belt.
 */
export async function allowAiRequest(request: NextRequest, route: AiRoute) {
  const config = limits[route];
  const subject = subjectFor(request);
  if (!localLimit(`burst:${route}:${subject}`, config.perWindow, config.windowSeconds)) return false;

  const burst = await consumeDurableQuota(`ai:${route}:burst`, subject, config.perWindow, config.windowSeconds);
  if (burst === false) return false;

  const dailyLimit = Math.max(1, Math.min(500, Number(process.env.MOMO_GUEST_AI_DAILY_LIMIT ?? 30) || 30));
  const daily = await consumeDurableQuota("ai:guest:daily", subject, dailyLimit, 86_400);
  return daily !== false;
}
