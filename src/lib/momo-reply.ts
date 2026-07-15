export type MomoReply = { explanation: string; draft: string; questions: string[] };

function cleanText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function parseMomoReply(value: string): MomoReply {
  const candidate = value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;
    const explanation = cleanText(parsed.explanation, 1_200);
    const draft = cleanText(parsed.draft, 4_000);
    const questions = Array.isArray(parsed.questions) ? parsed.questions.map((question) => cleanText(question, 220)).filter(Boolean).slice(0, 3) : [];
    if (explanation && draft) return { explanation, draft, questions };
  } catch { /* A safe plain-text fallback is used below. */ }
  const explanation = cleanText(value, 1_200) || "Momo could not safely interpret that reply yet.";
  return { explanation, draft: "Dear Customer Relations Team,\n\nThank you for your reply. Please identify the specific event that affected my flight and explain how it applied to my journey. Please review my case again using the information I have provided.\n\nKind regards", questions: ["What specific event caused the disruption?"] };
}
