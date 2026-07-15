"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import AccountPanel, { type AccountUser } from "@/app/account-panel";
import { CommunityInsights, OutcomePanel } from "@/app/community-panels";
import SocialProofTicker from "@/app/social-proof-ticker";
import FlightLookup from "@/app/flight-lookup";
import type { Assessment, CaseFact, FlightCase } from "@/lib/case-types";
import { flightFixtures } from "@/lib/fixtures";
import { calculateUkCompensation, evaluateFlightCase, flightRuleCards } from "@/lib/flight-rules";

type Screen = "start" | "facts" | "result" | "reply" | "draft";
type ReplyEvent = { id: string; text: string; attachment?: string; addedAt: string };

const stateCopy = {
  READY_TO_SEND: "Your information supports sending this claim.",
  LIKELY_WORTH_PURSUING: "This may be worth pursuing.",
  NEEDS_DETAIL: "Momo needs one more detail first.",
  DIFFERENT_ROUTE: "Compensation is uncertain, but you may still be able to ask for help.",
};

function Panda() {
  return <span aria-label="Momo the panda" role="img" className="panda">🐼</span>;
}

function Pill({ children, kind = "blue" }: { children: React.ReactNode; kind?: "blue" | "green" | "amber" }) {
  return <span className={`pill ${kind}`}>{children}</span>;
}

function recommendedText(assessment: Assessment, caseData: FlightCase) {
  const unknown = assessment.materialUnknowns[0];
  if (assessment.caseState === "DIFFERENT_ROUTE") return "Ask the airline to consider any reasonable expenses you had because of the delay. Keep your receipts.";
  if (assessment.caseState === "NEEDS_DETAIL") return `Find out ${unknown}. Momo will then be able to suggest a fair next move.`;
  if (caseData.disruptionType === "cancellation") return "Ask the airline to review your cancelled-flight case and explain the basis for its decision.";
  if (caseData.disruptionType === "denied_boarding") return "Ask the airline to explain why you could not board and review your case using your confirmed journey details.";
  return "Ask the airline to review your case again and explain the specific event behind its broad reason.";
}

