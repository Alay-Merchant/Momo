"use client";

import { FormEvent, useState } from "react";
import { delayBand, type DisruptionType } from "@/lib/community-insights";

const reasons = [
  "operational",
  "technical",
  "crew",
  "weather",
  "air_traffic_control",
  "security",
  "other",
  "unspecified",
];
const resolutions = [
  ["cash_payment", "Cash payment"],
  ["voucher", "Voucher"],
  ["refund", "Refund"],
  ["rerouting", "Replacement flight"],
  ["expenses", "Expenses repaid"],
  ["no_offer", "No offer"],
  ["not_resolved", "Still not resolved / Momo did not help"],
  ["other", "Other"],
] as const;
const unresolvedReasons = [["airline_did_not_reply", "The airline did not reply"], ["airline_refused", "The airline refused"], ["needed_more_evidence", "I needed evidence I did not have"], ["momo_misunderstood", "Momo misunderstood my situation"], ["different_help_needed", "I needed different help"], ["other", "Another reason"]] as const;

export function CommunityInsights({
  disruptionType,
  delayMinutes,
}: {
  disruptionType: DisruptionType;
  delayMinutes: number | null;
}) {
  const [airline, setAirline] = useState("");
  const [reasonCategory, setReasonCategory] = useState("unspecified");
  const [message, setMessage] = useState("");
  const [research, setResearch] = useState<{
    summary: string;
    source_urls: string[];
  } | null>(null);
  const check = async (requestResearch = false) => {
    setMessage("");
    setResearch(null);
    const response = await fetch("/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        airline,
        disruptionType,
        delayMinutes,
        reasonCategory,
        requestResearch,
      }),
    });
    const data = await response.json();
    if (!response.ok)
      return setMessage(
        data.error ?? data.message ?? "Momo could not check that yet.",
      );
    setMessage(data.message);
    if (data.research) setResearch(data.research);
    if (data.community)
      setMessage(
        `${data.message} Offers seen: ${data.community.offered_low ?? "—"} to ${data.community.offered_high ?? "—"} ${data.community.common_resolution ? `· Common resolution: ${data.community.common_resolution.replaceAll("_", " ")}` : ""}`,
      );
  };
  return (
    <section className="community-panel">
      <h2>What has Momo seen in similar cases?</h2>
      <p>
        These are anonymous patterns, never a promised result. Momo only shows a
        pattern after at least 10 similar outcomes.
      </p>
      <div className="community-fields">
        <label>
          Airline
          <input
            value={airline}
            onChange={(event) => setAirline(event.target.value)}
            maxLength={80}
            placeholder="e.g. British Airways"
          />
        </label>
        <label>
          Airline&apos;s reason
          <select
            value={reasonCategory}
            onChange={(event) => setReasonCategory(event.target.value)}
          >
            {reasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="community-actions">
        <button className="secondary" onClick={() => check()}>
          Check anonymous patterns
        </button>
        <button className="text-button" onClick={() => check(true)}>
          Check official sources
        </button>
      </div>
      {message && (
        <p className="insight-message" role="status">
          {message}
        </p>
      )}
      {research && (
        <div className="official-note">
          <b>Official-source note</b>
          <p>{research.summary}</p>
          {research.source_urls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              Open source ↗
            </a>
          ))}
        </div>
      )}
      <small>
        Current delay band: {delayBand(delayMinutes).replaceAll("_", " ")}. Live
        checks are limited to keep costs low.
      </small>
    </section>
  );
}

export function OutcomePanel({
  disruptionType,
  delayMinutes,
}: {
  disruptionType: DisruptionType;
  delayMinutes: number | null;
}) {
  const [airline, setAirline] = useState("");
  const [reasonCategory, setReasonCategory] = useState("unspecified");
  const [resolutionType, setResolutionType] = useState("cash_payment");
  const [unresolvedReason, setUnresolvedReason] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [offeredAmount, setOfferedAmount] = useState("");
  const [acceptedAmount, setAcceptedAmount] = useState("");
  const [optedIn, setOptedIn] = useState(false);
  const [shareInTicker, setShareInTicker] = useState(false);
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/outcomes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        airline,
        disruptionType,
        delayMinutes,
        reasonCategory,
        resolutionType,
        unresolvedReason,
        requestedAmount,
        offeredAmount,
        acceptedAmount,
        currency: "GBP",
        optedIn,
        shareInTicker,
        city,
      }),
    });
    const data = await response.json();
    setMessage(
      data.message ?? data.error ?? "Momo could not save that outcome.",
    );
  };
  return (
    <section className="outcome-panel">
      <h2>Did the airline resolve your case?</h2>
      <p>
        If you choose to share, Momo stores only these anonymous outcome fields.
        It never shares your email, booking, documents, message, or this claim.
      </p>
      <form onSubmit={submit}>
        <div className="community-fields">
          <label>
            Airline
            <input
              value={airline}
              onChange={(event) => setAirline(event.target.value)}
              required
              maxLength={80}
            />
          </label>
          <label>
            Reason category
            <select
              value={reasonCategory}
              onChange={(event) => setReasonCategory(event.target.value)}
            >
              {reasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Solution
            <select
              value={resolutionType}
              onChange={(event) => setResolutionType(event.target.value)}
            >
              {resolutions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {resolutionType === "not_resolved" && <label className="city-field">What stopped this being resolved?<select value={unresolvedReason} onChange={(event) => setUnresolvedReason(event.target.value)} required><option value="">Choose one</option>{unresolvedReasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><small>Please choose a category only—do not add names, booking references, or message text.</small></label>}
        <div className="money-fields">
          <label>
            Asked for (£)
            <input
              type="number"
              min="0"
              max="50000"
              step="0.01"
              value={requestedAmount}
              onChange={(event) => setRequestedAmount(event.target.value)}
            />
          </label>
          <label>
            Offered (£)
            <input
              type="number"
              min="0"
              max="50000"
              step="0.01"
              value={offeredAmount}
              onChange={(event) => setOfferedAmount(event.target.value)}
            />
          </label>
          <label>
            Accepted (£)
            <input
              type="number"
              min="0"
              max="50000"
              step="0.01"
              value={acceptedAmount}
              onChange={(event) => setAcceptedAmount(event.target.value)}
            />
          </label>
        </div>
        <label className="opt-in">
          <input
            type="checkbox"
            checked={optedIn}
            onChange={(event) => setOptedIn(event.target.checked)}
          />{" "}
          I agree to share only these anonymous outcome details to improve Momo.
        </label>
        <label className="opt-in">
          <input
            type="checkbox"
            checked={shareInTicker}
            onChange={(event) => setShareInTicker(event.target.checked)}
          />{" "}
          I also agree that Momo may show a short anonymous win, using only my
          city, amount accepted, and issue type.
        </label>
        {shareInTicker && (
          <label className="city-field">
            City for the public example
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              maxLength={60}
              required
            />
          </label>
        )}
        <button className="secondary" type="submit">
          Share anonymous outcome
        </button>
        {message && (
          <p className="insight-message" role="status">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
