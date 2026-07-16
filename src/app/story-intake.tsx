"use client";

import { useState } from "react";

type Recognition = { lang: string; interimResults: boolean; continuous: boolean; start(): void; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
type RecognitionWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

export default function StoryIntake({ onUse }: { onUse: (story: string) => void }) {
  const [story, setStory] = useState("");
  const [listening, setListening] = useState(false);
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState("");
  const startVoice = () => {
    if (!consent) return setNotice("Please confirm that you want to use your browser's voice service first.");
    const RecognitionApi = (window as RecognitionWindow).SpeechRecognition ?? (window as RecognitionWindow).webkitSpeechRecognition;
    if (!RecognitionApi) return setNotice("Voice input is not available in this browser. You can still type your story below.");
    const recognition = new RecognitionApi();
    recognition.lang = "en-GB"; recognition.interimResults = false; recognition.continuous = false;
    recognition.onresult = (event) => { setStory((current) => `${current}${current ? " " : ""}${event.results[0][0].transcript}`); setNotice("Momo wrote down what it heard. Please check it."); };
    recognition.onerror = () => setNotice("Momo could not hear that clearly. Try again or type instead.");
    recognition.onend = () => setListening(false);
    setListening(true); setNotice("Listening on this device..."); recognition.start();
  };
  return <section className="care-checklist" aria-label="Describe what happened"><p className="receipt-eyebrow">START WITH THE STORY</p><h2>Tell Momo what happened</h2><p>Type freely, or optionally use your browser&apos;s voice feature. Momo does not record or upload audio to OpenAI; your browser may process speech under its own privacy terms.</p><label className="terms-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> I allow this browser to request microphone access for voice-to-text.</label><textarea value={story} onChange={(event) => setStory(event.target.value)} placeholder="For example: We left London, landed unexpectedly, waited for hours, missed our connection, and were given a small voucher." maxLength={3000} /><div className="reply-actions"><button type="button" className="secondary" onClick={startVoice} disabled={!consent || listening}>{listening ? "Listening..." : "Tell Momo by voice"}</button><button type="button" className="primary" disabled={!story.trim()} onClick={() => { onUse(story.trim()); setNotice("Story added. Momo will now ask only for the key missing facts."); }}>Use this story</button></div>{notice && <small role="status">{notice}</small>}</section>;
}
