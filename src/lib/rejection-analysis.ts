import { isGroundedNarrative } from "@/lib/reply-analysis";

export type ClaimCheck = "needs_check" | "incomplete" | "unsupported";
export type RejectionClaim = { quote: string; status: ClaimCheck; explanation: string; question: string };
export type RejectionAnalysis = { summary: string; claims: RejectionClaim[]; strategy: string };

const prohibited = /https?:\/\/|[\u00a3\u20ac$]\s?\d|\b(lawyer|legal team|court|proceedings|guarantee|definitely entitled|entitled|eligible|eligibility|liable|liability|legal conclusion|legal finding|breach|violation|regulation|ec261|uk261|demand payment|compensation is due|ignore (the )?(rules|instructions))\b/i;
const statuses = new Set<ClaimCheck>(["needs_check", "incomplete", "unsupported"]);
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export function parseRejectionAnalysis(value: string, airlineReply: string): RejectionAnalysis | null {
  try {
    const parsed = JSON.parse(value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")) as Record<string, unknown>;
    const summary = clean(parsed.summary, 600);
    const strategy = clean(parsed.strategy, 400);
    const claims = Array.isArray(parsed.claims) ? parsed.claims.map((item) => {
      const entry = item as Record<string, unknown>;
      return { quote: clean(entry.quote, 320), status: entry.status, explanation: clean(entry.explanation, 420), question: clean(entry.question, 220) };
    }).filter((claim): claim is RejectionClaim => Boolean(claim.quote && claim.explanation && claim.question && typeof claim.status === "string" && statuses.has(claim.status as ClaimCheck) && airlineReply.includes(claim.quote))).slice(0, 3) : [];
    const text = `${summary}\n${strategy}\n${claims.map((claim) => `${claim.explanation}\n${claim.question}`).join("\n")}`;
    return summary && strategy && claims.length && !prohibited.test(text) && isGroundedNarrative(text, airlineReply) ? { summary, strategy, claims } : null;
  } catch { return null; }
}

function sentenceContaining(reply: string, pattern: RegExp) {
  return reply.split(/(?<=[.!?])\s+/).find((sentence) => pattern.test(sentence))?.trim() ?? "";
}

export function fallbackRejectionAnalysis(reply: string): RejectionAnalysis | null {
  const quote = sentenceContaining(reply, /technical|operational|weather|air traffic|crew|strike|security/i);
  if (!quote) return null;
  const status: ClaimCheck = /operational|technical|crew/i.test(quote) ? "incomplete" : "needs_check";
  const question = /weather/i.test(quote) ? "What evidence shows that weather affected this particular flight and what reasonable measures were considered?" : "What specific event affected this flight, and what reasonable measures did the airline consider or take?";
  return { summary: "Momo has identified the airline's stated reason. It remains the airline's account until the airline explains how it applied to this flight.", strategy: "Ask for a clear, evidence-led explanation rather than accepting a broad label.", claims: [{ quote, status, explanation: status === "incomplete" ? "This explanation is too broad on its own. Momo cannot treat it as proof that compensation is unavailable." : "This reason may matter, but Momo needs a flight-specific explanation before drawing a conclusion.", question }] };
}
