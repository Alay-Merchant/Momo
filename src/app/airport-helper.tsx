"use client";

const airports = [
  ["LHR", "London Heathrow"], ["LGW", "London Gatwick"], ["MAN", "Manchester"], ["EDI", "Edinburgh"], ["GLA", "Glasgow"], ["BHX", "Birmingham"], ["DUB", "Dublin"],
  ["CDG", "Paris Charles de Gaulle"], ["FCO", "Rome Fiumicino"], ["AMS", "Amsterdam Schiphol"], ["FRA", "Frankfurt"], ["MAD", "Madrid"], ["ZRH", "Zurich"],
] as const;

export default function AirportHelper({ onChoose }: { onChoose: (code: string) => void }) {
  return <details className="airport-helper"><summary>Don&apos;t know the airport code?</summary><p>Choose a common airport below, or type the three letters from your booking.</p><div>{airports.map(([code, name]) => <button type="button" key={code} onClick={() => onChoose(code)}>{name} <b>({code})</b></button>)}</div></details>;
}
