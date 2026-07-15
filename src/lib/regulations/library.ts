import type { FlightDisruption } from "@/lib/case-types";

export type RuleFramework = "UK261" | "EU261";
export type Region = "UK" | "EU_EEA_CH" | "OTHER" | "UNKNOWN";
export type RuleStatus = "in_force" | "under_review" | "superseded";

export type RegulationCard = {
  id: string;
  version: string;
  framework: RuleFramework;
  status: RuleStatus;
  effectiveFrom: string;
  reviewedAt: string;
  reviewDueAt: string;
  disruptionTypes: FlightDisruption[];
  plainLanguage: string;
  formalProposition: string;
  officialSource: { title: string; url: string };
};

export const regulationCards: RegulationCard[] = [
  {
    id: "UK261_SCOPE_01", version: "2026.07", framework: "UK261", status: "in_force", effectiveFrom: "2021-01-01", reviewedAt: "2026-07-15", reviewDueAt: "2026-08-15",
    disruptionTypes: ["delay", "cancellation", "denied_boarding", "missed_connection"],
    plainLanguage: "UK flight-disruption rules can apply to flights leaving the UK and certain flights arriving in the UK. The operating airline and route matter.",
    formalProposition: "Please review whether the UK retained air-passenger-rights rules apply to this journey.",
    officialSource: { title: "UK CAA: flight delays and cancellations", url: "https://www.caa.co.uk/air-passengers/travel-problems-and-rights/flight-delays-and-cancellations/delays/" },
  },
  {
    id: "UK261_DELAY_03", version: "2026.07", framework: "UK261", status: "in_force", effectiveFrom: "2021-01-01", reviewedAt: "2026-07-15", reviewDueAt: "2026-08-15",
    disruptionTypes: ["delay", "missed_connection"],
    plainLanguage: "A final-arrival delay of three hours or more can matter for compensation. The airline's specific cause and whether it was outside normal control can still affect the outcome.",
    formalProposition: "Please explain the specific circumstances relied on and the basis for any conclusion that compensation is not payable.",
    officialSource: { title: "UK CAA: am I entitled to compensation?", url: "https://www.caa.co.uk/air-passengers/travel-problems-and-rights/travel-complaints/making-a-claim/am-i-entitled-to-compensation/" },
  },
  {
    id: "EU261_SCOPE_01", version: "2026.07", framework: "EU261", status: "in_force", effectiveFrom: "2005-02-17", reviewedAt: "2026-07-15", reviewDueAt: "2026-08-15",
    disruptionTypes: ["delay", "cancellation", "denied_boarding", "missed_connection"],
    plainLanguage: "EU passenger-rights rules can apply to flights leaving the EU/EEA/Switzerland, and certain inbound flights operated by an EU airline. The operating airline and route matter.",
    formalProposition: "Please review whether EU air-passenger-rights rules apply to this journey.",
    officialSource: { title: "Your Europe: air passenger rights", url: "https://europa.eu/youreurope/citizens/travel/passenger-rights/air/index_en.htm" },
  },
  {
    id: "EU261_DELAY_03", version: "2026.07", framework: "EU261", status: "in_force", effectiveFrom: "2005-02-17", reviewedAt: "2026-07-15", reviewDueAt: "2026-08-15",
    disruptionTypes: ["delay", "missed_connection"],
    plainLanguage: "A final-arrival delay of three hours or more can matter for compensation. The airline must be able to rely on the relevant circumstances for a refusal.",
    formalProposition: "Please identify the specific circumstances relied on, their effect on this flight, and the basis for your decision.",
    officialSource: { title: "European Commission: air passenger rights", url: "https://transport.ec.europa.eu/transport-themes/passenger-rights/air_en" },
  },
];

export function activeCards(ids: string[]) {
  return regulationCards.filter((card) => ids.includes(card.id) && card.status === "in_force");
}

export function ruleCardProblems(cards: RegulationCard[], today = new Date().toISOString().slice(0, 10)) {
  return cards.flatMap((card) => {
    const problems: string[] = [];
    if (card.status === "in_force" && !/^https:\/\//.test(card.officialSource.url)) problems.push(`${card.id}: active card needs an HTTPS official source`);
    if (card.status === "in_force" && (!/^\d{4}-\d{2}-\d{2}$/.test(card.reviewedAt) || !/^\d{4}-\d{2}-\d{2}$/.test(card.reviewDueAt))) problems.push(`${card.id}: active card needs review dates`);
    if (card.status === "in_force" && card.reviewDueAt < today) problems.push(`${card.id}: review is overdue`);
    if (card.status === "in_force" && card.effectiveFrom > today) problems.push(`${card.id}: card is not yet in force`);
    return problems;
  });
}
