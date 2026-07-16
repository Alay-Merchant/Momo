"use client";

import { useEffect, useState } from "react";

export type MomoMood = "hello" | "working" | "sleeping" | "snacking" | "coffee" | "cool" | "boxing" | "celebrating" | "listening" | "thinking" | "travelling";

const details: Record<MomoMood, { bubble: string; prop?: string; scene: string }> = {
  hello: { bubble: "Hello!", scene: "saying hello" },
  working: { bubble: "Checking...", prop: "\u{1F4BB}", scene: "working at a laptop" },
  sleeping: { bubble: "Zzz", scene: "taking a quiet nap" },
  snacking: { bubble: "Snack break", prop: "\u{1F96A}", scene: "having a sandwich" },
  coffee: { bubble: "Fuelled up", prop: "\u{2615}", scene: "having a coffee" },
  cool: { bubble: "You got this", prop: "\u{1F576}\u{FE0F}", scene: "putting on sunglasses" },
  boxing: { bubble: "Let's go!", prop: "\u{1F94A}", scene: "getting ready to fight your corner" },
  celebrating: { bubble: "Nice work!", prop: "\u{1F389}", scene: "celebrating progress" },
  listening: { bubble: "Tell me more", prop: "\u{1F442}", scene: "listening carefully" },
  thinking: { bubble: "Hmm...", prop: "\u{1F4AD}", scene: "thinking through the details" },
  travelling: { bubble: "On the case", prop: "\u{2708}\u{FE0F}", scene: "following the journey" },
};

export default function MomoMascot({ mood = "hello", compact = false }: { mood?: MomoMood; compact?: boolean }) {
  const detail = details[mood];
  return <div aria-label={`Momo is ${mood}`} className={`momo-mascot ${mood} ${compact ? "compact" : ""}`} role="img"><span className="momo-body">{"\u{1F43C}"}</span>{detail.prop && <span className="momo-prop">{detail.prop}</span>}<span className="momo-bubble">{detail.bubble}</span></div>;
}

const showcaseMoods: MomoMood[] = ["coffee", "working", "thinking", "snacking", "listening", "celebrating", "travelling", "sleeping"];

export function MomoMoodCarousel() {
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    let switchTimer: number | undefined;
    const timer = window.setInterval(() => {
      setTransitioning(true);
      switchTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % showcaseMoods.length);
        setTransitioning(false);
      }, 420);
    }, 30_000);
    return () => { window.clearInterval(timer); if (switchTimer) window.clearTimeout(switchTimer); };
  }, []);

  const mood = showcaseMoods[index];
  return <div className={`momo-showcase ${transitioning ? "changing" : ""}`} aria-label={`Momo is ${details[mood].scene}`}><MomoMascot mood={mood} /><span className="momo-scene-label">Momo is {details[mood].scene}</span></div>;
}
