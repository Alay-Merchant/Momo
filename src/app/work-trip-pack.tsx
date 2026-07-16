"use client";

import { useState } from "react";

export default function WorkTripPack() {
  const [isWorkTrip, setIsWorkTrip] = useState(false);
  if (!isWorkTrip) {
    return (
      <label className="work-trip-toggle">
        <input
          checked={isWorkTrip}
          onChange={(event) => setIsWorkTrip(event.target.checked)}
          type="checkbox"
        />
        This was a work trip
      </label>
    );
  }
  return (
    <section className="work-trip-pack">
      <p className="receipt-eyebrow">WORK-TRIP PACK</p>
      <h2>Keep your work-travel evidence together.</h2>
      <p>
        This does not change your passenger-rights assessment. It helps you
        keep the records an employer, insurer, or travel team may ask for.
      </p>
      <ul>
        <li>Keep the original booking, boarding pass, and replacement itinerary.</li>
        <li>Record itemised meals, hotel, ground transport, and communication costs.</li>
        <li>Save the airline&apos;s message and any employer or insurer reference.</li>
        <li>Use Momo&apos;s claim story to return when an airline response arrives.</li>
      </ul>
      <button className="text-button" onClick={() => setIsWorkTrip(false)}>
        This was not a work trip
      </button>
    </section>
  );
}
