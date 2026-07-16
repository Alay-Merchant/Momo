"use client";

import { useState } from "react";

const items = ["Food or drink", "A place to stay", "Transport to/from accommodation", "A way to contact family or work", "A clear rerouting plan"];

export default function StrandedNow({ location }: { location?: string }) {
  const [checked, setChecked] = useState<string[]>([]);
  return <section className="care-checklist stranded-now" aria-label="Help while you are stranded"><p className="receipt-eyebrow">IF YOU ARE STILL STUCK</p><h2>Get the essentials written down now.</h2><p>{location ? `You told Momo you were stranded or diverted to ${location}. ` : ""}Ask the airline for care and a clear next travel plan. Keep reasonable itemised receipts if help is not provided.</p><div style={{ display: "grid", gap: "10px" }}>{items.map((item) => <label key={item} style={{ display: "flex", alignItems: "center", gap: "9px" }}><input type="checkbox" checked={checked.includes(item)} onChange={() => setChecked((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])} /> I asked for {item.toLowerCase()}</label>)}</div><small>Do not agree that a voucher settles your whole case unless that is what you want. Momo cannot decide whether a specific expense will be reimbursed.</small></section>;
}
