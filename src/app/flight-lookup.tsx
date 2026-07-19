"use client";

import { useState } from "react";
import type { FlightLookupResult } from "@/lib/flight-lookup";

function localDate(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed)
    ? new Date(parsed).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not reported";
}
export default function FlightLookup({
  flightNumber,
  flightDate,
  onUseDelay,
}: {
  flightNumber: string;
  flightDate: string;
  onUseDelay: (minutes: number) => void;
}) {
  const [result, setResult] = useState<FlightLookupResult | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [manualDelay, setManualDelay] = useState("");
  const lookup = async () => {
    setLoading(true);
    setMessage("");
    setResult(null);
    try {
      const response = await fetch("/api/flights/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flightNumber, flightDate }),
      });
      const data = await response.json();
      if (!response.ok)
        return setMessage(
          data.error ?? "Momo could not look up that flight right now.",
        );
      setResult(data.flight);
      setMessage(data.notice);
    } catch {
      setMessage(
        "Momo could not reach the public flight service. You can still enter the arrival delay yourself.",
      );
    } finally {
      setLoading(false);
    }
  };
  const reportedDelay = result?.arrivalDelayMinutes ?? null;
  const useTypedDelay = () => {
    const match = manualDelay.trim().match(/^(?:(\d+)\s*h(?:ours?)?\s*)?(?:(\d+)\s*m(?:in(?:utes?)?)?)?$/i);
    const total = match ? Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0) : 0;
    if (!total) return setMessage("Type a delay such as 2h 30m, or enter the delay using the Hours and Minutes fields above.");
    onUseDelay(total);
    setMessage("Your typed delay has been added. Please check it before continuing.");
  };
  return (
    <section className="flight-lookup">
      <div>
        <b>Not sure when you arrived?</b>
        <p>
          Look up the public flight record using the flight number and travel
          date. You will check any result before Momo uses it.
        </p>
      </div>
      <button className="secondary" onClick={lookup} disabled={loading}>
        {loading ? "Looking up flight…" : "Find public flight times"}
      </button>
      <div className="manual-delay">
        <label htmlFor="manual-delay">Or type how late you arrived</label>
        <input id="manual-delay" value={manualDelay} onChange={(event) => setManualDelay(event.target.value)} placeholder="For example: 2h 30m" />
        <button className="secondary" type="button" onClick={useTypedDelay}>Use typed delay</button>
      </div>
      {message && (
        <p className="insight-message" role="status">
          {message}
        </p>
      )}
      {result && (
        <div className="flight-result">
          <p>
            <b>
              {result.airline ?? "Flight"} {result.flightNumber}
            </b>{" "}
            · {result.status ?? "Status not reported"}
          </p>
          <p>
            Scheduled arrival:{" "}
            {result.scheduledArrival
              ? localDate(result.scheduledArrival)
              : "Not reported"}
            <br />
            Reported arrival:{" "}
            {result.actualArrival
              ? localDate(result.actualArrival)
              : "Not reported"}
            <br />
            Reported departure:{" "}
            {result.actualDeparture
              ? localDate(result.actualDeparture)
              : "Not reported"}
          </p>
          {reportedDelay !== null ? (
            <button
              className="secondary"
              onClick={() => onUseDelay(reportedDelay)}
            >
              Use reported delay: {Math.floor(reportedDelay / 60)}h{" "}
              {reportedDelay % 60}m
            </button>
          ) : (
            <p>Momo could not calculate a delay from this record.</p>
          )}
        </div>
      )}
    </section>
  );
}
