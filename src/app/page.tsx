"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AccountPanel, { type AccountUser } from "@/app/account-panel";
import { CommunityInsights, OutcomePanel } from "@/app/community-panels";
import FlightLookup from "@/app/flight-lookup";
import SocialProofTicker from "@/app/social-proof-ticker";
import type { CaseFact, FlightCase } from "@/lib/case-types";
import { createBlankFlightCase, flightFixtures } from "@/lib/fixtures";
import { calculateUkCompensation, evaluateFlightCase, flightRuleCards } from "@/lib/flight-rules";

type Screen = "start" | "facts" | "result" | "reply" | "draft";
type ReplyEvent = { id: string; author: "airline" | "momo"; text: string; draft?: string; addedAt: string };

const stateCopy = { READY_TO_SEND: "Your information supports sending this claim.", LIKELY_WORTH_PURSUING: "This may be worth pursuing.", NEEDS_DETAIL: "Momo needs one more detail first.", DIFFERENT_ROUTE: "Compensation is uncertain, but you may still be able to ask for help." };

function Panda() { return <span aria-label="Momo the panda" role="img" className="panda">🐼</span>; }
function Pill({ children, kind = "blue" }: { children: React.ReactNode; kind?: "blue" | "green" | "amber" }) { return <span className={`pill ${kind}`}>{children}</span>; }
function lookupDate(value: string | number | null | undefined) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : ""; }

