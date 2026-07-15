export type FlightLookupResult = { flightNumber: string; airline: string | null; status: string | null; scheduledDeparture: string | null; actualDeparture: string | null; scheduledArrival: string | null; actualArrival: string | null; arrivalDelayMinutes: number | null };

type AeroDataBoxTime = { local?: string; utc?: string };
type AeroDataBoxAirport = { scheduledTime?: AeroDataBoxTime; revisedTime?: AeroDataBoxTime; actualTime?: AeroDataBoxTime };
export type AeroDataBoxFlight = { number?: string; status?: string; airline?: { name?: string }; departure?: AeroDataBoxAirport; arrival?: AeroDataBoxAirport };

function providerTime(time?: AeroDataBoxTime) {
  return time?.utc ?? time?.local ?? null;
}

export function toFlightLookupResult(flight: AeroDataBoxFlight, fallbackFlightNumber: string): FlightLookupResult {
  const scheduledDeparture = providerTime(flight.departure?.scheduledTime);
  const actualDeparture = providerTime(flight.departure?.actualTime) ?? providerTime(flight.departure?.revisedTime);
  const scheduledArrival = providerTime(flight.arrival?.scheduledTime);
  const actualArrival = providerTime(flight.arrival?.actualTime) ?? providerTime(flight.arrival?.revisedTime);
  return {
    flightNumber: flight.number ?? fallbackFlightNumber,
    airline: flight.airline?.name ?? null,
    status: flight.status ?? null,
    scheduledDeparture,
    actualDeparture,
    scheduledArrival,
    actualArrival,
    arrivalDelayMinutes: arrivalDelay(scheduledArrival, actualArrival),
  };
}

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
