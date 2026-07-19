import type { FlightDisruption } from "@/lib/case-types";

export type HelpTopic = "delay" | "cancellation" | "missed_connection" | "denied_boarding" | "rejection" | "offer" | "expenses" | "international" | "hub" | "lookup";
export type HelpStartScreen = "facts" | "result" | "reply";

export type HelpGuide = {
  topic: HelpTopic;
  disruptionType?: FlightDisruption;
  screen: HelpStartScreen;
  title: string;
  description: string;
  nextAction: string;
};

export const helpGuides: Record<HelpTopic, HelpGuide> = {
  delay: { topic: "delay", disruptionType: "delay", screen: "facts", title: "Let's check your delayed flight", description: "Start with the flight, date, and when you finally arrived. Momo will explain what matters.", nextAction: "Add the details you know" },
  cancellation: { topic: "cancellation", disruptionType: "cancellation", screen: "facts", title: "Let's check your cancelled flight", description: "We will look at notice, rerouting, refund, and any compensation questions in the right order.", nextAction: "Add the cancellation details" },
  missed_connection: { topic: "missed_connection", disruptionType: "missed_connection", screen: "facts", title: "Let's check your missed connection", description: "The booking and final arrival time are the best place to start.", nextAction: "Add your journey details" },
  denied_boarding: { topic: "denied_boarding", disruptionType: "denied_boarding", screen: "facts", title: "Let's record the boarding problem", description: "Momo will ask only what matters about being ready to travel and what the airline offered.", nextAction: "Add what happened" },
  rejection: { topic: "rejection", screen: "reply", title: "Let's unpack the airline's refusal", description: "Paste their reply or let Momo read a screenshot or PDF. We will separate what they said from what still needs explaining.", nextAction: "Add the airline reply" },
  offer: { topic: "offer", screen: "facts", title: "Let's look at the airline's offer", description: "Add the flight essentials first. Then Momo can compare the offer against a careful, clearly labelled estimate in the same currency where possible.", nextAction: "Add flight details" },
  expenses: { topic: "expenses", screen: "facts", title: "Let's organise your expenses", description: "Keep receipts for reasonable food, hotel, transport, and communications costs. Then add the journey details you know.", nextAction: "Start your receipt checklist" },
  international: { topic: "international", screen: "facts", title: "Let's identify the right country guidance", description: "Start with the airports and airline. Momo will show verified UK, EU, Canadian, US, or Singapore guidance where it applies.", nextAction: "Add your airports" },
  hub: { topic: "hub", screen: "facts", title: "Let's check the journey through that hub", description: "Start with the airports and airline. Momo will clearly say when it has verified local guidance and when it needs more checking.", nextAction: "Add the hub and route" },
  lookup: { topic: "lookup", screen: "facts", title: "Let's find the flight times", description: "Enter the flight number and travel date. Momo can then try a public flight-time lookup, or you can type the arrival delay.", nextAction: "Add flight number and date" },
};

export function getHelpGuide(topic: string | null | undefined) {
  return topic && topic in helpGuides ? helpGuides[topic as HelpTopic] : null;
}
