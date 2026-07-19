export type AiStoryField =
  | "flight_number"
  | "flight_date"
  | "route"
  | "final_arrival_delay_minutes"
  | "one_booking"
  | "connection_airports"
  | "disruption_location"
  | "airline_reason"
  | "operating_carrier_name"
  | "disrupted_leg";

export type AiStoryFact = { field: AiStoryField; value: string | number };

const fields = new Set<AiStoryField>([
  "flight_number", "flight_date", "route", "final_arrival_delay_minutes",
  "one_booking", "connection_airports", "disruption_location", "airline_reason",
  "operating_carrier_name", "disrupted_leg",
]);

function validFact(value: unknown): value is AiStoryFact {
  if (!value || typeof value !== "object") return false;
  const fact = value as { field?: unknown; value?: unknown };
  if (typeof fact.field !== "string" || !fields.has(fact.field as AiStoryField)) return false;
  if (typeof fact.value === "string") return fact.value.trim().length > 0 && fact.value.length <= 180;
  return fact.field === "final_arrival_delay_minutes" && typeof fact.value === "number" && Number.isInteger(fact.value) && fact.value >= 0 && fact.value <= 10_080;
}

export function parseAiStoryFacts(value: string): AiStoryFact[] | null {
  try {
    const parsed = JSON.parse(value) as { facts?: unknown };
    if (!Array.isArray(parsed.facts)) return null;
    const unique = new Map<AiStoryField, AiStoryFact>();
    for (const item of parsed.facts) if (validFact(item) && !unique.has(item.field)) unique.set(item.field, item);
    const facts = [...unique.values()].slice(0, 10);
    return facts.length ? facts : null;
  } catch {
    return null;
  }
}
