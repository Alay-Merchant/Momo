"use client";

import { useState } from "react";
import type { FlightLookupResult } from "@/lib/flight-lookup";

function localDate(value: string) { const parsed = Date.parse(value); return Number.isFinite(parsed) ? new Date(parsed).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Not reported"; }
export default function FlightLookup({ flightNumber, flightDate, onUseDelay }: { flightNumber: string; flightDate: string; onUseDelay: (minutes: number) => void }) {
  const [result, setResult] = useState<FlightLookupResult | null>(null); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  const lookup = async () => { setLoading(true); setMessage(""); setResult(null); const response = await fetch("/api/flights/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ flightNumber, flightDate }) }); const data = await response.json(); setLoading(false); if (!response.ok) return setMessage(data.error ?? "Momo could not look up that flight."); setResult(data.flight); setMessage(data.notice); };
  const reportedDelay = result?.arrivalDelayMinutes ?? null;
  return <section className="flight-lookup"><div><b>Not sure when you arrived?</b><p>Look up the public flight record using the flight number and travel date. You will check any result before Momo uses it.</p></div><button className="secondary" onClick={lookup} disabled={loading}>{loading ? "Looking up flight…" : "Find public flight times"}</button>{message && <p className="insight-message" role="status">{message}</p>}{result && <div className="flight-result"><p><b>{result.airline ?? "Flight"} {result.flightNumber}</b> · {result.status ?? "Status not reported"}</p><p>Scheduled arrival: {result.scheduledArrival ? localDate(result.scheduledArrival) : "Not reported"}<br/>Reported arrival: {result.actualArrival ? localDate(result.actualArrival) : "Not reported"}<br/>Reported departure: {result.actualDeparture ? localDate(result.actualDeparture) : "Not reported"}</p>{reportedDelay !== null ? <button className="secondary" onClick={() => onUseDelay(reportedDelay)}>Use reported delay: {Math.floor(reportedDelay / 60)}h {reportedDelay % 60}m</button> : <p>Momo could not calculate a delay from this record.</p>}</div>}</section>;
}
