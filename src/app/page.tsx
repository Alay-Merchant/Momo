"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AccountPanel, { type AccountUser } from "@/app/account-panel";
import AirportHelper from "@/app/airport-helper";
import CareChecklist from "@/app/care-checklist";
import ClaimCommandCentre, { type ClaimStage } from "@/app/claim-command-centre";
import { CommunityInsights, OutcomePanel } from "@/app/community-panels";
import EscalationCard from "@/app/escalation-card";
import FlightLookup from "@/app/flight-lookup";
import GlobalRightsCard from "@/app/global-rights-card";
import MomoMascot, { MomoMoodCarousel } from "@/app/momo-mascot";
import OfferCompass from "@/app/offer-compass";
import ProofMap from "@/app/proof-map";
import SocialProofTicker from "@/app/social-proof-ticker";
import TrustReceipt from "@/app/trust-receipt";
import WorkTripPack from "@/app/work-trip-pack";
import type { CaseFact, FlightCase } from "@/lib/case-types";
import { createBlankFlightCase, flightFixtures } from "@/lib/fixtures";
import {
  calculateCompensation,
  evaluateFlightCase,
  flightRuleCards,
} from "@/lib/flight-rules";
import { globalPassengerGuidance } from "@/lib/global-passenger-rights";

type Screen = "start" | "facts" | "result" | "reply" | "draft";
type ReplyEvent = {
  id: string;
  author: "airline" | "momo";
  text: string;
  draft?: string;
  questions?: string[];
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

export default function Home() {
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
  const factsReady = [
    "flight_number",
    "route",
    "departure_region",
    "arrival_region",
    "operating_carrier_region",
    "flight_date",
    "final_arrival_delay_minutes",
  ].every((field) => requiredFact(facts, field));
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

  const startOwnCase = () => {
    const blank = createBlankFlightCase();
    setCaseData(blank);
    setFacts(blank.facts);
    setReply("");
    setReplyHistory([]);
    setGeneratedDraft("");
    setClaimStage("draft_ready");
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
    setJourneyMessage("");
    setScreen("facts");
  };
  const goTo = (next: Screen) => {
    if ((next === "result" || next === "reply") && !factsReady)
      return setJourneyMessage(
        "Before continuing, add your flight number, journey, departure and destination regions, operating airline region, travel date, and arrival delay.",
      );
    if (next === "draft" && !generatedDraft)
      return setJourneyMessage(
        "Add the airline's reply and ask Momo to prepare a message first.",
      );
    setJourneyMessage("");
    setScreen(next);
  };
  const updateFact = (id: string, value: string) =>
    setFacts((current) =>
      current.map((fact) =>
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
      ),
    );
  const updateDelay = (hours: string, minutes: string) => {
    const total = Math.max(
      0,
      Math.min(10_080, (Number(hours) || 0) * 60 + (Number(minutes) || 0)),
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
          addedAt: new Date().toLocaleString("en-GB"),
        },
      ]);
      setReplyStatus(
        `${reviewTier === "deep" ? "Deeper" : "Quick"} review complete. Momo prepared a draft using your confirmed facts. Please read and edit it before sending.`,
      );
    } catch {
      setReplyStatus(
        "Momo could not connect right now. Your airline reply is still kept in this browser.",
      );
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
      {screen === "start" && (
        <>
          <SocialProofTicker />
          <section className="landing">
            <div className="hero-copy">
              <div className="momo-welcome">
                <MomoMoodCarousel />
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
            >
              1. Check facts
            </button>
            <button
              type="button"
              onClick={() => goTo("result")}
              className={
                screen === "result"
                  ? "active"
                  : ["reply", "draft"].includes(screen)
                    ? "done"
                    : ""
              }
            >
              2. What Momo found
            </button>
            <button
              type="button"
              onClick={() => goTo("reply")}
              className={
                screen === "reply" ? "active" : screen === "draft" ? "done" : ""
              }
            >
              3. Airline reply
            </button>
            <button
              type="button"
              onClick={() => goTo("draft")}
              className={screen === "draft" ? "active" : ""}
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
          <section className="workspace">
            {screen === "facts" && (
              <>
                <div className="section-heading">
                  <MomoMascot mood="thinking" compact />
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
                <div className="facts">
                  {facts
                    .filter((fact) => fact.field !== "flight_distance_km")
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
                        <Pill
                          kind={
                            fact.confirmed
                              ? "green"
                              : requiredFact(facts, fact.field)
                                ? "blue"
                                : "amber"
                          }
                        >
                          {fact.confirmed
                            ? "Checked"
                            : requiredFact(facts, fact.field)
                              ? "Added"
                              : "Add if you know"}
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
                  <MomoMascot mood="thinking" compact />
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
                  <MomoMascot mood="listening" compact />
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
                    <MomoMascot mood={replyStatus ? "working" : "listening"} compact />
                    <div>
                      <b>Momo</b>
                      <p>
                        I&apos;ll keep the important details together. You stay
                        in control of every message.
                      </p>
                    </div>
                  </div>
                  {replyHistory.length > 0 && (
                    <div className="chat-thread">
                      {replyHistory.map((event) => (
                        <article
                          className={`chat-bubble ${event.author}`}
                          key={event.id}
                        >
                          <b>
                            {event.author === "momo" ? "Momo" : "Airline reply"}
                          </b>
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
                    <div className="reply-actions">
                      <button className="secondary" onClick={addReply}>
                        Add airline reply
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
                  <button className="primary" onClick={() => goTo("draft")}>
                    Open latest message <span>→</span>
                  </button>
                </div>
              </>
            )}
            {screen === "draft" && (
              <>
                <div className="section-heading">
                  <MomoMascot mood="celebrating" compact />
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
