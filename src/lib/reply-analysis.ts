export type ReplyAnalysis = { explanation: string; questions: string[] };

// Model language may only describe missing information. It cannot make a legal
// finding; the deterministic decision receipt remains the sole authority.
const unsafe = /https?:\/\/|[\u00a3\u20ac$]\s?\d|\b(lawyer|legal team|court|proceedings|guarantee|definitely entitled|entitled|eligible|eligibility|liable|liability|legal conclusion|legal finding|breach|violation|regulation|ec261|uk261|demand payment|compensation is due|ignore (the )?(rules|instructions))\b/i;
const causeTerms = ["technical", "operational", "weather", "crew", "strike", "maintenance", "air traffic", "security", "rotation", "staffing", "aircraft"];

/** Model prose may only repeat a stated operational cause, never introduce one. */
export function isGroundedNarrative(value: string, airlineReply: string) {
  const lowerValue = value.toLowerCase();
  const lowerReply = airlineReply.toLowerCase();
  if (causeTerms.some((term) => lowerValue.includes(term) && !lowerReply.includes(term))) return false;
  const numbers = value.match(/\b\d+(?:[.:/-]\d+)*\b/g) ?? [];
  return numbers.every((number) => airlineReply.includes(number));
}

export function parseReplyAnalysis(value: string, airlineReply = ""): ReplyAnalysis | null {
  try {
    const parsed = JSON.parse(value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")) as { explanation?: unknown; questions?: unknown };
    const explanation = typeof parsed.explanation === "string" ? parsed.explanation.trim().slice(0, 500) : "";
    const questions = Array.isArray(parsed.questions) ? parsed.questions.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 180)).filter(Boolean).slice(0, 3) : [];
    const narrative = `${explanation}\n${questions.join("\n")}`;
    if (!explanation || !questions.length || unsafe.test(narrative) || !isGroundedNarrative(narrative, airlineReply)) return null;
    return { explanation, questions };
  } catch { return null; }
}
