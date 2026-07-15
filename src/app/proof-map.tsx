import type { Assessment, RuleCard } from "@/lib/case-types";

export default function ProofMap({ confirmedFactCount, assessment, cards }: { confirmedFactCount: number; assessment: Assessment; cards: RuleCard[] }) {
  return <section className="proof-map" aria-label="Why this message is here"><h2>Why this message is here</h2><ul><li><b>Your opening facts:</b> based on {confirmedFactCount} details you checked.</li><li><b>The questions for the airline:</b> ask for the specific event, its link to your flight, and the measures considered. These are clarification requests, not allegations.</li><li><b>The rules mentioned:</b> {cards.length ? cards.map((card) => <a key={card.id} href={card.officialSource.url} target="_blank" rel="noreferrer">{card.framework} official guidance</a>) : "shown only after Momo can select a route rule pack."}</li>{assessment.materialUnknowns.length > 0 && <li><b>What Momo has not assumed:</b> {assessment.materialUnknowns.join("; ")}.</li>}</ul></section>;
}
