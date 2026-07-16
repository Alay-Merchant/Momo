import type { GlobalGuidance } from "@/lib/global-passenger-rights";

const symbols = { CAD: "C$", USD: "US$", SGD: "S$" } as const;

export default function GlobalRightsCard({
  guidance,
}: {
  guidance: GlobalGuidance[];
}) {
  if (!guidance.length) return null;

  return (
    <section className="global-rights" aria-label="Extra guidance for this international journey">
      <p className="receipt-eyebrow">INTERNATIONAL JOURNEY NOTE</p>
      <h2>Other local rules may matter too.</h2>
      <p>
        These notes are separate from Momo&apos;s UK/EU estimate. Each amount
        keeps its own currency; Momo never converts or combines them.
      </p>
      {guidance.map((item) => {
        const symbol = item.currency ? symbols[item.currency] : "";
        return (
          <article key={item.jurisdiction}>
            <h3>
              {item.jurisdiction}
              {item.currency ? ` (${item.currency})` : ""}
            </h3>
            <b>{item.headline}</b>
            <p>{item.detail}</p>
            {item.amounts && item.currency && (
              <ul>
                {item.amounts.map((band) => (
                  <li key={band.label}>
                    <b>{band.label}:</b>{" "}
                    {band.fixedAmount !== undefined
                      ? `${symbol}${band.fixedAmount}`
                      : `${symbol}${band.largeCarrier} large carrier / ${symbol}${band.smallCarrier} small carrier`}
                  </li>
                ))}
              </ul>
            )}
            {item.officialSource && (
              <a href={item.officialSource.url} target="_blank" rel="noreferrer">
                {item.officialSource.title}
              </a>
            )}
            {item.overlapNote && <small>{item.overlapNote}</small>}
          </article>
        );
      })}
    </section>
  );
}
