import type { RejectionAnalysis } from "@/lib/rejection-analysis";

const labels = {
  needs_check: "Needs checking",
  incomplete: "Incomplete explanation",
  unsupported: "Unsupported by the reply",
} as const;

export default function RejectionDissector({ analysis, onAddQuestion }: { analysis: RejectionAnalysis; onAddQuestion?: (question: string) => void }) {
  return (
    <section className="rejection-dissector" aria-label="Momo's airline refusal analysis">
      <p className="receipt-eyebrow">AIRLINE REFUSAL ANALYSIS</p>
      <h3>What Momo found in the reply</h3>
      <p>{analysis.summary}</p>
      {analysis.claims.map((claim) => (
        <article key={`${claim.quote}-${claim.question}`}>
          <blockquote>&quot;{claim.quote}&quot;</blockquote>
          <b className={`claim-status ${claim.status}`}>{labels[claim.status]}</b>
          <p>{claim.explanation}</p>
          <small><b>Ask next:</b> {claim.question}</small>
          {onAddQuestion && <button type="button" className="text-button" onClick={() => onAddQuestion(claim.question)}>Add this question to my reply</button>}
        </article>
      ))}
      <p className="dissector-strategy"><b>Suggested approach:</b> {analysis.strategy}</p>
    </section>
  );
}
