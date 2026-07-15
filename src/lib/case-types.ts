export type CaseState =
  | "READY_TO_SEND"
  | "LIKELY_WORTH_PURSUING"
  | "NEEDS_DETAIL"
  | "DIFFERENT_ROUTE"
  | "OUT_OF_SCOPE";

export type ProvenanceType =
  | "DOCUMENT_EXTRACTED"
  | "USER_CONFIRMED"
  | "USER_STATED_UNCONFIRMED"
  | "OFFICIAL_SOURCE"
  | "UNKNOWN";

export type FlightDisruption =
  | "delay"
  | "cancellation"
  | "denied_boarding"
  | "missed_connection";

export interface CaseFact {
  id: string;
  field: string;
  label: string;
  value: string | number | null;
  provenance: ProvenanceType;
  sourceLabel: string;
  confirmed: boolean;
}

export interface RuleCard {
  id: string;
  framework: "UK261" | "EU261";
  plainLanguage: string;
  officialSource: {
    title: string;
    url: string;
    reviewedAt: string;
  };
  version?: string;
  status?: "in_force" | "under_review" | "superseded";
  reviewDueAt?: string;
}

export interface FlightCase {
  id: string;
  title: string;
  disruptionType: FlightDisruption;
  facts: CaseFact[];
  airlineReply: string;
}

export interface Assessment {
  caseState: CaseState;
  frameworkCandidates: ("UK261" | "EU261")[];
  possibleRoutes: string[];
  materialUnknowns: string[];
  exceptionStatus: "UNRESOLVED" | "NOT_RAISED" | "INSUFFICIENT_EVIDENCE";
  ruleIds: string[];
  allowedClaims: string[];
  prohibitedClaims: string[];
  sourceCardIds?: string[];
}
