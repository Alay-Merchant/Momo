import type { CaseFact } from "@/lib/case-types";

function value(facts: CaseFact[], field: string) {
  return String(facts.find((fact) => fact.field === field)?.value ?? "").trim();
}

export default function JourneyTimeline({ facts }: { facts: CaseFact[] }) {
  const route = value(facts, "route");
  const connections = value(facts, "connection_airports");
  const booking = value(facts, "one_booking");
  const disruptedLeg = value(facts, "disrupted_leg");
  if (!route && !connections) return null;
  return (
    <aside className="care-checklist journey-timeline" aria-label="Your journey map">
      <p className="receipt-eyebrow">YOUR JOURNEY</p><h2>{route || "Your connected journey"}</h2>
      <p>{booking === "Yes" ? "Momo will consider your final ticketed destination and the disrupted leg." : booking === "No" ? "These look like separate tickets, so Momo will keep each flight's protections separate." : "Tell Momo whether the flights were on one booking so it can avoid assuming connection protection."}</p>
      {connections && <p><b>Connection stop{connections.includes(",") ? "s" : ""}:</b> {connections}</p>}
      {disruptedLeg && <p><b>Disrupted leg:</b> {disruptedLeg}</p>}
    </aside>
  );
}
