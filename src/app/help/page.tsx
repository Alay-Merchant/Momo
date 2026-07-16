import Link from "next/link";

const examples = [
  ["My flight was delayed", "Check arrival delay, care costs, and whether the stated reason changes your next step.", "delay"],
  ["My flight was cancelled", "Work through rerouting, refund, notice, and compensation questions in the right order.", "cancellation"],
  ["I missed a connection", "Keep the booking and arrival details together and identify who should review the journey.", "missed_connection"],
  ["I was denied boarding", "Record whether you were ready to travel, why boarding was refused, and what you were offered.", "denied_boarding"],
  ["The airline said no", "Upload a screenshot or PDF, or paste the reply. Momo explains what it says and helps you respond.", "rejection"],
  ["I was offered a voucher or cash", "Compare the offer with the evidence and keep the currency and conditions clear before replying.", "offer"],
  ["I have receipts or expenses", "Make a simple evidence checklist for meals, hotels, transport, and other reasonable costs.", "expenses"],
  ["My flight involves Canada, the US, or Singapore", "Momo can show the relevant local guidance in CAD, USD, or SGD without mixing it with UK/EU amounts.", "international"],
  ["My journey used a major global hub", "Momo can identify where it has verified guidance and clearly flag when a local rule needs checking.", "hub"],
  ["I do not know the actual flight times", "Start with the flight number and date. Momo can try a public flight lookup and you can correct anything it finds.", "lookup"],
] as const;

export default function HelpPage() {
  return <main className="help-page"><header className="topbar"><Link className="brand" href="/"><span role="img" aria-label="Momo the panda">{"\u{1F43C}"}</span><span>Momo</span></Link><Link className="nav-button" href="/">Back to Momo</Link></header><section className="help-hero"><span className="help-panda" role="img" aria-label="Friendly panda">{"\u{1F43C}"}</span><p className="eyebrow">WHAT MOMO CAN HELP WITH</p><h1>You do not need to know the flight rules first.</h1><p>Choose the situation closest to yours. Momo opens a guided case with the right starting point, then asks only the useful questions.</p><Link className="help-cta" href="/?help=delay">Tell Momo what happened &rarr;</Link></section><section className="help-grid">{examples.map(([title, text, topic], index) => <article className={`help-card card-${index + 1}`} key={title}><span>&#10022;</span><h2>{title}</h2><p>{text}</p><Link className="help-card-link" href={`/?help=${topic}`}>Start this guide &rarr;</Link></article>)}</section><p className="help-note">Momo gives general information and communication support. It does not guarantee an outcome.</p></main>;
}
