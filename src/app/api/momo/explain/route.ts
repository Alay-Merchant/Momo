import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const MAX_TEXT = 5_000;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (typeof body?.reply !== "string" || body.reply.length > MAX_TEXT || typeof body?.assessment !== "string" || body.assessment.length > 2_000) {
    return NextResponse.json({ error: "Please provide a short airline reply and assessment." }, { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OpenAI is not configured yet. Add OPENAI_API_KEY on the server to enable this optional explanation." }, { status: 503 });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: "gpt-5.6-terra",
    input: [
      { role: "developer", content: "You are Momo, a calm general-information and drafting assistant. Use only the supplied text. Never provide legal advice, promise compensation, invent facts, accuse an airline, or use em dashes. Write at a UK reading age of 10 to 12 in no more than 90 words." },
      { role: "user", content: `Deterministic assessment: ${body.assessment}\n\nAirline reply: ${body.reply}\n\nExplain what the reply says, what it does not explain, and the fairest next question.` },
    ],
  });
  return NextResponse.json({ explanation: response.output_text });
}