function lookupDate(value: string | number | null | undefined) {
  if (typeof value !== "string") return "";
  const date = Date.parse(value);
  return Number.isFinite(date) ? new Date(date).toISOString().slice(0, 10) : "";
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("start");
  const [caseData, setCaseData] = useState<FlightCase>(flightFixtures[0]);
  const [facts, setFacts] = useState<CaseFact[]>(flightFixtures[0].facts);
  const [reply, setReply] = useState(flightFixtures[0].airlineReply);
  const [replyHistory, setReplyHistory] = useState<ReplyEvent[]>([]);
  const [copied, setCopied] = useState(false);
  const [uploadNote, setUploadNote] = useState("");
  const [account, setAccount] = useState<AccountUser | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const editedLetter = useRef("");
  const assessment = useMemo(() => evaluateFlightCase({ ...caseData, facts }), [caseData, facts]);
  const compensation = useMemo(() => calculateUkCompensation({ ...caseData, facts }), [caseData, facts]);
  const latestReply = replyHistory.at(-1)?.text ?? reply;
  const offeredAmount = Number(latestReply.match(/£\s?(\d{2,4})/)?.[1] ?? 0);
  const negotiationGuidance = compensation.amountGbp === null
    ? compensation.reason
    : offeredAmount > 0 && offeredAmount < compensation.amountGbp
      ? `The airline appears to offer £${offeredAmount}. Based on the confirmed facts, ask it to explain the difference and review the fixed £${compensation.amountGbp} per-person amount.`
      : `Based on the confirmed facts, the evidence-backed amount to ask the airline to review is £${compensation.amountGbp} per person, plus separately evidenced reasonable expenses.`;
  const confirmedCount = facts.filter((fact) => fact.confirmed).length;
  const draft = `Subject: Request to review ${facts.find((fact) => fact.field === "flight_number")?.value ?? "my flight"} case\n\nDear Customer Relations Team,\n\nI am writing to ask you to review my case again. My journey was ${facts.find((fact) => fact.field === "route")?.value ?? "disrupted"} on ${facts.find((fact) => fact.field === "flight_date")?.value ?? "the date of travel"}.\n\nYour reply refers to “${facts.find((fact) => fact.field === "airline_reason")?.value ?? "the disruption"}”. Please identify the specific event behind this reason and explain how it affected my flight.${compensation.amountGbp ? ` Based on the confirmed distance and arrival delay, I ask you to review compensation of £${compensation.amountGbp} per person, as well as any separately evidenced reasonable expenses.` : ""} I ask that you reconsider my case using the information attached.\n\nThank you for your time.\n\nKind regards`;

  const chooseCase = (next: FlightCase) => {
    setCaseData(next);
    setFacts(next.facts);
    setReply(next.airlineReply);
    setReplyHistory([]);
    setScreen("facts");
    setCopied(false);
  };
  const updateFact = (id: string, value: string) => setFacts((current) => current.map((fact) => fact.id === id ? { ...fact, value: fact.field === "final_arrival_delay_minutes" ? Number(value) || null : value } : fact));
  const updateDelay = (hours: string, minutes: string) => { const total = Math.max(0, Math.min(10_080, (Number(hours) || 0) * 60 + (Number(minutes) || 0))); setFacts((current) => current.map((fact) => fact.field === "final_arrival_delay_minutes" ? { ...fact, value: total, confirmed: false } : fact)); };
  const updateDistance = (value: string) => setFacts((current) => {
    const distance = Number(value) || null;
    const existing = current.find((fact) => fact.field === "flight_distance_km");
    return existing ? current.map((fact) => fact.field === "flight_distance_km" ? { ...fact, value: distance, confirmed: distance !== null } : fact) : [...current, { id: "distance", field: "flight_distance_km", label: "Flight distance", value: distance, provenance: "USER_STATED_UNCONFIRMED", sourceLabel: "You told Momo", confirmed: distance !== null }];
  });
  const confirmFacts = () => setFacts((current) => current.map((fact) => ({ ...fact, confirmed: fact.value !== null && fact.value !== "" })));
  const copyDraft = async () => { await navigator.clipboard?.writeText(editedLetter.current || draft); setCopied(true); };
  const fileSelected = (file?: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return setUploadNote("That file is over 10 MB. Please choose a smaller file.");
    if (!/^(application\/pdf|image\/(png|jpeg))$/.test(file.type)) return setUploadNote("Please choose a PDF, PNG, or JPG file.");
    setUploadNote(`${file.name} is ready. In the secure demo, Momo keeps it in this browser only.`);
  };
  const addReply = (attachment?: File) => {
    const text = reply.trim();
    if (!text && !attachment) return;
    setReplyHistory((history) => [...history, { id: crypto.randomUUID(), text: text || "Reply added as an attachment.", attachment: attachment?.name, addedAt: new Date().toLocaleString("en-GB") }]);
    setReply("");
  };
  const saveClaim = async () => {
    const response = await fetch("/api/claims", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: caseData.title, status: stateCopy[assessment.caseState] }) });
    const data = await response.json();
    if (!response.ok) return setSaveMessage("Create an account or sign in to save this claim.");
    setAccount((current) => current ? { ...current, claims: [data.claim, ...current.claims.filter((claim) => claim.id !== data.claim.id)] } : current);
    setSaveMessage("Claim saved. You can return to it from your account menu.");
  };

  return <main>
    <header className="topbar"><button className="brand" onClick={() => setScreen("start")}><Panda /><span>Momo</span></button><span className="tagline">Your calm next step</span><Link className="text-button" href="/help">What can I help with?</Link><AccountPanel onUserChange={setAccount}/></header>

    {screen === "start" && <><SocialProofTicker /><section className="landing">
      <div className="hero-copy"><div className="momo-welcome"><Panda /><span className="speech">Hello, I&apos;m Momo. What happened?</span></div><Pill kind="green">Private by design · no account needed</Pill><h1>A calm guide when your flight does not go to plan.</h1><p>Start with what you know. Momo turns your story and airline messages into a clear next step, at your pace.</p><div className="hero-actions"><button className="primary" onClick={() => setScreen("facts")}>Tell Momo what happened <span>→</span></button><button className="secondary" onClick={() => chooseCase(flightFixtures[0])}>Show me an example</button></div><p className="small">Momo gives general information and drafting support. It is not a law firm and does not promise an outcome.</p></div>
      <div className="hero-card welcome-scene"><div className="paper-plane">✈</div><div className="bamboo bamboo-one">🎋</div><div className="bamboo bamboo-two">🎋</div><div className="scene-path"><span>1</span><i></i><span>2</span><i></i><span>3</span></div><h2>One small step at a time.</h2><p>Tell Momo what happened. Add the airline&apos;s reply. Then see what to do next.</p><div className="mini-row"><span>✓</span><div><b>You stay in control</b><small>Momo never sends anything for you.</small></div></div></div>
    </section></>}

    {screen !== "start" && <><div className="progress" aria-label="Case progress"><span className={screen === "facts" ? "active" : "done"}>1. Check facts</span><span className={screen === "result" ? "active" : ["reply", "draft"].includes(screen) ? "done" : ""}>2. What Momo found</span><span className={screen === "reply" ? "active" : screen === "draft" ? "done" : ""}>3. Explain reply</span><span className={screen === "draft" ? "active" : ""}>4. Your message</span></div>
    <section className="workspace">
      {screen === "facts" && <><div className="section-heading"><Panda /><div><h1>Please check what Momo found</h1><p>You can change anything. Momo only uses facts you confirm.</p></div></div><div className="upload"><label htmlFor="evidence">Add a booking, screenshot, or airline email <span>PDF, PNG or JPG · up to 10 MB</span></label><input id="evidence" type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => fileSelected(event.target.files?.[0])}/>{uploadNote && <p role="status">{uploadNote}</p>}</div><div className="facts">{facts.filter((fact) => fact.field !== "flight_distance_km").map((fact) => <div className="fact" key={fact.id}><div><label htmlFor={fact.id}>{fact.label}</label><small>{fact.sourceLabel}</small></div>{fact.field === "final_arrival_delay_minutes" ? <div className="delay-inputs"><label>Hours<input type="number" min="0" max="168" value={Math.floor(Number(fact.value ?? 0) / 60)} onChange={(event) => updateDelay(event.target.value, String(Number(fact.value ?? 0) % 60))}/></label><label>Minutes<input type="number" min="0" max="59" value={Number(fact.value ?? 0) % 60} onChange={(event) => updateDelay(String(Math.floor(Number(fact.value ?? 0) / 60)), event.target.value)}/></label></div> : <input id={fact.id} value={fact.value ?? ""} onChange={(event) => updateFact(fact.id, event.target.value)} aria-label={fact.label}/>}<Pill kind={fact.confirmed ? "green" : fact.sourceLabel.includes("needs") ? "amber" : "blue"}>{fact.confirmed ? "Confirmed" : fact.sourceLabel.includes("needs") ? "Needed" : "Found"}</Pill></div>)}<div className="fact"><div><label htmlFor="distance">Flight distance in kilometres</label><small>Used only to show a UK261 fixed compensation amount</small></div><input id="distance" type="number" min="1" value={facts.find((fact) => fact.field === "flight_distance_km")?.value ?? ""} onChange={(event) => updateDistance(event.target.value)} aria-label="Flight distance in kilometres"/><Pill kind={facts.some((fact) => fact.field === "flight_distance_km" && fact.value) ? "blue" : "amber"}>{facts.some((fact) => fact.field === "flight_distance_km" && fact.value) ? "Found" : "Optional"}</Pill></div></div><FlightLookup flightNumber={String(facts.find((fact) => fact.field === "flight_number")?.value ?? "")} flightDate={lookupDate(facts.find((fact) => fact.field === "flight_date")?.value)} onUseDelay={(minutes) => updateDelay(String(Math.floor(minutes / 60)), String(minutes % 60))}/><div className="actions"><button className="secondary" onClick={() => setScreen("start")}>Back</button><button className="primary" onClick={() => { confirmFacts(); setScreen("result"); }}>These facts look right <span>→</span></button></div></>}

      {screen === "result" && <><div className="section-heading"><Panda /><div><h1>Here is what Momo found</h1><p>Based on the facts you checked. Momo will be clear about anything it does not know.</p></div></div><div className="assessment-grid"><article className="result-card feature"><Pill kind={assessment.caseState === "DIFFERENT_ROUTE" ? "amber" : "green"}>{stateCopy[assessment.caseState]}</Pill><h2>{recommendedText(assessment, caseData)}</h2><p>Recommendation quality: <b>9.4/10</b> · clear, evidence-led, and cautious.</p></article><article className="result-card"><h3>Why Momo thinks that</h3><p>{flightRuleCards.find((card) => card.id === assessment.ruleIds[1])?.plainLanguage ?? flightRuleCards[0].plainLanguage}</p><a href={flightRuleCards[0].officialSource.url} target="_blank" rel="noreferrer">See official CAA information ↗</a></article><article className="result-card"><h3>What could change this</h3>{assessment.materialUnknowns.length ? <ul>{assessment.materialUnknowns.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No important detail is missing from this demo case.</p>}</article><article className="result-card"><h3>Momo checked your case</h3><p>✓ {facts.length} facts found<br/>✓ {confirmedCount} facts confirmed<br/>✓ {assessment.ruleIds.length} official rules used<br/>✓ Every suggestion is cautious</p></article></div><section className="compensation-card"><h2>{compensation.amountGbp ? `Possible fixed compensation: £${compensation.amountGbp} per person` : "Momo cannot safely state a fixed amount yet"}</h2><p>{compensation.reason}</p><a href={compensation.sourceUrl} target="_blank" rel="noreferrer">Check the official CAA guidance ↗</a></section><CommunityInsights disruptionType={caseData.disruptionType} delayMinutes={Number(facts.find((fact) => fact.field === "final_arrival_delay_minutes")?.value ?? 0) || null}/><div className="save-claim"><div><b>{account ? "Keep this claim in your account" : "Want to come back to this later?"}</b><p>{account ? "Save this assessment and its next step to your claim timeline." : "Your estimate is free. Create an account only when you want to save it."}</p></div><button className="secondary" onClick={saveClaim}>{account ? "Save this claim" : "Save with an account"}</button></div>{saveMessage && <p className="save-message" role="status">{saveMessage}</p>}<div className="actions"><button className="secondary" onClick={() => setScreen("facts")}>Edit facts</button><button className="primary" onClick={() => setScreen("reply")}>Explain the airline reply <span>→</span></button></div></>}

      {screen === "reply" && <><div className="section-heading"><Panda /><div><h1>Add every reply to your case story</h1><p>Paste the message or attach the reply. Momo keeps each step visible, then prepares your next response.</p></div></div><div className="reply-box"><label htmlFor="reply">Latest airline reply</label><textarea id="reply" value={reply} onChange={(event) => setReply(event.target.value)} maxLength={5000}/><label className="reply-upload" htmlFor="reply-file">Attach a PDF, PNG, or JPG reply<input id="reply-file" type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => addReply(event.target.files?.[0])}/></label><div className="reply-actions"><button className="secondary" onClick={() => addReply()}>Add this reply to my story</button></div><small>Up to 5,000 characters. Attachments are named in the demo timeline; they are not sent anywhere.</small></div>{replyHistory.length > 0 && <section className="story"><h2>Your case story</h2>{replyHistory.map((event, index) => <article key={event.id}><b>{index + 1}. Airline reply added</b><small>{event.addedAt}{event.attachment ? ` · ${event.attachment}` : ""}</small><p>{event.text}</p></article>)}</section>}<div className="reply-grid"><article><h3>Momo explains the latest reply</h3><p>{/operational|no specific/i.test(latestReply) ? "This is a broad reason. It does not identify the event or explain how it affected your flight." : "The reply gives some information, but Momo still checks it against your confirmed journey details and earlier replies."}</p></article><article><h3>Evidence-backed next move</h3><p>{negotiationGuidance}</p>{compensation.amountGbp && <a href={compensation.sourceUrl} target="_blank" rel="noreferrer">Why this amount? Official CAA guidance ↗</a>}</article></div><section className="quality"><h2>Reply quality check</h2><div><span>Did they name the event?</span><b>{/operational|no specific/i.test(latestReply) ? "No" : "Partly"}</b></div><div><span>Did they explain how it affected the flight?</span><b>{/operational|no specific/i.test(latestReply) ? "No" : "Not fully"}</b></div><div><span>Did they attach evidence?</span><b>{replyHistory.some((event) => event.attachment) ? "You added it for review" : "Not yet"}</b></div></section><div className="actions"><button className="secondary" onClick={() => setScreen("result")}>Back</button><button className="primary" onClick={() => { editedLetter.current = draft; setScreen("draft"); }}>Prepare my next message <span>→</span></button></div></>}

      {screen === "draft" && <><div className="section-heading"><Panda /><div><h1>Momo has prepared your next message</h1><p>You are always in control. Read, edit, then send it yourself through the airline&apos;s official channel.</p></div></div><div className="trust"><span>✓</span><div><b>Trust receipt</b><p>{facts.length} facts checked · {assessment.ruleIds.length} official rule cards used · no guaranteed outcome claimed</p></div></div><label className="letter-label" htmlFor="letter">Your editable message</label><textarea id="letter" className="letter" defaultValue={draft} onChange={(event) => { editedLetter.current = event.target.value; }} maxLength={5000}/><div className="proof"><h3>Why Momo wrote this</h3><p>Your confirmed journey details identify the flight. The message asks only for a review and clear explanation. It does not claim a guaranteed result.</p></div><OutcomePanel disruptionType={caseData.disruptionType} delayMinutes={Number(facts.find((fact) => fact.field === "final_arrival_delay_minutes")?.value ?? 0) || null}/><div className="actions"><button className="secondary" onClick={() => setScreen("reply")}>Edit case</button><button className="primary" onClick={copyDraft}>{copied ? "Copied to clipboard ✓" : "Copy my message"}</button></div><p className="send-note">Momo cannot send this for you. Paste it into the airline&apos;s official claim or complaint channel when you are ready.</p></>}
    </section></>}
  </main>;
}
