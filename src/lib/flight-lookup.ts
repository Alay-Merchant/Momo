export type FlightLookupResult = { flightNumber: string; airline: string | null; status: string | null; scheduledDeparture: string | null; actualDeparture: string | null; scheduledArrival: string | null; actualArrival: string | null; arrivalDelayMinutes: number | null };

export function cleanFlightNumber(value: unknown) {
  if (typeof value !== "string") return null;
  const flightNumber = value.toUpperCase().replace(/\s+/g, "");
  return /^[A-Z0-9]{2,8}$/.test(flightNumber) ? flightNumber : null;
}

export function cleanFlightDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Number.isNaN(Date.parse(`${value}T12:00:00Z`)) ? null : value;
}

export function arrivalDelay(scheduled: unknown, actual: unknown) {
  if (typeof scheduled !== "string" || typeof actual !== "string") return null;
  const scheduledMs = Date.parse(scheduled); const actualMs = Date.parse(actual);
  if (!Number.isFinite(scheduledMs) || !Number.isFinite(actualMs)) return null;
  const minutes = Math.round((actualMs - scheduledMs) / 60_000);
  return minutes >= 0 && minutes <= 10_080 ? minutes : null;
}
