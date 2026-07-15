import Link from "next/link";

const examples = [
  ["My flight was delayed", "Momo can help you understand what matters, organise receipts, and prepare a calm message."],
  ["My flight was cancelled", "Momo can help you check the airline's response and ask about rerouting, refunds, or compensation."],
  ["I missed a connection", "Momo can help you work out which booking details matter and what to ask next."],
  ["The airline said no", "Momo can explain a vague rejection, show the unanswered questions, and prepare a measured reply."],
  ["I was denied boarding", "Momo can help you record what happened and ask the airline to review its decision."],
  ["I have receipts", "Momo can add reasonable expenses to your evidence checklist and case story."],
];

export default function HelpPage() {
  return <main className="help-page"><header className="topbar"><Link className="brand" href="/"><span role="img" aria-label="Momo the panda">🐼</span><span>Momo</span></Link><Link className="text-button" href="/">Back to Momo</Link></header><section className="help-hero"><span className="help-panda" role="img" aria-label="Friendly panda">🐼</span><p className="eyebrow">WHAT MOMO CAN HELP WITH</p><h1>You do not need to know the flight rules first.</h1><p>Choose the situation closest to yours. Momo will ask simple questions and explain why they matter.</p></section><section className="help-grid">{examples.map(([title, text]) => <article key={title}><span>✦</span><h2>{title}</h2><p>{text}</p><Link href="/">Ask Momo about this →</Link></article>)}</section><p className="help-note">Momo gives general information and communication support. It does not guarantee an outcome.</p></main>;
}
