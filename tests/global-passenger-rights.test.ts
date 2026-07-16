import assert from "node:assert/strict";
import test from "node:test";
import { globalPassengerGuidance } from "@/lib/global-passenger-rights";

function canada(options: Record<string, unknown> = {}) {
  return globalPassengerGuidance({ departureAirport: "YYZ", arrivalAirport: "LHR", disruptionType: "delay", delayMinutes: 240, airlineReason: "technical issue", ...options }).find((item) => item.jurisdiction === "Canada APPR");
}

test("Canada: 3-hour controlled delay shows CAD large/small bands", () => {
  const item = canada({ delayMinutes: 180 });
  assert.equal(item?.currency, "CAD");
  assert.equal(item?.amounts?.[0].largeCarrier, 400);
  assert.equal(item?.amounts?.[0].smallCarrier, 125);
});
test("Canada: 6-hour controlled delay retains CAD 700/250 band", () => assert.equal(canada({ delayMinutes: 360 })?.amounts?.[1].largeCarrier, 700));
test("Canada: 9-hour controlled delay retains CAD 1000/500 band", () => assert.equal(canada({ delayMinutes: 540 })?.amounts?.[2].smallCarrier, 500));
test("Canada: under-three-hour delay shows no fixed bands", () => assert.equal(canada({ delayMinutes: 179 })?.amounts, undefined));
test("Canada: weather assertion suppresses fixed bands", () => assert.equal(canada({ airlineReason: "weather" })?.amounts, undefined));
test("Canada: air traffic assertion suppresses fixed bands", () => assert.equal(canada({ airlineReason: "air traffic control" })?.amounts, undefined));
test("Canada: cancellation without notice fact shows no bands", () => assert.equal(canada({ disruptionType: "cancellation", cancellationNoticeDays: null })?.amounts, undefined));
test("Canada: cancellation over 14 days notice shows no bands", () => assert.equal(canada({ disruptionType: "cancellation", cancellationNoticeDays: 15 })?.amounts, undefined));
test("Canada: cancellation within 14 days can show bands", () => assert.equal(canada({ disruptionType: "cancellation", cancellationNoticeDays: 7 })?.amounts?.[0].largeCarrier, 400));
test("Canada: denied boarding without readiness facts shows no bands", () => assert.equal(canada({ disruptionType: "denied_boarding" })?.amounts, undefined));
test("Canada: involuntary denied boarding shows the C$900 schedule", () => assert.equal(canada({ disruptionType: "denied_boarding", boardingReady: "Yes", volunteered: "No", documentsValid: "Yes" })?.amounts?.[0].fixedAmount, 900));
test("Canada: denied boarding uses C$1800 at 6+ hours", () => assert.equal(canada({ disruptionType: "denied_boarding", boardingReady: "Yes", volunteered: "No", documentsValid: "Yes" })?.amounts?.[1].fixedAmount, 1800));
test("Canada: denied boarding has no carrier-size split", () => assert.equal(canada({ disruptionType: "denied_boarding", boardingReady: "Yes", volunteered: "No", documentsValid: "Yes" })?.amounts?.[2].largeCarrier, undefined));
test("US: international four-hour delay is below the six-hour significant threshold", () => assert.match(globalPassengerGuidance({ departureAirport: "LHR", arrivalAirport: "JFK", disruptionType: "delay", delayMinutes: 240 }).find((item) => item.jurisdiction === "United States DOT")?.headline ?? "", /cannot yet/i));
test("US: international six-hour delay reaches the refund-review threshold", () => assert.match(globalPassengerGuidance({ departureAirport: "LHR", arrivalAirport: "JFK", disruptionType: "delay", delayMinutes: 360 }).find((item) => item.jurisdiction === "United States DOT")?.headline ?? "", /refund choice/i));
test("US: domestic three-hour delay reaches the refund-review threshold", () => assert.match(globalPassengerGuidance({ departureAirport: "JFK", arrivalAirport: "LAX", disruptionType: "delay", delayMinutes: 180 }).find((item) => item.jurisdiction === "United States DOT")?.headline ?? "", /refund choice/i));
test("US: domestic short delay does not reach the threshold", () => assert.match(globalPassengerGuidance({ departureAirport: "JFK", arrivalAirport: "LAX", disruptionType: "delay", delayMinutes: 179 }).find((item) => item.jurisdiction === "United States DOT")?.headline ?? "", /cannot yet/i));
test("US: cancellation uses a refund route without a fixed USD amount", () => { const item = globalPassengerGuidance({ departureAirport: "LAX", arrivalAirport: "SFO", disruptionType: "cancellation", delayMinutes: 0 }).find((entry) => entry.jurisdiction === "United States DOT"); assert.equal(item?.currency, "USD"); assert.equal(item?.amounts, undefined); });
test("US: denied boarding is separated from the refund route", () => assert.match(globalPassengerGuidance({ departureAirport: "MIA", arrivalAirport: "LHR", disruptionType: "denied_boarding", delayMinutes: 300 }).find((item) => item.jurisdiction === "United States DOT")?.headline ?? "", /dedicated review/i));
test("Singapore: never invents an SGD fixed amount", () => { const item = globalPassengerGuidance({ departureAirport: "SIN", arrivalAirport: "LHR", disruptionType: "delay", delayMinutes: 300 }).find((entry) => entry.jurisdiction === "Singapore"); assert.equal(item?.currency, "SGD"); assert.equal(item?.amounts, undefined); });
test("Singapore: cancellation stays non-monetary", () => assert.equal(globalPassengerGuidance({ departureAirport: "LHR", arrivalAirport: "SIN", disruptionType: "cancellation", delayMinutes: 0 }).find((item) => item.jurisdiction === "Singapore")?.amounts, undefined));
test("Uncovered Dubai hub is disclosed rather than silently omitted", () => assert.equal(globalPassengerGuidance({ departureAirport: "LHR", arrivalAirport: "DXB", disruptionType: "delay", delayMinutes: 240 })[0]?.jurisdiction, "Unverified local rule pack"));
test("Uncovered Tokyo hub is disclosed rather than silently omitted", () => assert.equal(globalPassengerGuidance({ departureAirport: "NRT", arrivalAirport: "LHR", disruptionType: "delay", delayMinutes: 240 })[0]?.jurisdiction, "Unverified local rule pack"));
test("Expanded Canadian hub coverage includes Edmonton", () => assert.equal(globalPassengerGuidance({ departureAirport: "YEG", arrivalAirport: "LHR", disruptionType: "delay", delayMinutes: 240 })[0]?.jurisdiction, "Canada APPR"));
test("Expanded US hub coverage includes Houston", () => assert.equal(globalPassengerGuidance({ departureAirport: "IAH", arrivalAirport: "LHR", disruptionType: "delay", delayMinutes: 360 })[0]?.jurisdiction, "United States DOT"));
test("UK/EU overlap warns against duplicate fixed compensation", () => assert.match(canada({ hasUkOrEuFramework: true })?.overlapNote ?? "", /duplicate fixed-compensation/i));
