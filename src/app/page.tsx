"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AccountPanel, { type AccountUser } from "@/app/account-panel";
import AirportHelper from "@/app/airport-helper";
import CareChecklist from "@/app/care-checklist";
import ClaimCommandCentre, { type ClaimStage } from "@/app/claim-command-centre";
import { CommunityInsights, OutcomePanel } from "@/app/community-panels";
import EscalationCard from "@/app/escalation-card";
import FlightLookup from "@/app/flight-lookup";
import GlobalRightsCard from "@/app/global-rights-card";
import JourneyTimeline from "@/app/journey-timeline";
import MomoMascot, { type MomoMood } from "@/app/momo-mascot";
import OfferCompass from "@/app/offer-compass";
import ProofMap from "@/app/proof-map";
import RejectionDissector from "@/app/rejection-dissector";
import SocialProofTicker from "@/app/social-proof-ticker";
import StoryIntake from "@/app/story-intake";
import StrandedNow from "@/app/stranded-now";
import TrustReceipt from "@/app/trust-receipt";
import WorkTripPack from "@/app/work-trip-pack";
import type { CaseFact, FlightCase } from "@/lib/case-types";
import { createBlankFlightCase, flightFixtures, rejectionDemoCases } from "@/lib/fixtures";
import {
  calculateCompensation,
  evaluateFlightCase,
  flightRuleCards,
} from "@/lib/flight-rules";
import { globalPassengerGuidance } from "@/lib/global-passenger-rights";
import { getHelpGuide, type HelpGuide } from "@/lib/help-guidance";
import type { RejectionAnalysis } from "@/lib/rejection-analysis";
import { airportDistanceKm } from "@/lib/airport-distance";

type Screen = "start" | "facts" | "result" | "reply" | "draft";
type ReplyEvent = {
  id: string;
  author: "airline" | "momo";
  text: string;
  draft?: string;
  questions?: string[];
  dissection?: RejectionAnalysis | null;
  addedAt: string;
};

const stateCopy = {
  READY_TO_SEND: "Your information supports sending this claim.",
  LIKELY_WORTH_PURSUING: "This may be worth pursuing.",
  NEEDS_DETAIL: "Momo needs one more detail first.",
  DIFFERENT_ROUTE:
    "Compensation is uncertain, but you may still be able to ask for help.",
  OUT_OF_SCOPE:
    "Momo cannot safely assess this route under its current UK/EU rules.",
};

function Panda() {
  return (
    <span aria-label="Momo the panda" role="img" className="panda">
      🐼
    </span>
  );
}
function Pill({
  children,
  kind = "blue",
}: {
  children: React.ReactNode;
  kind?: "blue" | "green" | "amber";
}) {
  return <span className={`pill ${kind}`}>{children}</span>;
}
function lookupDate(value: string | number | null | undefined) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)
    ? value.slice(0, 10)
    : "";
}

function requiredFact(facts: CaseFact[], field: string) {
  const value = facts.find((fact) => fact.field === field)?.value;
  return value !== null && value !== "";
}
const requiredToContinue = new Set([
  "flight_number", "route", "departure_region", "arrival_region",
  "operating_carrier_region", "flight_date", "final_arrival_delay_minutes",
]);
const optionalFacts = new Set([
  "departure_airport", "arrival_airport", "operating_carrier_name", "journey_is_intra_eu",
  "airline_reason", "connection_airports", "disrupted_leg", "disruption_location",
]);

export default function Home() {
  return <MomoHome />;
}

function guidedCase(topic: string | null) {
  const blank = createBlankFlightCase();
  const guide = getHelpGuide(topic);
  return { ...blank, disruptionType: guide?.disruptionType ?? blank.disruptionType };
}

