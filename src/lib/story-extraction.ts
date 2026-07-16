export type StoryFact = { field: string; value: string | number };

export function extractStoryFacts(story: string): StoryFact[] {
  const found: StoryFact[] = [];
  const flight = story.match(/\b([A-Z]{2,3}\s?\d{1,4})\b/i)?.[1]?.replace(/\s/g, "").toUpperCase();
  if (flight) found.push({ field: "flight_number", value: flight });
  const delay = story.match(/\b(\d{1,2})\s*(?:hours?|hrs?)\b/i);
  if (delay) found.push({ field: "final_arrival_delay_minutes", value: Number(delay[1]) * 60 });
  if (/\b(one|single|same) booking\b/i.test(story)) found.push({ field: "one_booking", value: "Yes" });
  if (/\b(separate tickets?|self[- ]transfer)\b/i.test(story)) found.push({ field: "one_booking", value: "No" });
  const connection = story.match(/\bvia\s+([A-Z][A-Za-z '-]{2,40})(?=[.,;]|$)/i)?.[1]?.trim();
  if (connection) found.push({ field: "connection_airports", value: connection });
  const stranded = story.match(/\b(?:stranded|diverted|landed)\s+(?:in|at|near)\s+([A-Z][A-Za-z '-]{2,50})(?=[.,;]|$)/i)?.[1]?.trim();
  if (stranded) found.push({ field: "disruption_location", value: stranded });
  return found;
}
