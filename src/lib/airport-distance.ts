type AirportLocation = {
  latitude: number;
  longitude: number;
};

// A deliberately small, reviewed airport list. Momo only estimates distance when
// both airport codes are known; it never guesses a route from free-form city text.
const AIRPORTS: Record<string, AirportLocation> = {
  LHR: { latitude: 51.47, longitude: -0.4543 },
  LGW: { latitude: 51.1537, longitude: -0.1821 },
  MAN: { latitude: 53.365, longitude: -2.2728 },
  EDI: { latitude: 55.95, longitude: -3.3725 },
  DUB: { latitude: 53.4213, longitude: -6.2701 },
  CDG: { latitude: 49.0097, longitude: 2.5479 },
  AMS: { latitude: 52.3105, longitude: 4.7683 },
  FCO: { latitude: 41.8003, longitude: 12.2389 },
  MAD: { latitude: 40.4983, longitude: -3.5676 },
  ATH: { latitude: 37.9364, longitude: 23.9445 },
  JFK: { latitude: 40.6413, longitude: -73.7781 },
  DXB: { latitude: 25.2532, longitude: 55.3657 },
  SIN: { latitude: 1.3644, longitude: 103.9915 },
  HND: { latitude: 35.5494, longitude: 139.7798 },
};

function airportCode(value: unknown) {
  const matches = String(value ?? "").trim().toUpperCase().match(/\b[A-Z]{3}\b/g);
  return matches?.find((code) => Boolean(AIRPORTS[code])) ?? null;
}

/** Great-circle distance in km, only when both supplied values contain known IATA codes. */
export function airportDistanceKm(departure: unknown, arrival: unknown) {
  const from = airportCode(departure);
  const to = airportCode(arrival);
  if (!from || !to || from === to || !AIRPORTS[from] || !AIRPORTS[to]) return null;

  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const start = AIRPORTS[from];
  const end = AIRPORTS[to];
  const latitudeDelta = radians(end.latitude - start.latitude);
  const longitudeDelta = radians(end.longitude - start.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(start.latitude)) *
      Math.cos(radians(end.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
