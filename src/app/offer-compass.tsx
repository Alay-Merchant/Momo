"use client";

import { useState } from "react";

export default function OfferCompass({
  amount,
  currency,
}: {
  amount: number | null;
  currency: "GBP" | "EUR" | null;
}) {
  const [offer, setOffer] = useState("");
  const [kind, setKind] = useState("cash");
  const numericOffer = Number(offer);
  const canCompare = Boolean(amount && currency && Number.isFinite(numericOffer) && numericOffer >= 0);
  const symbol = currency === "GBP" ? "\u00a3" : "\u20ac";

  return (
    <section className="offer-compass" aria-label="Compare an airline offer">
      <p className="receipt-eyebrow">OFFER COMPASS</p>
      <h2>Got an airline offer?</h2>
      <p>Enter what it covers before accepting. Momo compares numbers; you decide what is fair for your situation.</p>
      <div>
        <label>
          Offer type
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="cash">Cash</option>
            <option value="voucher">Voucher or credit</option>
            <option value="refund">Refund</option>
            <option value="expenses">Expense repayment</option>
          </select>
        </label>
        <label>
          Offer amount
          <input inputMode="decimal" min="0" onChange={(event) => setOffer(event.target.value)} placeholder="0" type="number" value={offer} />
        </label>
      </div>
      {canCompare ? <p className="offer-result">This {kind} offer is {symbol}{numericOffer.toFixed(2)}. Momo&apos;s current possible fixed-compensation estimate is {symbol}{amount} per person, subject to the stated conditions. They may cover different things, so check the airline&apos;s wording before deciding.</p> : <small>Add an offer amount after Momo can safely show a possible fixed-compensation estimate.</small>}
    </section>
  );
}