function MomoHome() {
  const [screen, setScreen] = useState<Screen>("start");
  const [caseData, setCaseData] = useState<FlightCase>(createBlankFlightCase);
  const [facts, setFacts] = useState<CaseFact[]>(
    () => createBlankFlightCase().facts,
  );
  const [reply, setReply] = useState("");
  const [replyHistory, setReplyHistory] = useState<ReplyEvent[]>([]);
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [journeyMessage, setJourneyMessage] = useState("");
  const [account, setAccount] = useState<AccountUser | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [claimStage, setClaimStage] = useState<ClaimStage>("draft_ready");
  const [evidenceStatus, setEvidenceStatus] = useState("");
  const [isReadingEvidence, setIsReadingEvidence] = useState(false);
  const [activeGuide, setActiveGuide] = useState<HelpGuide | null>(null);
  const latestMomoReplyRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const topic = new URLSearchParams(window.location.search).get("help");
    if (!topic) return;
    const timer = window.setTimeout(() => {
      const blank = guidedCase(topic);
      const guide = getHelpGuide(topic);
      setCaseData(blank);
      setFacts(blank.facts);
      setReply("");
      setReplyHistory([]);
      setGeneratedDraft("");
      setClaimStage("draft_ready");
      setActiveGuide(guide);
      setScreen(guide?.screen ?? "facts");
      setJourneyMessage(guide ? guide.description : "Momo has opened a guided case. Start with the details you know; you can leave the rest for later.");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const assessment = useMemo(
    () => evaluateFlightCase({ ...caseData, facts }),
    [caseData, facts],
  );
  const compensation = useMemo(
    () => calculateCompensation({ ...caseData, facts }),
    [caseData, facts],
  );
  const selectedRuleCards = useMemo(
    () => flightRuleCards.filter((card) => assessment.ruleIds.includes(card.id)),
    [assessment.ruleIds],
  );
  const internationalGuidance = useMemo(
    () =>
      globalPassengerGuidance({
        departureAirport: facts.find((fact) => fact.field === "departure_airport")?.value,
        arrivalAirport: facts.find((fact) => fact.field === "arrival_airport")?.value,
        disruptionType: caseData.disruptionType,
        delayMinutes: Number(facts.find((fact) => fact.field === "final_arrival_delay_minutes")?.value ?? 0) || null,
        airlineReason: String(facts.find((fact) => fact.field === "airline_reason")?.value ?? ""),
        cancellationNoticeDays: (() => {
          const value = facts.find((fact) => fact.field === "cancellation_notice_days")?.value;
          return typeof value === "number" && Number.isFinite(value) ? value : null;
        })(),
        boardingReady: String(facts.find((fact) => fact.field === "boarding_ready")?.value ?? ""),
        volunteered: String(facts.find((fact) => fact.field === "denied_boarding_voluntary")?.value ?? ""),
        documentsValid: String(facts.find((fact) => fact.field === "travel_documents_valid")?.value ?? ""),
        hasUkOrEuFramework: assessment.frameworkCandidates.length > 0,
      }),
    [assessment.frameworkCandidates.length, caseData.disruptionType, facts],
  );
  const factsReady = [...requiredToContinue].every((field) => requiredFact(facts, field));
  const latestAirlineReply =
    replyHistory.filter((event) => event.author === "airline").at(-1)?.text ??
    "";
  const confirmedCount = facts.filter((fact) => fact.confirmed).length;
  const canReviewReply = Boolean(reply.trim() || latestAirlineReply);
  const isReviewingReply = replyStatus.startsWith("Momo is");
  const currentStep = {
    start: "Start a new Momo case",
    facts: "Step 1 of 4: check the facts",
    result: "Step 2 of 4: see what Momo found",
    reply: "Step 3 of 4: add the airline's reply",
    draft: "Step 4 of 4: review your message",
  }[screen];
  const companion = useMemo<{ mood: MomoMood; message: string }>(() => {
    if (screen === "start") return { mood: "hello", message: "Tell me what happened. I’ll organise the clear details, or you can fill in the form yourself." };
    if (screen === "facts") {
      const missing = facts.filter((fact) => requiredToContinue.has(fact.field) && !requiredFact(facts, fact.field)).map((fact) => fact.label);
      return missing.length
        ? { mood: "listening", message: `I still need ${missing.slice(0, 2).join(" and ")}${missing.length > 2 ? ", plus a few more details" : ""}.` }
        : { mood: "thinking", message: "Your required details are ready. Check them, then I’ll explain the next step." };
    }
    if (screen === "result") return { mood: "thinking", message: assessment.caseState === "NEEDS_DETAIL" ? "I need one more detail before I can give a careful answer." : "I’ve checked the facts against Momo’s source-backed rules." };
    if (screen === "reply") return { mood: replyStatus.startsWith("Momo is") ? "working" : "listening", message: "Paste the airline’s latest reply. I’ll help you turn it into a calm, editable next message." };
    return { mood: "celebrating", message: "Read and edit this message before you send it. You stay in control." };
  }, [assessment.caseState, facts, replyStatus, screen]);

  const startOwnCase = () => {
    const blank = createBlankFlightCase();
    setCaseData(blank);
    setFacts(blank.facts);
    setReply("");
    setReplyHistory([]);
    setGeneratedDraft("");
    setClaimStage("draft_ready");
    setActiveGuide(null);
    setJourneyMessage("");
    setScreen("facts");
  };
  const chooseSample = () => {
    const sample = flightFixtures[0];
    setCaseData(sample);
    setFacts(sample.facts);
    setReply(sample.airlineReply);
    setReplyHistory([]);
    setGeneratedDraft("");
    setClaimStage("draft_ready");
    setActiveGuide(null);
    setJourneyMessage("");
    setScreen("facts");
  };
  const loadRejectionDemo = (id: string) => {
    const sample = rejectionDemoCases.find((item) => item.id === id);
    if (!sample) return;
    setCaseData(sample);
    setFacts(sample.facts);
    setReply(sample.airlineReply);
    setReplyHistory([]);
    setGeneratedDraft("");
    setClaimStage("draft_ready");
    setActiveGuide(null);
    setJourneyMessage("Demo case loaded. This is sample data, not a promise of compensation.");
    setScreen("reply");
  };
  const beginGuide = (topic: HelpGuide["topic"]) => {
    const guide = getHelpGuide(topic);
    if (!guide) return;
    const blank = guidedCase(topic);
    setCaseData(blank);
    setFacts(blank.facts);
    setReply("");
    setReplyHistory([]);
    setGeneratedDraft("");
    setClaimStage("draft_ready");
    setActiveGuide(guide);
    setJourneyMessage(guide.description);
    setScreen(guide.screen);
  };
  const goTo = (next: Screen) => {
    if (next === "result" && !factsReady)
      return setJourneyMessage(
        "Before checking an assessment, add your flight number, journey, departure and destination regions, operating airline region, travel date, and arrival delay. You can still paste an airline reply without these details.",
      );
    if (next === "draft" && !generatedDraft)
      return setJourneyMessage(
        "Add the airline's reply and ask Momo to prepare a message first.",
      );
    setJourneyMessage("");
    setScreen(next);
  };
  const updateFact = (id: string, value: string) =>
    setFacts((current) => {
      const changed = current.map((fact) =>
        fact.id === id
          ? {
              ...fact,
              value:
                fact.field === "final_arrival_delay_minutes"
                  ? Number(value) || null
                  : value,
              confirmed: false,
              sourceLabel: "You told Momo",
            }
          : fact,
      );
      const edited = changed.find((fact) => fact.id === id);
      if (!edited || !["departure_airport", "arrival_airport"].includes(edited.field))
        return changed;

      const distance = airportDistanceKm(
        changed.find((fact) => fact.field === "departure_airport")?.value,
        changed.find((fact) => fact.field === "arrival_airport")?.value,
      );
      if (!distance) return changed;
      const existing = changed.find((fact) => fact.field === "flight_distance_km");
      if (existing && existing.sourceLabel === "You told Momo") return changed;
      const distanceFact: CaseFact = {
        id: existing?.id ?? "distance",
        field: "flight_distance_km",
        label: "Flight distance",
        value: distance,
        provenance: "DOCUMENT_EXTRACTED",
        sourceLabel: "Momo found this from the airport pair — please check",
        confirmed: false,
      };
      return existing
        ? changed.map((fact) =>
            fact.field === "flight_distance_km" ? distanceFact : fact,
          )
        : [...changed, distanceFact];
    });
  const updateDelay = (hours: string, minutes: string) => {
    const safeHours = Math.max(0, Math.min(168, Number(hours) || 0));
    const safeMinutes = Math.max(0, Math.min(59, Number(minutes) || 0));
    const total = Math.max(
      0,
      Math.min(10_080, safeHours * 60 + safeMinutes),
    );
    setFacts((current) =>
      current.map((fact) =>
        fact.field === "final_arrival_delay_minutes"
          ? {
              ...fact,
              value: total || null,
              confirmed: false,
              sourceLabel: "You told Momo",
            }
          : fact,
      ),
    );
  };
  const updateDistance = (value: string) =>
    setFacts((current) => {
      const distance = Number(value) || null;
      const existing = current.find(
        (fact) => fact.field === "flight_distance_km",
      );
      return existing
        ? current.map((fact) =>
            fact.field === "flight_distance_km"
              ? {
                  ...fact,
                  value: distance,
                  confirmed: Boolean(distance),
                  sourceLabel: "You told Momo",
                }
              : fact,
          )
        : [
            ...current,
            {
              id: "distance",
              field: "flight_distance_km",
              label: "Flight distance",
              value: distance,
              provenance: "USER_STATED_UNCONFIRMED",
              sourceLabel: "You told Momo",
              confirmed: Boolean(distance),
            },
          ];
    });
  const confirmFacts = () =>
    setFacts((current) =>
      current.map((fact) => ({
        ...fact,
        confirmed: fact.value !== null && fact.value !== "",
      })),
    );
  const addReply = () => {
    const text = reply.trim();
    if (!text) return setReplyStatus("Paste the airline's message first.");
    setReplyHistory((history) => [
      ...history,
      {
        id: crypto.randomUUID(),
        author: "airline",
        text,
        addedAt: new Date().toLocaleString("en-GB"),
      },
    ]);
    setReply("");
    setReplyStatus("Airline reply added to your private case story.");
    return text;
  };
  const generateReply = async (
    input?: "quick" | "deep" | { preventDefault: () => void },
  ) => {
    const reviewTier = input === "deep" ? "deep" : "quick";
    const text = reply.trim() || latestAirlineReply;
    if (!text)
      return setReplyStatus(
        "Paste an airline reply before asking Momo for help.",
      );
    if (reply.trim()) addReply();
    setReplyStatus(
      reviewTier === "deep"
        ? "Momo is taking a deeper look at the reply and your confirmed facts…"
        : "Momo is reading the reply and checking the confirmed facts…",
    );
    try {
      const response = await fetch("/api/momo/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reply: text,
          reviewTier,
          caseInput: {
            disruptionType: caseData.disruptionType,
            facts: facts.map(({ field, value, confirmed }) => ({
              field,
              value,
              confirmed,
            })),
          },
        }),
      });
      const data = await response.json();
      if (!response.ok)
        return setReplyStatus(
          data.error ?? "Momo could not prepare a reply right now.",
        );
      const draft = data.draft || data.explanation;
      setGeneratedDraft(draft);
      setReplyHistory((history) => [
        ...history,
        {
          id: crypto.randomUUID(),
          author: "momo",
          text: data.explanation,
          draft,
          questions: Array.isArray(data.questions)
            ? data.questions.filter((question: unknown) => typeof question === "string").slice(0, 3)
            : [],
          dissection: data.dissection && typeof data.dissection === "object" ? data.dissection as RejectionAnalysis : null,
          addedAt: new Date().toLocaleString("en-GB"),
        },
      ]);
      setReplyStatus(
        `${reviewTier === "deep" ? "Deeper" : "Quick"} review complete. Momo prepared a draft using your confirmed facts. Please read and edit it before sending.`,
      );
      window.setTimeout(() => latestMomoReplyRef.current?.focus(), 0);
    } catch {
      setReplyStatus(
        "Momo could not connect right now. Your airline reply is still kept in this browser.",
      );
    }
  };
  const readEvidence = async (file: File | null) => {
    if (!file || isReadingEvidence) return;
    setEvidenceStatus("Momo is reading the file privately…");
    setIsReadingEvidence(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/momo/read-evidence", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) return setEvidenceStatus(data.error ?? "Momo could not read that file right now.");
      const extracted = typeof data.text === "string" ? data.text : "";
      setReply((current) => current ? `${current}\n\n${extracted}` : extracted);
      setEvidenceStatus("Momo added a short, editable reading to the reply box. Check it before asking for a draft.");
    } catch {
      setEvidenceStatus("Momo could not read that file right now. You can still paste the relevant wording.");
    } finally {
      setIsReadingEvidence(false);
    }
  };
  const loadClaim = async (claimId: string) => {
    setJourneyMessage("");
    setSaveMessage("");
    try {
      const response = await fetch(`/api/claims/${encodeURIComponent(claimId)}`);
      const data = await response.json();
      const saved = data?.claim?.case_data;
      if (!response.ok || !saved || typeof saved !== "object") {
        return setJourneyMessage(data.error ?? "Momo could not open that claim.");
      }
      const fresh = createBlankFlightCase();
      const disruptionTypes = ["delay", "cancellation", "denied_boarding", "missed_connection"];
      const savedDisruption = disruptionTypes.includes(saved.disruptionType)
        ? saved.disruptionType as FlightCase["disruptionType"]
        : fresh.disruptionType;
      const restoredFacts = Array.isArray(saved.facts)
        ? saved.facts.filter((fact: unknown): fact is CaseFact =>
            fact !== null && typeof fact === "object" && "id" in fact && "field" in fact && "label" in fact && "confirmed" in fact,
          )
        : fresh.facts;
      const restoredHistory = Array.isArray(saved.replyHistory)
        ? saved.replyHistory.filter((event: unknown): event is ReplyEvent =>
            event !== null && typeof event === "object" && "id" in event && "author" in event && "text" in event && "addedAt" in event,
          )
        : [];
      const restoredDraft = typeof saved.generatedDraft === "string"
        ? saved.generatedDraft.slice(0, 5_000)
        : "";
      const allowedStages: ClaimStage[] = ["draft_ready", "sent", "waiting", "offer_received", "resolved"];
      setClaimStage(allowedStages.includes(saved.claimStage) ? saved.claimStage : "draft_ready");
      setCaseData({ ...fresh, title: String(data.claim.title ?? fresh.title).slice(0, 120), disruptionType: savedDisruption });
      setFacts(restoredFacts);
      setReplyHistory(restoredHistory);
      setGeneratedDraft(restoredDraft);
      setReply("");
      setScreen(restoredDraft ? "draft" : restoredHistory.length ? "reply" : "facts");
      setJourneyMessage("Your saved claim is open. Pick up from the next step when you are ready.");
    } catch {
      setJourneyMessage("Momo could not open that claim right now. Please try again.");
    }
  };
  const saveClaim = async () => {
    const response = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: caseData.title,
        status: stateCopy[assessment.caseState],
        caseData: {
          disruptionType: caseData.disruptionType,
          facts,
          replyHistory,
          generatedDraft,
          claimStage,
        },
      }),
    });
    const data = await response.json();
    if (!response.ok)
      return setSaveMessage(
        "Create an account or sign in to save your whole claim story.",
      );
    setAccount(data.user);
    setSaveMessage(
      "Your claim and conversation were saved. You can return to them from your account menu.",
    );
  };
  const copyDraft = async () => {
    await navigator.clipboard?.writeText(generatedDraft);
    setCopied(true);
  };

  return (
    <main className="momo-app">
      <a className="skip-link" href="#momo-main">Skip to main content</a>
      <header className="topbar">
        <button className="brand" onClick={() => setScreen("start")}>
          <Panda />
          <span>Momo</span>
        </button>
        <span className="tagline">Your calm next step</span>
        <Link className="nav-button" href="/help">
          What can I help with?
        </Link>
        <AccountPanel onOpenClaim={loadClaim} onUserChange={setAccount} />
      </header>
      <aside className={`momo-companion ${screen === "start" ? "landing-companion" : ""}`} aria-live="polite" aria-label="Momo's guidance">
        <MomoMascot mood={companion.mood} />
        <p><b>Momo</b>{companion.message}</p>
      </aside>
      {screen === "start" && (
        <>
          <SocialProofTicker />
          <section className="landing" id="momo-main">
              <div className="hero-copy">
              <div className="momo-welcome">
                <span className="speech">
                  Hello, I&apos;m Momo. What happened?
                </span>
              </div>
              <Pill kind="green">Private by design · no account needed</Pill>
              <h1>
                Check a disrupted flight under UK or EU rules in about three
                minutes.
              </h1>
              <p>
                Start with what you know. Momo turns your story and airline
                messages into a clear next step, at your pace.
              </p>
              <div className="hero-actions">
                <button className="primary" onClick={startOwnCase}>
                  Start my case <span>→</span>
                </button>
                <button className="secondary" onClick={chooseSample}>
                  View a sample case
                </button>
              </div>
              <div className="quick-start" aria-label="Quick ways to start">
                <b>Start even faster</b>
                <div>
                  <button className="quick-choice" onClick={() => beginGuide("rejection")}>Paste an airline reply</button>
                  <button className="quick-choice" onClick={() => beginGuide("lookup")}>Find my flight</button>
                  <button className="quick-choice" onClick={() => beginGuide("offer")}>I have an airline offer</button>
                </div>
              </div>
              <p className="small">
                UK261 and EU261 information and drafting support. Momo is not a
                law firm and does not promise an outcome.
              </p>
            </div>
            <div className="hero-card welcome-scene">
              <div className="paper-plane">✈</div>
              <div className="scene-path">
                <span>1</span>
                <i></i>
                <span>2</span>
                <i></i>
                <span>3</span>
              </div>
              <h2>One small step at a time.</h2>
              <p>
                Tell Momo what happened. Add the airline&apos;s reply. Then see
                what to do next.
              </p>
              <div className="mini-row">
                <span>✓</span>
                <div>
                  <b>You stay in control</b>
                  <small>Momo never sends anything for you.</small>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
      {screen !== "start" && (
        <>
          <nav className="progress" aria-label="Case progress">
            <button
              type="button"
              onClick={() => goTo("facts")}
              className={screen === "facts" ? "active" : "done"}
              aria-current={screen === "facts" ? "step" : undefined}
            >
              1. Check facts
            </button>
            <button
              type="button"
              onClick={() => goTo("result")}
              disabled={!factsReady}
              className={
                screen === "result"
                  ? "active"
                  : ["reply", "draft"].includes(screen)
                    ? "done"
                    : ""
              }
              aria-current={screen === "result" ? "step" : undefined}
            >
              2. What Momo found
            </button>
            <button
              type="button"
              onClick={() => goTo("reply")}
              className={
                screen === "reply" ? "active" : screen === "draft" ? "done" : ""
              }
              aria-current={screen === "reply" ? "step" : undefined}
            >
              3. Airline reply
            </button>
            <button
              type="button"
              onClick={() => goTo("draft")}
              disabled={!generatedDraft}
              className={screen === "draft" ? "active" : ""}
              aria-current={screen === "draft" ? "step" : undefined}
            >
              4. Your message
            </button>
          </nav>
          <p className="current-step" role="status">
            {currentStep}
          </p>
          {journeyMessage && (
            <p className="journey-message" role="status">
              {journeyMessage}
            </p>
          )}
          {!factsReady && <p className="step-note">Add the required flight details before opening Momo&apos;s assessment. You can still paste an airline reply at any time.</p>}
          <section className="workspace" id="momo-main">
            {activeGuide && (
              <aside className="guide-intro" aria-label="Your selected guide">
                <div><p className="receipt-eyebrow">YOUR STARTING POINT</p><h2>{activeGuide.title}</h2><p>{activeGuide.description}</p><b>{activeGuide.nextAction}</b></div>
              </aside>
            )}
            {screen === "facts" && (
              <>
                <div className="section-heading">
                  <div>
                    <h1>Tell Momo the key details</h1>
                    <p>
                      Start with what you know. Momo needs the route and
                      operating airline to select the right flight rules.
                    </p>
                  </div>
                </div>
                <label className="disruption-picker">
                  What happened?
                  <select
                    value={caseData.disruptionType}
                    onChange={(event) =>
                      setCaseData((current) => ({
                        ...current,
                        disruptionType: event.target
                          .value as FlightCase["disruptionType"],
                      }))
                    }
                  >
                    <option value="delay">My flight was delayed</option>
                    <option value="cancellation">
                      My flight was cancelled
                    </option>
                    <option value="denied_boarding">
                      I was denied boarding
                    </option>
                    <option value="missed_connection">
                      I missed a connection
                    </option>
                  </select>
                </label>
                <StoryIntake onUse={(story, extracted, source) => { setFacts((current) => current.map((fact) => { const match = extracted.find((item) => item.field === fact.field); return match && (fact.value === null || fact.value === "" || fact.field === "one_booking") ? { ...fact, value: match.value, confirmed: false, sourceLabel: source === "ai" ? "Momo found this - please check" : "Momo spotted this - please check" } : fact.field === "traveller_story" ? { ...fact, value: story, confirmed: false, sourceLabel: "Your private draft story" } : fact; })); setJourneyMessage(extracted.length ? `Momo added ${extracted.length} draft detail${extracted.length === 1 ? "" : "s"}. Please check them${source === "ai" ? "" : " — these came from basic matching"}. Next, complete the remaining required details.` : "Momo saved your story but could not safely extract a fact. Complete the required fields below, or try a clearer description."); }} />
                <div className="facts">
                  <div className="fact" aria-label="What each label means"><div><b>Required to continue</b><small>You need these before Momo can move to an assessment. “Add if you know” improves the result later. “Optional” is never required.</small></div></div>
                  {facts
                    .filter((fact) => !["flight_distance_km", "traveller_story"].includes(fact.field))
                    .filter((fact) => !["cancellation_notice_days", "rerouting_arrival_delay_minutes"].includes(fact.field) || caseData.disruptionType === "cancellation")
                    .filter((fact) => !["boarding_ready", "denied_boarding_voluntary", "travel_documents_valid"].includes(fact.field) || caseData.disruptionType === "denied_boarding")
                    .map((fact) => (
                      <div className="fact" key={fact.id}>
                        <div>
                          <label htmlFor={fact.id}>{fact.label}</label>
                          <small>
                            {fact.field === "final_arrival_delay_minutes"
                              ? "How late did you reach your final destination?"
                              : fact.field === "operating_carrier_region"
                                ? "This means the airline that actually flew the plane. If you are not sure, choose ‘I’m not sure’ and Momo will stay cautious."
                              : fact.sourceLabel}
                          </small>
                        </div>
                        {fact.field === "final_arrival_delay_minutes" ? (
                          <div className="delay-inputs">
                            <label>
                              Hours
                              <input
                                type="number"
                                min="0"
                                max="168"
                                value={Math.floor(Number(fact.value ?? 0) / 60)}
                                onChange={(event) =>
                                  updateDelay(
                                    event.target.value,
                                    String(Number(fact.value ?? 0) % 60),
                                  )
                                }
                              />
                            </label>
                            <label>
                              Minutes
                              <input
                                type="number"
                                min="0"
                                max="59"
                                value={Number(fact.value ?? 0) % 60}
                                onChange={(event) =>
                                  updateDelay(
                                    String(
                                      Math.floor(Number(fact.value ?? 0) / 60),
                                    ),
                                    event.target.value,
                                  )
                                }
                              />
                            </label>
                          </div>
                        ) : fact.field.endsWith("_region") ? (
                          <select
                            id={fact.id}
                            value={String(fact.value ?? "")}
                            onChange={(event) =>
                              updateFact(fact.id, event.target.value)
                            }
                          >
                            <option value="">Choose one</option>
                            <option value="UK">UK</option>
                            <option value="EU/EEA/Switzerland">
                              EU/EEA/Switzerland
                            </option>
                            <option value="Other">Another country</option>
                            <option value="Not sure">I&apos;m not sure</option>
                          </select>
                        ) : fact.field === "journey_is_intra_eu" ? (
                          <select
                            id={fact.id}
                            value={String(fact.value ?? "")}
                            onChange={(event) =>
                              updateFact(fact.id, event.target.value)
                            }
                          >
                            <option value="">I&apos;m not sure</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        ) : (
                          <input
                            id={fact.id}
                            value={fact.value ?? ""}
                            onChange={(event) =>
                              updateFact(fact.id, event.target.value)
                            }
                            placeholder={
                              fact.field === "airline_reason"
                                ? "Optional — paste the reason when you have it"
                                : ""
                            }
                          />
                        )}
                        <Pill kind={requiredToContinue.has(fact.field) ? "blue" : optionalFacts.has(fact.field) ? "amber" : "green"}>
                          {requiredToContinue.has(fact.field) ? "Required to continue" : optionalFacts.has(fact.field) ? "Optional" : "Add if you know"}
                        </Pill>
                        {(fact.field === "departure_airport" || fact.field === "arrival_airport") && (
                          <AirportHelper onChoose={(code) => updateFact(fact.id, code)} />
                        )}
                      </div>
                    ))}
                  <div className="fact">
                    <div>
                      <label htmlFor="distance">
                        Flight distance in kilometres
                      </label>
                      <small>
                        Optional. It helps Momo show a possible fixed
                        compensation amount.
                      </small>
                    </div>
                    <input
                      id="distance"
                      type="number"
                      min="1"
                      value={
                        facts.find(
                          (fact) => fact.field === "flight_distance_km",
                        )?.value ?? ""
                      }
                      onChange={(event) => updateDistance(event.target.value)}
                    />
                    <Pill kind="amber">Optional</Pill>
                  </div>
                </div>
                <JourneyTimeline facts={facts} />
                <StrandedNow location={String(facts.find((fact) => fact.field === "disruption_location")?.value ?? "")} />
                <FlightLookup
                  flightNumber={String(
                    facts.find((fact) => fact.field === "flight_number")
                      ?.value ?? "",
                  )}
                  flightDate={lookupDate(
                    facts.find((fact) => fact.field === "flight_date")?.value,
                  )}
                  onUseDelay={(minutes) =>
                    updateDelay(
                      String(Math.floor(minutes / 60)),
                      String(minutes % 60),
                    )
                  }
                />
                <p className="facts-help">
                  Not sure about a field? <Link href="/help">See examples of what Momo can help with</Link> or enter what you know. Momo will show what is still needed.
                </p>
                <div className="actions">
                  <button
                    className="secondary"
                    onClick={() => setScreen("start")}
                  >
                    Back
                  </button>
                  <button
                    className="primary"
                    onClick={() => {
                      if (!factsReady) return goTo("result");
                      confirmFacts();
                      goTo("result");
                    }}
                  >
                    These facts look right <span>→</span>
                  </button>
                </div>
              </>
            )}
            {screen === "result" && (
              <>
                <div className="section-heading">
                  <div>
                    <h1>Here is what Momo found</h1>
                    <p>
                      Based on {confirmedCount} details you checked and current
                      source-backed rule cards.
                    </p>
                  </div>
                </div>
                <div className="assessment-grid">
                  <article className="result-card feature">
                    <Pill
                      kind={
                        ["DIFFERENT_ROUTE", "OUT_OF_SCOPE"].includes(
                          assessment.caseState,
                        )
                          ? "amber"
                          : "green"
                      }
                    >
                      {stateCopy[assessment.caseState]}
                    </Pill>
                    <h2>
                      {assessment.caseState === "NEEDS_DETAIL"
                        ? "Momo needs one more detail before it can suggest a fair next move."
                        : assessment.caseState === "OUT_OF_SCOPE"
                          ? "Momo will not guess which rules apply to this journey."
                          : "A calm, evidence-led next step is ready."}
                    </h2>
                    <p>
                      Momo separates confirmed facts, airline claims, and the
                      things still to check. It never promises compensation.
                    </p>
                  </article>
                  <article className="result-card">
                    <h3>Why this matters</h3>
                    <p>
                      {flightRuleCards.find(
                        (card) => card.id === assessment.ruleIds[1],
                      )?.plainLanguage ??
                        flightRuleCards.find(
                          (card) => card.id === assessment.ruleIds[0],
                        )?.plainLanguage ??
                        "Momo needs the route and operating airline before it can select a rule."}
                    </p>
                    {assessment.ruleIds.map((id) => {
                      const card = flightRuleCards.find(
                        (item) => item.id === id,
                      );
                      return card ? (
                        <a
                          key={id}
                          href={card.officialSource.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {card.framework} official source ↗
                        </a>
                      ) : null;
                    })}
                  </article>
                  <article className="result-card">
                    <h3>What could change this</h3>
                    {assessment.materialUnknowns.length ? (
                      <ul>
                        {assessment.materialUnknowns.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        No important detail is missing from your current
                        information.
                      </p>
                    )}
                  </article>
                </div>
                <section className="compensation-card">
                  <h2>
                    {compensation.amount
                      ? `Possible fixed compensation: ${compensation.currency === "GBP" ? "£" : "€"}${compensation.amount} per person`
                      : "Momo cannot safely state a fixed amount yet"}
                  </h2>
                  <p>{compensation.reason}</p>
                  <a
                    href={compensation.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Check the official guidance ↗
                  </a>
                  <small>
                    Rules considered:{" "}
                    {assessment.frameworkCandidates.join(" and ") || "none yet"}
                    . Last checked 15 July 2026.
                  </small>
                </section>
                <GlobalRightsCard guidance={internationalGuidance} />
                <TrustReceipt
                  assessment={assessment}
                  facts={facts}
                  cards={selectedRuleCards}
                  amount={compensation.amount}
                  currency={compensation.currency}
                  reason={compensation.reason}
                />
                <CareChecklist disruptionType={caseData.disruptionType} />
                <WorkTripPack />
                <EscalationCard frameworks={assessment.frameworkCandidates} />
                <CommunityInsights
                  disruptionType={caseData.disruptionType}
                  delayMinutes={
                    Number(
                      facts.find(
                        (fact) => fact.field === "final_arrival_delay_minutes",
                      )?.value ?? 0,
                    ) || null
                  }
                />
                <div className="save-claim">
                  <div>
                    <b>
                      {account
                        ? "Keep this claim in your account"
                        : "Want to come back to this later?"}
                    </b>
                    <p>
                      Your estimate is free. Create an account only when you
                      want to save your case story.
                    </p>
                  </div>
                  <button className="secondary" onClick={saveClaim}>
                    {account ? "Save my claim" : "Save with an account"}
                  </button>
                </div>
                {saveMessage && (
                  <p className="save-message" role="status">
                    {saveMessage}
                  </p>
                )}
                <div className="actions">
                  <button className="secondary" onClick={() => goTo("facts")}>
                    Edit facts
                  </button>
                  <button className="primary" onClick={() => goTo("reply")}>
                    Add airline reply <span>→</span>
                  </button>
                </div>
              </>
            )}
            {screen === "reply" && (
              <>
                <div className="section-heading">
                  <div>
                    <h1>Talk through the airline&apos;s replies</h1>
                    <p>
                      Paste each reply. Momo will explain it and prepare an
                      editable, evidence-led next message.
                    </p>
                  </div>
                </div>
                <section
                  className="case-chat"
                  aria-label="Your claim conversation"
                >
                  <div className="chat-intro">
                    <div>
                      <b>Momo</b>
                      <p>
                        I&apos;ll keep the important details together. You stay
                        in control of every message.
                      </p>
                    </div>
                  </div>
                  {replyHistory.length === 0 && (
                    <section className="demo-rejections" aria-label="Try a sample airline refusal">
                      <b>Try a safe demo refusal</b><p>These examples show that Momo can challenge vague reasons and also recognise when weather needs careful checking.</p>
                      <div>{rejectionDemoCases.map((sample) => <button className="secondary" key={sample.id} onClick={() => loadRejectionDemo(sample.id)}>{sample.title.replace("Demo: ", "")}</button>)}</div>
                    </section>
                  )}
                  {replyHistory.length > 0 && (
                    <div className="chat-thread">
                      {replyHistory.map((event) => (
                        <article
                          className={`chat-bubble ${event.author}`}
                          key={event.id}
                        >
                          <h2
                            ref={event.author === "momo" && event.id === replyHistory.at(-1)?.id ? latestMomoReplyRef : undefined}
                            tabIndex={event.author === "momo" ? -1 : undefined}
                          >
                            {event.author === "momo" ? "Momo" : "Airline reply"}
                          </h2>
                          <small>{event.addedAt}</small>
                          <p>{event.text}</p>
                          {event.author === "momo" && event.questions?.length ? (
                            <div className="chat-questions">
                              <b>What to check next</b>
                              <ul>
                                {event.questions.map((question) => (
                                  <li key={question}>{question}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                    {event.author === "momo" && event.dissection ? <RejectionDissector analysis={event.dissection} onAddQuestion={(question) => { setGeneratedDraft((current) => `${current}${current ? "\n\n" : ""}${question}`); setJourneyMessage("Momo added that question to your editable message."); }} /> : null}
                          {event.author === "momo" && (
                            <button
                              className="text-button"
                              onClick={() => {
                                setGeneratedDraft(event.draft ?? "");
                                goTo("draft");
                              }}
                            >
                              Open this draft
                            </button>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                  <div className="chat-composer">
                    <label htmlFor="reply">What did the airline say?</label>
                    <textarea
                      id="reply"
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      maxLength={5000}
                      placeholder="Paste the latest airline message here…"
                    />
                    <div className="evidence-reader">
                      <label htmlFor="reply-evidence">Or let Momo read a screenshot or PDF</label>
                      <input
                        id="reply-evidence"
                        type="file"
                        accept="application/pdf,image/png,image/jpeg"
                        aria-describedby="reply-evidence-help"
                        disabled={isReadingEvidence}
                        onChange={(event) => {
                          void readEvidence(event.target.files?.[0] ?? null);
                          event.currentTarget.value = "";
                        }}
                      />
                      <small id="reply-evidence-help">PDF, PNG, or JPG up to 3 MB. If OpenAI reading is enabled, it processes this file only to extract claim wording; Momo does not retain it. Do not upload passports, payment cards, or identity documents.</small>
                      {evidenceStatus && <p className="insight-message" role="status">{evidenceStatus}</p>}
                    </div>
                    <p className="reply-action-hint">Ready for help? Choose <b>Ask Momo for a reply</b>. <b>Save for later</b> only stores the text in this conversation.</p>
                    <div className="reply-actions">
                      <button className="secondary" onClick={addReply}>
                        Save for later
                      </button>
                      <button
                        className="primary"
                        disabled={!canReviewReply || isReviewingReply}
                        onClick={generateReply}
                      >
                        Ask Momo for a reply <span>→</span>
                      </button>
                      <button
                        className="secondary"
                        disabled={!canReviewReply || isReviewingReply}
                        onClick={() => generateReply("deep")}
                      >
                        Need a deeper check?
                      </button>
                    </div>
                    <small>
                      Momo uses your confirmed facts and the latest reply. A
                      deeper check may take a little longer. Please check and
                      edit every draft before sending.
                    </small>
                    {replyStatus && (
                      <p className="insight-message" role="status">
                        {replyStatus}
                      </p>
                    )}
                  </div>
                </section>
                <div className="actions">
                  <button className="secondary" onClick={() => goTo("result")}>
                    Back
                  </button>
                  <button className="primary" disabled={!generatedDraft} onClick={() => goTo("draft")}>
                    Open latest message <span>→</span>
                  </button>
                </div>
              </>
            )}
            {screen === "draft" && (
              <>
                <div className="section-heading">
                  <div>
                    <h1>Your editable message</h1>
                    <p>
                      Read it, edit it, and only send it yourself when it feels
                      right.
                    </p>
                  </div>
                </div>
                <div className="trust">
                  <span>✓</span>
                  <div>
                    <b>Why you can trust this draft</b>
                    <p>
                      It uses {confirmedCount} checked details, selected UK/EU
                      rule cards, and visible official sources. It is
                      information and drafting help, not legal advice.
                    </p>
                  </div>
                </div>
                <ProofMap
                  confirmedFactCount={confirmedCount}
                  assessment={assessment}
                  cards={selectedRuleCards}
                />
                <ClaimCommandCentre
                  stage={claimStage}
                  onChange={setClaimStage}
                />
                <OfferCompass
                  amount={compensation.amount}
                  currency={compensation.currency}
                />
                <label className="letter-label" htmlFor="letter">
                  Message to the airline
                </label>
                <textarea
                  id="letter"
                  className="letter"
                  value={generatedDraft}
                  onChange={(event) => setGeneratedDraft(event.target.value)}
                  maxLength={5000}
                />
                <div className="actions">
                  <button className="secondary" onClick={() => goTo("reply")}>
                    Edit case story
                  </button>
                  <button className="primary" onClick={copyDraft}>
                    {copied ? "Copied to clipboard ✓" : "Copy my message"}
                  </button>
                </div>
                <p className="send-note">
                  Momo cannot send this for you. Paste it into the
                  airline&apos;s official claim or complaint channel when you
                  are ready.
                </p>
                <section
                  className="draft-next-steps"
                  aria-label="After you send your message"
                >
                  <b>After you send it</b>
                  <ol>
                    <li>
                      Save a copy of the message, airline form, and any
                      receipt.
                    </li>
                    <li>
                      Set yourself a 14-day reminder to check for a response.
                      This is your reminder, not a legal deadline.
                    </li>
                    <li>
                      When the airline replies, return here and add it to your
                      case story.
                    </li>
                  </ol>
                </section>
                <OutcomePanel
                  disruptionType={caseData.disruptionType}
                  delayMinutes={
                    Number(
                      facts.find(
                        (fact) => fact.field === "final_arrival_delay_minutes",
                      )?.value ?? 0,
                    ) || null
                  }
                />
              </>
            )}
          </section>
        </>
      )}
      <footer className="site-footer">
        <span>
          © {new Date().getFullYear()} Momo · Calm support for flight
          disruption claims
        </span>
        <Link href="/terms">Terms &amp; privacy summary</Link>
      </footer>
    </main>
  );
}
