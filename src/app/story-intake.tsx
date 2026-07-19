"use client";

import { useState } from "react";
import { extractStoryFacts, type StoryFact } from "@/lib/story-extraction";
import type { AiStoryFact } from "@/lib/story-extraction-ai";

type ExtractedFact = StoryFact | AiStoryFact;

export default function StoryIntake({
  onUse,
}: {
  onUse: (story: string, extracted: ExtractedFact[], source: "ai" | "basic") => void;
}) {
  const [story, setStory] = useState("");
  const [notice, setNotice] = useState("");
  const [organising, setOrganising] = useState(false);

  const organise = async () => {
    const cleanStory = story.trim();
    if (!cleanStory) return;
    setOrganising(true);
    setNotice("Momo is reading your story and picking out only clear details…");
    try {
      const response = await fetch("/api/momo/extract-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: cleanStory }),
      });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.facts)) throw new Error(data.error ?? "Momo could not organise that story right now.");
      onUse(cleanStory, data.facts, "ai");
      setNotice("Momo added draft details below. Check each one — it will never guess a missing fact.");
    } catch {
      const basicFacts = extractStoryFacts(cleanStory);
      onUse(cleanStory, basicFacts, "basic");
      setNotice(
        basicFacts.length
          ? "Momo's AI organiser is unavailable, so it added only the obvious details it could spot. Please check them."
          : "Momo could not safely pick out a detail. Your story is saved, and you can fill in the form yourself.",
      );
    } finally {
      setOrganising(false);
    }
  };

  return (
    <section className="story-intake" aria-label="Describe what happened">
      <p className="receipt-eyebrow">START WITH YOUR STORY (OPTIONAL)</p>
      <h2>Tell Momo what happened</h2>
      <p>
        Write naturally and Momo will fill in only details it can clearly see.
        You can also skip this and complete the form yourself.
      </p>
      <textarea
        value={story}
        onChange={(event) => setStory(event.target.value)}
        maxLength={3000}
        placeholder="For example: I was flying BA123 from London to Madrid on 1 July. We arrived four hours late and the airline said it was an operational problem."
      />
      <div className="reply-actions">
        <button type="button" className="primary" disabled={!story.trim() || organising} onClick={organise}>
          {organising ? "Momo is organising your story…" : "Use this story"}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={!story.trim() || organising}
          onClick={() => {
            const cleanStory = story.trim();
            onUse(cleanStory, extractStoryFacts(cleanStory), "basic");
            setNotice("Momo added only obvious details. You can review or complete the form below.");
          }}
        >
          Use basic extraction instead
        </button>
      </div>
      {notice && <small className="story-notice" role="status">{notice}</small>}
    </section>
  );
}
