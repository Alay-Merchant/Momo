import type { MomoReply } from "@/lib/momo-reply";
import type { createDecisionReceipt } from "@/lib/case-receipt";

type Receipt = ReturnType<typeof createDecisionReceipt>;
const prohibited = /\b(we (are|represent) (a |your )?lawyer|our legal team|commence proceedings|take you to court|guarantee(?:d)?|definitely (owe|entitled)|punitive damages|report you to the regulator)\b/i;

export function replyIsGrounded(reply: MomoReply, receipt: Receipt) {
  const text = `${reply.explanation}\n${reply.draft}`;
  if (prohibited.test(text)) return false;
  const amounts = [...text.matchAll(/[£€]\s?([\d,]+)/g)].map((match) => Number(match[1].replace(/,/g, ""))).filter(Number.isFinite);
  if (amounts.some((amount) => amount !== receipt.compensation.amount)) return false;
  const urls = [...text.matchAll(/https?:\/\/[^\s)]+/g)].map((match) => match[0]);
  return urls.every((url) => receipt.cards.some((card) => card.source === url));
}

export function safeTemplate(receipt: Receipt): MomoReply {
  const flight = String(receipt.facts.find((fact) => fact.field === "flight_number")?.value ?? "my flight");
  const date = String(receipt.facts.find((fact) => fact.field === "flight_date")?.value ?? "the travel date");
  const route = String(receipt.facts.find((fact) => fact.field === "route")?.value ?? "my journey");
  const frameworks = receipt.assessment.frameworkCandidates.join(" and ");
  const source = receipt.cards[0]?.source;
  const amount = receipt.compensation.amount && receipt.compensation.currency ? ` Please also confirm whether ${receipt.compensation.currency === "GBP" ? "£" : "€"}${receipt.compensation.amount} per passenger is payable if the applicable conditions are met.` : "";
  const unknowns = receipt.assessment.materialUnknowns.length ? ` Momo still needs: ${receipt.assessment.materialUnknowns.join(", ")}.` : "";
  return {
    explanation: `The airline's reply is an assertion, not proof by itself. Momo has kept this response limited to your confirmed facts and the ${frameworks || "currently unconfirmed"} route.${unknowns}`,
    questions: ["What specific event caused the disruption?", "How did that event affect this flight?", "What reasonable measures were considered or taken?"],
    draft: `Subject: Request for a reasoned review — ${flight} on ${date}\n\nDear Customer Relations Team,\n\nI am asking you to review my case concerning ${flight} on ${route}. The facts I rely on are the flight number, journey, travel date and final-arrival delay supplied with this request. Based on those confirmed details, ${frameworks || "the applicable passenger-rights framework"} may be relevant.${source ? ` The published guidance I consulted is: ${source}` : ""}\n\nPlease identify the specific circumstances relied on for your decision, explain the causal link to this journey, and confirm what reasonable measures were considered or taken. Please also explain the basis for any conclusion that compensation is not payable.${amount}\n\nPlease confirm any applicable assistance, rerouting, refund, or reasonable-expense reimbursement options. I would appreciate a reasoned response within 14 days.\n\nKind regards`,
  };
}
