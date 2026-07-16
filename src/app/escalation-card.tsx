export default function EscalationCard({ frameworks }: { frameworks: string[] }) {
  const uk = frameworks.includes("UK261");
  return (
    <section className="escalation-card">
      <p className="receipt-eyebrow">IF THE AIRLINE STILL SAYS NO</p>
      <h2>Keep the conversation evidence-led.</h2>
      <p>
        First use the airline&apos;s own complaint process and keep its response.
        Momo will not tell you to threaten action or skip a step.
      </p>
      {uk ? (
        <p>
          For a UK261 journey, the Civil Aviation Authority explains when an
          airline complaint can be considered by an approved ADR provider.
          Check the airline&apos;s scheme and the CAA guidance before escalating.
        </p>
      ) : (
        <p>
          Escalation options vary by the airline and country. Use the official
          passenger-rights source shown above before choosing a next step.
        </p>
      )}
      <a href="https://www.caa.co.uk/air-passengers/travel-problems-and-rights/travel-complaints/alternative-dispute-resolution/" target="_blank" rel="noreferrer">
        Read the CAA&apos;s ADR guidance
      </a>
    </section>
  );
}
