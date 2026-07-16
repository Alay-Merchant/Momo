"use client";

export type ClaimStage =
  | "draft_ready"
  | "sent"
  | "waiting"
  | "offer_received"
  | "resolved";

const stages: { id: ClaimStage; label: string; description: string }[] = [
  { id: "draft_ready", label: "Draft ready", description: "Check and send your message yourself." },
  { id: "sent", label: "Sent", description: "Keep the submission confirmation with your case." },
  { id: "waiting", label: "Waiting for a reply", description: "Use your own reminder to check back." },
  { id: "offer_received", label: "Offer received", description: "Add the offer so Momo can help you compare it." },
  { id: "resolved", label: "Resolved", description: "Share an anonymous outcome only if you want to." },
];

export default function ClaimCommandCentre({
  stage,
  onChange,
}: {
  stage: ClaimStage;
  onChange: (stage: ClaimStage) => void;
}) {
  const current = stages.find((item) => item.id === stage) ?? stages[0];
  return (
    <section className="claim-command" aria-label="Your claim command centre">
      <p className="receipt-eyebrow">YOUR CLAIM COMMAND CENTRE</p>
      <h2>Keep control of your direct claim.</h2>
      <p>
        Momo helps you organise and negotiate directly. You decide whether to
        keep going yourself or seek independent help.
      </p>
      <label>
        Where is your claim now?
        <select value={stage} onChange={(event) => onChange(event.target.value as ClaimStage)}>
          {stages.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <p className="command-status"><b>Now:</b> {current.description}</p>
      <ol>
        {stages.map((item) => <li className={item.id === stage ? "active" : ""} key={item.id}>{item.label}</li>)}
      </ol>
    </section>
  );
}
