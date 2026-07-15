import type { Region } from "@/lib/regulations/library";

const airportRegions: Record<string, Region> = {
  LHR: "UK", LGW: "UK", MAN: "UK", EDI: "UK", GLA: "UK", BHX: "UK", BRS: "UK", DUB: "EU_EEA_CH",
  CDG: "EU_EEA_CH", FCO: "EU_EEA_CH", AMS: "EU_EEA_CH", FRA: "EU_EEA_CH", MAD: "EU_EEA_CH", ZRH: "EU_EEA_CH", OSL: "EU_EEA_CH",
};

export function normalizeAirportScope(value: unknown): { code: string | null; region: Region } {
  const code = String(value ?? "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return { code: null, region: "UNKNOWN" };
  return { code, region: airportRegions[code] ?? "UNKNOWN" };
}

export function scopeFromAirportOrRegion(airport: unknown, region: Region): Region {
  const normalized = normalizeAirportScope(airport).region;
  return normalized === "UNKNOWN" ? region : normalized;
}
