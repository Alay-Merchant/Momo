"use client";

import { useEffect, useState } from "react";
import { demoSocialProof, humanDisruption, type SocialProof } from "@/lib/social-proof";

function rotate(entries: SocialProof[]) {
  return [...entries].sort(() => Math.random() - 0.5).slice(0, 5);
}

export default function SocialProofTicker() {
  // Keep the server and first browser render identical; rotate only after hydration.
  const [entries, setEntries] = useState(() => demoSocialProof.slice(0, 5));
  const [demo, setDemo] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch("/api/social-proof")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.entries)) {
          setEntries(rotate(data.entries));
          setDemo(Boolean(data.demo));
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <section className="wins-ticker" aria-label="Recent Momo compensation wins">
      <div className="wins-label">
        <span aria-hidden="true">✦</span><b>Momo wins</b><small>{demo ? "Demo examples" : "Shared anonymously"}</small>
        <button type="button" className="ticker-control" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
          {paused ? "Play updates" : "Pause updates"}
        </button>
      </div>
      <div className="wins-track" onFocus={() => setPaused(true)}>
        <div className={`wins-list ${paused ? "paused" : ""}`} aria-live="off">
          {entries.map((entry, index) => <p key={`${entry.city}-${entry.compensation}-${index}`}>Someone from <b>{entry.city}</b> recently received <b>£{entry.compensation}</b> for a flight {humanDisruption(entry.disruption_type)}.</p>)}
        </div>
      </div>
    </section>
  );
}
