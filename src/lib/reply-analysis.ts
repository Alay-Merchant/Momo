export type ReplyAnalysis = { explanation: string; questions: string[] };

// Model language may only describe missing information. It cannot make a legal
// finding; the deterministic decision receipt remains the sole authority.
const unsafe = /https?:\/\/|[\u00a3\u20ac$]\s?\d|\b(lawyer|legal team|court|proceedings|guarantee|definitely entitled|entitled|eligible|eligibility|liable|liability|legal conclusion|legal finding|breach|violation|regulation|ec261|uk261|demand payment|compensation is due|ignore (the )?(rules|instructions))\b/i;

export function parseReplyAnalysis(value: string): ReplyAnalysis | null {
  try {
    const parsed = JSON.parse(value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")) as { explanation?: unknown; questions?: unknown };
    const explanation = typeof parsed.explanation === "string" ? parsed.explanation.trim().slice(0, 500) : "";
    const questions = Array.isArray(parsed.questions) ? parsed.questions.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 180)).filter(Boolean).slice(0, 3) : [];
    if (!explanation || !questions.length || unsafe.test(`${explanation}\n${questions.join("\n")}`)) return null;
    return { explanation, questions };
  } catch { return null; }
}
