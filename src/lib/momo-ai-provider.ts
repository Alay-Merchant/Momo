import "server-only";
import OpenAI from "openai";

export type MomoProvider = "ollama" | "gemini" | "openai" | "demo";

function selectedProvider(): MomoProvider {
  const configured = process.env.MOMO_AI_PROVIDER;
  if (configured === "ollama" || configured === "gemini" || configured === "openai" || configured === "demo") return configured;
  return process.env.NODE_ENV === "production" ? "demo" : "ollama";
}

function demoReply() {
  return JSON.stringify({ explanation: "Momo is in free demo mode, so this is a careful template rather than a personalised AI analysis.", questions: ["What specific event caused the disruption?"], draft: "Dear Customer Relations Team,\n\nThank you for your reply. Please identify the specific event that affected my flight and explain how it applied to my journey. Please review my case again using the information I have provided.\n\nKind regards" });
}

function localOllamaUrl() {
  const value = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
  const url = new URL(value);
  if (!/^(localhost|127\.0\.0\.1|::1)$/i.test(url.hostname)) throw new Error("Ollama must use a local URL.");
  return new URL("/api/generate", url);
}

export async function generateMomoReply(system: string, prompt: string) {
  const provider = selectedProvider();
  if (provider === "demo") return { provider, text: demoReply() };
  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI is not configured.");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({ model: "gpt-5.6-terra", max_output_tokens: 700, input: [{ role: "developer", content: system }, { role: "user", content: prompt }] });
    return { provider, text: response.output_text };
  }
  if (provider === "gemini") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Gemini is not configured.");
    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: "POST", signal: AbortSignal.timeout(20_000), headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", maxOutputTokens: 700 } }) });
    const data = await response.json().catch(() => null) as { candidates?: { content?: { parts?: { text?: string }[] } }[]; error?: { message?: string } } | null;
    const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!response.ok || !text) throw new Error(data?.error?.message ?? "Gemini could not generate a reply.");
    return { provider, text };
  }
  const response = await fetch(localOllamaUrl(), { method: "POST", signal: AbortSignal.timeout(60_000), headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OLLAMA_MODEL ?? "llama3.2:3b", prompt: `${system}\n\n${prompt}`, stream: false, format: "json", options: { num_predict: 700, temperature: 0.2 } }) });
  const data = await response.json().catch(() => null) as { response?: string; error?: string } | null;
  if (!response.ok || !data?.response) throw new Error(data?.error ?? "Ollama could not generate a reply. Run: ollama pull llama3.2:3b");
  return { provider, text: data.response };
}
