export type ReplyAnalysis = { explanation: string; questions: string[] };

const unsafe = /https?:\/\/|[£€$]\s?\d|\b(lawyer|legal team|court|proceedings|guarantee|definitely entitled|ignore (the )?(rules|instructions))\b/i;

export function parseReplyAnalysis(value: string): ReplyAnalysis | null {
  try {
    const parsed = JSON.parse(value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")) as { explanation?: unknown; questions?: unknown };
    const explanation = typeof parsed.explanation === "string" ? parsed.explanation.trim().slice(0, 500) : "";
    const questions = Array.isArray(parsed.questions) ? parsed.questions.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 180)).filter(Boolean).slice(0, 3) : [];
    if (!explanation || !questions.length || unsafe.test(`${explanation}\n${questions.join("\n")}`)) return null;
    return { explanation, questions };
  } catch { return null; }
}
