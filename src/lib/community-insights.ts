export const disruptionTypes = ["delay", "cancellation", "missed_connection", "denied_boarding"] as const;
export const reasonCategories = ["operational", "technical", "crew", "weather", "air_traffic_control", "security", "other", "unspecified"] as const;
export const resolutionTypes = ["cash_payment", "voucher", "refund", "rerouting", "expenses", "no_offer", "other"] as const;

export type DisruptionType = (typeof disruptionTypes)[number];
export type ReasonCategory = (typeof reasonCategories)[number];
export type ResolutionType = (typeof resolutionTypes)[number];

export function cleanAirline(value: unknown) {
  if (typeof value !== "string") return null;
  const airline = value.trim().replace(/\s+/g, " ");
  return airline.length >= 2 && airline.length <= 80 && /^[\p{L}\p{N} .&'-]+$/u.test(airline) ? airline : null;
}

export function delayBand(value: unknown) {
  if (value === null || value === "" || value === undefined) return "unknown";
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > 10_080) return "unknown";
  if (minutes < 180) return "under_3h";
  if (minutes < 240) return "3_to_4h";
  return "4h_plus";
}

export function validChoice<T extends readonly string[]>(value: unknown, choices: T): value is T[number] {
  return typeof value === "string" && (choices as readonly string[]).includes(value);
}

export function money(value: unknown) {
  if (value === null || value === "" || value === undefined) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 && amount <= 50_000 ? Math.round(amount * 100) / 100 : null;
}

export function needsResearch(sampleCount: number, hasFreshOfficialSource: boolean) {
  return sampleCount < 10 && !hasFreshOfficialSource;
}
