"use client";

import { useEffect, useState } from "react";

export type MomoMood =
  | "hello"
  | "working"
  | "sleeping"
  | "snacking"
  | "coffee"
  | "cool"
  | "boxing"
  | "celebrating"
  | "listening"
  | "thinking"
  | "travelling";

const details: Record<MomoMood, { bubble: string; prop?: string }> = {
  hello: { bubble: "Hello!" },
  working: { bubble: "Checking…", prop: "\u{1F4BB}" },
  sleeping: { bubble: "Zzz" },
  snacking: { bubble: "Snack break", prop: "\u{1F96A}" },
  coffee: { bubble: "Fuelled up", prop: "\u{2615}" },
  cool: { bubble: "You got this", prop: "\u{1F576}\u{FE0F}" },
  boxing: { bubble: "Let’s go!", prop: "\u{1F94A}" },
  celebrating: { bubble: "Nice work!", prop: "\u{1F389}" },
  listening: { bubble: "Tell me more", prop: "\u{1F442}" },
  thinking: { bubble: "Hmm…", prop: "\u{1F4AD}" },
  travelling: { bubble: "On the case", prop: "\u{2708}\u{FE0F}" },
};

export default function MomoMascot({
  mood = "hello",
  compact = false,
}: {
  mood?: MomoMood;
  compact?: boolean;
}) {
  const detail = details[mood];

  return (
    <div
      aria-label={`Momo is ${mood}`}
      className={`momo-mascot ${mood} ${compact ? "compact" : ""}`}
      role="img"
    >
      <span className="momo-bamboo">{"\u{1F38B}"}</span>
      <span className="momo-body">{"\u{1F43C}"}</span>
      {detail.prop && <span className="momo-prop">{detail.prop}</span>}
      <span className="momo-bubble">{detail.bubble}</span>
    </div>
  );
}

const showcaseMoods: MomoMood[] = [
  "hello",
  "working",
  "thinking",
  "snacking",
  "coffee",
  "cool",
  "boxing",
  "celebrating",
  "listening",
  "travelling",
  "sleeping",
];

export function MomoMoodCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % showcaseMoods.length),
      4200,
    );
    return () => window.clearInterval(timer);
  }, []);

  return <MomoMascot mood={showcaseMoods[index]} />;
}
