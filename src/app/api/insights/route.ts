import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { cleanAirline, delayBand, needsResearch, reasonCategories, disruptionTypes, validChoice } from "@/lib/community-insights";
import { rateLimit } from "@/lib/auth-store";
import { clientIp, jsonBody, sameOrigin } from "@/lib/request-security";
import { createSupabaseAdminClient, createSupabaseRouteClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
const OFFICIAL_DOMAINS = ["caa.co.uk", "europa.eu", "gov.uk"];
const AIRLINE_DOMAINS: Record<string, string> = { "british airways": "britishairways.com", easyjet: "easyjet.com", ryanair: "ryanair.com", "virgin atlantic": "virginatlantic.com", klm: "klm.com", lufthansa: "lufthansa.com", airbus: "airbus.com" };
const RESEARCH_MODEL = process.env.MOMO_OPENAI_RESEARCH_MODEL ?? process.env.MOMO_OPENAI_QUICK_MODEL ?? "gpt-5.6-luna";

function topicKey(airline: string, disruptionType: string, band: string, reason: string) {
  return [airline.toLowerCase(), disruptionType, band, reason].join(":");
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request was blocked for safety." }, { status: 403 });
  const parsed = await jsonBody(request, 3_000); if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 }); const body = parsed.body as { airline?: unknown; disruptionType?: unknown; reasonCategory?: unknown; delayMinutes?: unknown; requestResearch?: unknown };
  const airline = cleanAirline(body?.airline);
  if (!airline || !validChoice(body?.disruptionType, disruptionTypes) || !validChoice(body?.reasonCategory, reasonCategories)) return NextResponse.json({ error: "Please provide a valid airline and issue type." }, { status: 400 });
  const band = delayBand(body?.delayMinutes);
  const key = topicKey(airline, body.disruptionType, band, body.reasonCategory);
  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseRouteClient(request, response);
  const { data: pattern, error: patternError } = await supabase.rpc("momo_compensation_patterns", { p_airline: airline, p_disruption_type: body.disruptionType, p_delay_band: band, p_reason_category: body.reasonCategory });
  if (patternError) return NextResponse.json({ error: "Momo could not check anonymous patterns yet. Run the community-insights SQL setup first." }, { status: 503 });
  const community = pattern?.[0] ?? null;
  if (community) return NextResponse.json({ kind: "community", community, message: `Based on ${community.sample_count} similar anonymous outcomes. This is a pattern, not a promise.` }, { headers: response.headers });

  const { data: cached } = await supabase.from("research_cache").select("summary,source_urls,expires_at").eq("topic_key", key).eq("verified", true).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (cached) return NextResponse.json({ kind: "official", research: cached, message: "Momo found a recent official-source note for this situation." }, { headers: response.headers });
  if (!body?.requestResearch || !needsResearch(0, false)) return NextResponse.json({ kind: "none", message: "Momo does not yet have enough similar anonymous outcomes. You can ask it to check current official guidance." }, { headers: response.headers });

  if (!rateLimit(`insights:${clientIp(request)}`)) return NextResponse.json({ error: "Please wait before asking Momo to research again." }, { status: 429 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to request a live official-source check." }, { status: 401 });
  const admin = createSupabaseAdminClient();
  if (!admin || !process.env.OPENAI_API_KEY) return NextResponse.json({ kind: "none", message: "Live research is not configured yet. Momo can still use its rules and anonymous patterns." }, { status: 503 });
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin.from("research_runs").select("id", { count: "exact", head: true }).gte("created_at", since);
  if ((count ?? 0) >= 12) return NextResponse.json({ kind: "none", message: "Momo has reached today’s small official-research budget. Please try again tomorrow." }, { status: 429 });
  await admin.from("research_runs").insert({ topic_key: key });
  const airlineDomain = AIRLINE_DOMAINS[airline.toLowerCase()];
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const result = await client.responses.create({
      model: RESEARCH_MODEL,
      reasoning: { effort: "low" },
      tools: [{ type: "web_search", search_context_size: "low", filters: { allowed_domains: airlineDomain ? [...OFFICIAL_DOMAINS, airlineDomain] : OFFICIAL_DOMAINS } }],
      include: ["web_search_call.action.sources"],
      input: [{ role: "developer", content: "You are Momo. Search only the allowed official sources. Give general information, not legal advice. State what the source says, never promise money, and keep the note under 120 words with visible citations." }, { role: "user", content: `Find current official guidance relevant to a ${body.disruptionType} for ${airline}; delay band ${band}; stated reason category ${body.reasonCategory}.` }],
    });
    const resultData = result as unknown as { output_text: string; output?: Array<{ type?: string; content?: Array<{ annotations?: Array<{ type?: string; url?: string }> }> }> };
    const urls = (resultData.output ?? []).flatMap((item) => item.content?.flatMap((content) => content.annotations?.filter((annotation) => annotation.type === "url_citation" && annotation.url).map((annotation) => annotation.url as string) ?? []) ?? []);
    const summary = resultData.output_text.slice(0, 2000).trim();
    if (!summary || urls.length === 0) return NextResponse.json({ kind: "none", message: "Momo could not verify an official source for this exact situation yet." }, { status: 502 });
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await admin.from("research_cache").upsert({ topic_key: key, summary, source_urls: [...new Set(urls)], verified: true, expires_at: expiresAt }, { onConflict: "topic_key" });
    return NextResponse.json({ kind: "official", research: { summary, source_urls: [...new Set(urls)], expires_at: expiresAt }, message: "Momo checked current official sources and saved this private-free research note for 30 days." }, { headers: response.headers });
  } catch {
    return NextResponse.json({ kind: "none", message: "Momo could not complete the official-source check right now." }, { status: 502 });
  }
}