function requiredFact(facts: CaseFact[], field: string) {
  const value = facts.find((fact) => fact.field === field)?.value;
  return value !== null && value !== "" && value !== 0;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("start");
  const [caseData, setCaseData] = useState<FlightCase>(createBlankFlightCase);
  const [facts, setFacts] = useState<CaseFact[]>(() => createBlankFlightCase().facts);
  const [reply, setReply] = useState("");
  const [replyHistory, setReplyHistory] = useState<ReplyEvent[]>([]);
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [journeyMessage, setJourneyMessage] = useState("");
  const [account, setAccount] = useState<AccountUser | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const assessment = useMemo(() => evaluateFlightCase({ ...caseData, facts }), [caseData, facts]);
  const compensation = useMemo(() => calculateUkCompensation({ ...caseData, facts }), [caseData, facts]);
  const factsReady = ["flight_number", "route", "flight_date", "final_arrival_delay_minutes"].every((field) => requiredFact(facts, field));
  const latestAirlineReply = replyHistory.filter((event) => event.author === "airline").at(-1)?.text ?? "";
  const confirmedCount = facts.filter((fact) => fact.confirmed).length;
  const assessmentSummary = `${stateCopy[assessment.caseState]} UK261 rules considered: ${assessment.ruleIds.join(", ")}. Important unknowns: ${assessment.materialUnknowns.join(", ") || "none"}.`;

  const startOwnCase = () => {
    const blank = createBlankFlightCase();
    setCaseData(blank); setFacts(blank.facts); setReply(""); setReplyHistory([]); setGeneratedDraft(""); setJourneyMessage(""); setScreen("facts");
  };
  const chooseSample = () => {
    const sample = flightFixtures[0];
    setCaseData(sample); setFacts(sample.facts); setReply(sample.airlineReply); setReplyHistory([]); setGeneratedDraft(""); setJourneyMessage(""); setScreen("facts");
  };
  const goTo = (next: Screen) => {
    if ((next === "result" || next === "reply") && !factsReady) return setJourneyMessage("Before continuing, add your flight number, journey, travel date, and arrival delay. You can add the rest later.");
    if (next === "draft" && !generatedDraft) return setJourneyMessage("Add the airline's reply and ask Momo to prepare a message first.");
    setJourneyMessage(""); setScreen(next);
  };
  const updateFact = (id: string, value: string) => setFacts((current) => current.map((fact) => fact.id === id ? { ...fact, value: fact.field === "final_arrival_delay_minutes" ? Number(value) || null : value, confirmed: false, sourceLabel: "You told Momo" } : fact));
  const updateDelay = (hours: string, minutes: string) => {
    const total = Math.max(0, Math.min(10_080, (Number(hours) || 0) * 60 + (Number(minutes) || 0)));
    setFacts((current) => current.map((fact) => fact.field === "final_arrival_delay_minutes" ? { ...fact, value: total || null, confirmed: false, sourceLabel: "You told Momo" } : fact));
  };
  const updateDistance = (value: string) => setFacts((current) => {
    const distance = Number(value) || null;
    const existing = current.find((fact) => fact.field === "flight_distance_km");
    return existing ? current.map((fact) => fact.field === "flight_distance_km" ? { ...fact, value: distance, confirmed: Boolean(distance), sourceLabel: "You told Momo" } : fact) : [...current, { id: "distance", field: "flight_distance_km", label: "Flight distance", value: distance, provenance: "USER_STATED_UNCONFIRMED", sourceLabel: "You told Momo", confirmed: Boolean(distance) }];
  });
  const confirmFacts = () => setFacts((current) => current.map((fact) => ({ ...fact, confirmed: fact.value !== null && fact.value !== "" })));
  const addReply = () => {
    const text = reply.trim();
    if (!text) return setReplyStatus("Paste the airline's message first.");
    setReplyHistory((history) => [...history, { id: crypto.randomUUID(), author: "airline", text, addedAt: new Date().toLocaleString("en-GB") }]);
    setReply(""); setReplyStatus("Airline reply added to your private case story.");
    return text;
  };
  const generateReply = async () => {
    const text = reply.trim() || latestAirlineReply;
    if (!text) return setReplyStatus("Paste an airline reply before asking Momo for help.");
    if (reply.trim()) addReply();
    setReplyStatus("Momo is reading the reply and checking the confirmed facts…");
    try {
      const response = await fetch("/api/momo/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reply: text, assessment: assessmentSummary, facts: facts.filter((fact) => fact.confirmed).map(({ label, value }) => ({ label, value })), compensation }) });
      const data = await response.json();
      if (!response.ok) return setReplyStatus(data.error ?? "Momo could not prepare a reply right now.");
      const draft = data.draft || data.explanation;
      setGeneratedDraft(draft);
      setReplyHistory((history) => [...history, { id: crypto.randomUUID(), author: "momo", text: data.explanation, draft, addedAt: new Date().toLocaleString("en-GB") }]);
      setReplyStatus("Momo prepared a draft using your confirmed facts. Please read and edit it before sending.");
    } catch { setReplyStatus("Momo could not connect right now. Your airline reply is still kept in this browser."); }
  };
  const saveClaim = async () => {
    const response = await fetch("/api/claims", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: caseData.title, status: stateCopy[assessment.caseState], caseData: { disruptionType: caseData.disruptionType, facts, replyHistory, generatedDraft } }) });
    const data = await response.json();
    if (!response.ok) return setSaveMessage("Create an account or sign in to save your whole claim story.");
    setAccount(data.user); setSaveMessage("Your claim and conversation were saved. You can return to them from your account menu.");
  };
  const copyDraft = async () => { await navigator.clipboard?.writeText(generatedDraft); setCopied(true); };

  return <main className="momo-app">
    <header className="topbar"><button className="brand" onClick={() => setScreen("start")}><Panda /><span>Momo</span></button><span className="tagline">Your calm next step</span><Link className="nav-button" href="/help">What can I help with?</Link><AccountPanel onUserChange={setAccount}/></header>
    {screen === "start" && <><SocialProofTicker /><section className="landing"><div className="hero-copy"><div className="momo-welcome"><Panda /><span className="speech">Hello, I&apos;m Momo. What happened?</span></div><Pill kind="green">Private by design · no account needed</Pill><h1>Check your disrupted UK flight in about three minutes.</h1><p>Start with what you know. Momo turns your story and airline messages into a clear next step, at your pace.</p><div className="hero-actions"><button className="primary" onClick={startOwnCase}>Start my case <span>→</span></button><button className="secondary" onClick={chooseSample}>View a sample case</button></div><p className="small">UK261 guidance only. Momo gives general information and drafting support; it is not a law firm and does not promise an outcome.</p></div><div className="hero-card welcome-scene"><div className="paper-plane">✈</div><div className="scene-path"><span>1</span><i></i><span>2</span><i></i><span>3</span></div><h2>One small step at a time.</h2><p>Tell Momo what happened. Add the airline&apos;s reply. Then see what to do next.</p><div className="mini-row"><span>✓</span><div><b>You stay in control</b><small>Momo never sends anything for you.</small></div></div></div></section></>}
    {screen !== "start" && <><nav className="progress" aria-label="Case progress"><button type="button" onClick={() => goTo("facts")} className={screen === "facts" ? "active" : "done"}>1. Check facts</button><button type="button" onClick={() => goTo("result")} className={screen === "result" ? "active" : ["reply", "draft"].includes(screen) ? "done" : ""}>2. What Momo found</button><button type="button" onClick={() => goTo("reply")} className={screen === "reply" ? "active" : screen === "draft" ? "done" : ""}>3. Airline reply</button><button type="button" onClick={() => goTo("draft")} className={screen === "draft" ? "active" : ""}>4. Your message</button></nav>{journeyMessage && <p className="journey-message" role="status">{journeyMessage}</p>}<section className="workspace">
      {screen === "facts" && <><div className="section-heading"><Panda /><div><h1>Tell Momo the key details</h1><p>Start with what you know. You can add more later, and Momo only uses facts you confirm.</p></div></div><label className="disruption-picker">What happened?<select value={caseData.disruptionType} onChange={(event) => setCaseData((current) => ({ ...current, disruptionType: event.target.value as FlightCase["disruptionType"] }))}><option value="delay">My flight was delayed</option><option value="cancellation">My flight was cancelled</option><option value="denied_boarding">I was denied boarding</option><option value="missed_connection">I missed a connection</option></select></label><div className="facts">{facts.filter((fact) => fact.field !== "flight_distance_km").map((fact) => <div className="fact" key={fact.id}><div><label htmlFor={fact.id}>{fact.label}</label><small>{fact.field === "final_arrival_delay_minutes" ? "How late did you reach your final destination?" : fact.sourceLabel}</small></div>{fact.field === "final_arrival_delay_minutes" ? <div className="delay-inputs"><label>Hours<input type="number" min="0" max="168" value={Math.floor(Number(fact.value ?? 0) / 60)} onChange={(event) => updateDelay(event.target.value, String(Number(fact.value ?? 0) % 60))}/></label><label>Minutes<input type="number" min="0" max="59" value={Number(fact.value ?? 0) % 60} onChange={(event) => updateDelay(String(Math.floor(Number(fact.value ?? 0) / 60)), event.target.value)}/></label></div> : <input id={fact.id} value={fact.value ?? ""} onChange={(event) => updateFact(fact.id, event.target.value)} placeholder={fact.field === "airline_reason" ? "Optional — paste the reason when you have it" : ""}/>}<Pill kind={fact.confirmed ? "green" : requiredFact(facts, fact.field) ? "blue" : "amber"}>{fact.confirmed ? "Checked" : requiredFact(facts, fact.field) ? "Added" : "Add if you know"}</Pill></div>)}<div className="fact"><div><label htmlFor="distance">Flight distance in kilometres</label><small>Optional. It helps Momo show a possible fixed UK261 amount.</small></div><input id="distance" type="number" min="1" value={facts.find((fact) => fact.field === "flight_distance_km")?.value ?? ""} onChange={(event) => updateDistance(event.target.value)}/><Pill kind="amber">Optional</Pill></div></div><FlightLookup flightNumber={String(facts.find((fact) => fact.field === "flight_number")?.value ?? "")} flightDate={lookupDate(facts.find((fact) => fact.field === "flight_date")?.value)} onUseDelay={(minutes) => updateDelay(String(Math.floor(minutes / 60)), String(minutes % 60))}/><div className="actions"><button className="secondary" onClick={() => setScreen("start")}>Back</button><button className="primary" onClick={() => { if (!factsReady) return goTo("result"); confirmFacts(); goTo("result"); }}>These facts look right <span>→</span></button></div></>}
      {screen === "result" && <><div className="section-heading"><Panda /><div><h1>Here is what Momo found</h1><p>Based on {confirmedCount} details you checked and current UK261 rule cards.</p></div></div><div className="assessment-grid"><article className="result-card feature"><Pill kind={assessment.caseState === "DIFFERENT_ROUTE" ? "amber" : "green"}>{stateCopy[assessment.caseState]}</Pill><h2>{assessment.caseState === "NEEDS_DETAIL" ? "Momo needs one more detail before it can suggest a fair next move." : "A calm, evidence-led next step is ready."}</h2><p>Momo will be clear about anything it does not know. It never promises compensation.</p></article><article className="result-card"><h3>Why this matters</h3><p>{flightRuleCards.find((card) => card.id === assessment.ruleIds[1])?.plainLanguage ?? flightRuleCards[0].plainLanguage}</p><a href={flightRuleCards[0].officialSource.url} target="_blank" rel="noreferrer">See official CAA information ↗</a></article><article className="result-card"><h3>What could change this</h3>{assessment.materialUnknowns.length ? <ul>{assessment.materialUnknowns.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No important detail is missing from your current information.</p>}</article></div><section className="compensation-card"><h2>{compensation.amountGbp ? `Possible fixed compensation: £${compensation.amountGbp} per person` : "Momo cannot safely state a fixed amount yet"}</h2><p>{compensation.reason}</p><a href={compensation.sourceUrl} target="_blank" rel="noreferrer">Check the official CAA guidance ↗</a></section><CommunityInsights disruptionType={caseData.disruptionType} delayMinutes={Number(facts.find((fact) => fact.field === "final_arrival_delay_minutes")?.value ?? 0) || null}/><div className="save-claim"><div><b>{account ? "Keep this claim in your account" : "Want to come back to this later?"}</b><p>Your estimate is free. Create an account only when you want to save your case story.</p></div><button className="secondary" onClick={saveClaim}>{account ? "Save my claim" : "Save with an account"}</button></div>{saveMessage && <p className="save-message" role="status">{saveMessage}</p>}<div className="actions"><button className="secondary" onClick={() => goTo("facts")}>Edit facts</button><button className="primary" onClick={() => goTo("reply")}>Add airline reply <span>→</span></button></div></>}
      {screen === "reply" && <><div className="section-heading"><Panda /><div><h1>Talk through the airline&apos;s replies</h1><p>Paste each reply. Momo will explain it and prepare an editable, evidence-led next message.</p></div></div><section className="case-chat" aria-label="Your claim conversation"><div className="chat-intro"><Panda /><div><b>Momo</b><p>I&apos;ll keep the important details together. You stay in control of every message.</p></div></div>{replyHistory.length > 0 && <div className="chat-thread">{replyHistory.map((event) => <article className={`chat-bubble ${event.author}`} key={event.id}><b>{event.author === "momo" ? "Momo" : "Airline reply"}</b><small>{event.addedAt}</small><p>{event.text}</p>{event.author === "momo" && <button className="text-button" onClick={() => { setGeneratedDraft(event.draft ?? ""); goTo("draft"); }}>Open this draft</button>}</article>)}</div>}<div className="chat-composer"><label htmlFor="reply">What did the airline say?</label><textarea id="reply" value={reply} onChange={(event) => setReply(event.target.value)} maxLength={5000} placeholder="Paste the latest airline message here…"/><div className="reply-actions"><button className="secondary" onClick={addReply}>Add airline reply</button><button className="primary" onClick={generateReply}>Ask Momo for a reply <span>→</span></button></div><small>Momo uses your confirmed facts and the latest reply. Please check and edit its draft before sending.</small>{replyStatus && <p className="insight-message" role="status">{replyStatus}</p>}</div></section><div className="actions"><button className="secondary" onClick={() => goTo("result")}>Back</button><button className="primary" onClick={() => goTo("draft")}>Open latest message <span>→</span></button></div></>}
      {screen === "draft" && <><div className="section-heading"><Panda /><div><h1>Your editable message</h1><p>Read it, edit it, and only send it yourself when it feels right.</p></div></div><div className="trust"><span>✓</span><div><b>Why you can trust this draft</b><p>It uses {confirmedCount} checked details and the UK261 rule cards above. It does not guarantee an outcome.</p></div></div><label className="letter-label" htmlFor="letter">Message to the airline</label><textarea id="letter" className="letter" value={generatedDraft} onChange={(event) => setGeneratedDraft(event.target.value)} maxLength={5000}/><div className="actions"><button className="secondary" onClick={() => goTo("reply")}>Edit case story</button><button className="primary" onClick={copyDraft}>{copied ? "Copied to clipboard ✓" : "Copy my message"}</button></div><p className="send-note">Momo cannot send this for you. Paste it into the airline&apos;s official claim or complaint channel when you are ready.</p><OutcomePanel disruptionType={caseData.disruptionType} delayMinutes={Number(facts.find((fact) => fact.field === "final_arrival_delay_minutes")?.value ?? 0) || null}/></>}
    </section></>}<footer className="site-footer"><span>© {new Date().getFullYear()} Momo · Calm support for flight disruption claims</span><Link href="/terms">Terms &amp; privacy summary</Link></footer>
  </main>;
}
