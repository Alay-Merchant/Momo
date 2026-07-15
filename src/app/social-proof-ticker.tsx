"use client";

import { useEffect, useState } from "react";
import { demoSocialProof, humanDisruption, type SocialProof } from "@/lib/social-proof";

function rotate(entries: SocialProof[]) { return [...entries].sort(() => Math.random() - 0.5).slice(0, 5); }
export default function SocialProofTicker() {
  const [entries, setEntries] = useState(() => rotate(demoSocialProof));
  const [demo, setDemo] = useState(true);
  useEffect(() => { fetch("/api/social-proof").then((response) => response.json()).then((data) => { if (Array.isArray(data.entries)) { setEntries(rotate(data.entries)); setDemo(Boolean(data.demo)); } }).catch(() => undefined); }, []);
  return <section className="wins-ticker" aria-label="Recent Momo compensation wins"><div className="wins-label"><span>✦</span><b>Momo wins</b><small>{demo ? "Demo examples" : "Shared anonymously"}</small></div><div className="wins-track"><div className="wins-list">{entries.map((entry, index) => <p key={`${entry.city}-${entry.compensation}-${index}`}>Someone from <b>{entry.city}</b> recently received <b>£{entry.compensation}</b> for a flight {humanDisruption(entry.disruption_type)}.</p>)}</div></div></section>;
}
