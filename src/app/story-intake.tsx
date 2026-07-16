"use client";

import { useState } from "react";
import { extractStoryFacts, type StoryFact } from "@/lib/story-extraction";

export default function StoryIntake({ onUse }: { onUse: (story: string, extracted: StoryFact[]) => void }) {
  const [story, setStory] = useState("");
  const [notice, setNotice] = useState("");
  return <section className="story-intake" aria-label="Describe what happened" style={{ width: "100%", padding: "24px", margin: "0 0 22px", border: "1px solid #c8dbef", borderRadius: "16px", background: "#f5f9ff", boxSizing: "border-box" }}><p className="receipt-eyebrow">START WITH THE STORY</p><h2>Tell Momo what happened</h2><p>Write it naturally, in your own words. Momo will keep it as a draft for you to check, then ask only for the key facts it still needs.</p><textarea value={story} onChange={(event) => setStory(event.target.value)} placeholder="For example: We left London, landed unexpectedly, waited for hours, missed our connection, and were given a small voucher." maxLength={3000} style={{ width: "100%", minHeight: "190px", boxSizing: "border-box", resize: "vertical", padding: "14px", border: "1px solid #8ea8bb", borderRadius: "12px", fontSize: "16px" }} /><div className="reply-actions"><button type="button" className="primary" disabled={!story.trim()} onClick={() => { const extracted = extractStoryFacts(story.trim()); onUse(story.trim(), extracted); setNotice(extracted.length ? "Momo found a few draft facts below. Please check them." : "Story added. Momo will now ask only for the key missing facts."); }}>Use this story</button></div>{notice && <small role="status">{notice}</small>}</section>;
}
