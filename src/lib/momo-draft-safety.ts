import type { createDecisionReceipt } from "@/lib/case-receipt";
import type { MomoReply } from "@/lib/momo-reply";

type Receipt = ReturnType<typeof createDecisionReceipt>;

const prohibited =
  /\b(we (are|represent) (a |your )?lawyer|our legal team|commence proceedings|take you to court|guarantee(?:d)?|definitely (owe|entitled)|punitive damages|report you to the regulator)\b/i;

export function replyIsGrounded(reply: MomoReply, receipt: Receipt) {
  const text = `${reply.explanation}\n${reply.draft}`;
  if (prohibited.test(text)) return false;
  const amounts = [...text.matchAll(/[\u00a3\u20ac]\s?([\d,]+)/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter(Number.isFinite);
  if (amounts.some((amount) => amount !== receipt.compensation.amount))
    return false;
  const urls = [...text.matchAll(/https?:\/\/[^\s)]+/g)].map((match) => match[0]);
  return urls.every((url) => receipt.cards.some((card) => card.source === url));
}

function replyState(replyText: string) {
  const text = replyText.toLowerCase();
  const cause =
    /weather|air traffic|technical|mechanical|crew|operational|security|strike|airport closure/.exec(
      text,
    )?.[0] ?? null;
  return {
    cause,
    explainsLink:
      /because|due to|caused by|resulted in|affected (?:this )?flight/.test(
        text,
      ),
    mentionsMeasures:
      /reasonable measures|all measures|rerout|alternative flight|mitigat/.test(
        text,
      ),
  };
}

export function safeTemplate(receipt: Receipt, replyText = ""): MomoReply {
  const flight = String(
    receipt.facts.find((fact) => fact.field === "flight_number")?.value ??
      "my flight",
  );
  const date = String(
    receipt.facts.find((fact) => fact.field === "flight_date")?.value ??
      "the travel date",
  );
  const route = String(
    receipt.facts.find((fact) => fact.field === "route")?.value ?? "my journey",
  );
  const frameworks = receipt.assessment.frameworkCandidates.join(" and ");
  const source = receipt.cards[0]?.source;
  const currency = receipt.compensation.currency === "GBP" ? "\u00a3" : "\u20ac";
  const amount =
    receipt.compensation.amount && receipt.compensation.currency
      ? ` Please also confirm whether ${currency}${receipt.compensation.amount} per passenger is payable if the applicable conditions are met.`
      : "";
  const unknowns = receipt.assessment.materialUnknowns.length
    ? ` Momo still needs: ${receipt.assessment.materialUnknowns.join(", ")}.`
    : "";
  const state = replyState(replyText);
  const questions = [
    !state.cause && "What specific event does the airline say caused the disruption?",
    state.cause &&
      !state.explainsLink &&
      "How does the airline say that event affected this particular flight?",
    !state.mentionsMeasures &&
      "What reasonable measures does the airline say it considered or took?",
  ].filter(Boolean) as string[];
  const nextRequest = questions.length
    ? questions.join(" ")
    : "Please provide the supporting records or a clear explanation for the decision.";

  return {
    explanation: `${state.cause ? `The airline has now named \u201c${state.cause}\u201d as its reason. That is useful context, but it remains the airline's account.` : "The airline has not yet named a specific disruption cause."} You do not need airline-internal evidence yourself\u2014tell Momo what happened or what the airline said, then ask the airline to explain its decision. Momo has kept this response limited to your confirmed facts and the ${frameworks || "currently unconfirmed"} route.${unknowns}`,
    questions,
    draft: `Subject: Request for a reasoned review \u2014 ${flight} on ${date}\n\nDear Customer Relations Team,\n\nI am asking you to review my case concerning ${flight} on ${route}. The facts I rely on are the flight number, journey, travel date and final-arrival delay supplied with this request. Based on those confirmed details, ${frameworks || "the applicable passenger-rights framework"} may be relevant.${source ? ` The published guidance I consulted is: ${source}` : ""}\n\n${state.cause ? `I note your reference to ${state.cause}. ` : ""}${nextRequest} Please also explain the basis for any conclusion that compensation is not payable.${amount}\n\nPlease confirm any applicable assistance, rerouting, refund, or reasonable-expense reimbursement options. I would appreciate a response within 14 days; this is a requested reply timeframe, not a legal deadline.\n\nKind regards`,
  };
}
