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
  const [offerCurrency, setOfferCurrency] = useState("GBP");
  const [customCurrency, setCustomCurrency] = useState("");
  const numericOffer = Number(offer);
  const selectedCurrency = offerCurrency === "OTHER" ? customCurrency.trim().toUpperCase() : offerCurrency;
  const validCurrency = /^[A-Z]{3}$/.test(selectedCurrency);
  const canCompare = Boolean(amount && currency && validCurrency && Number.isFinite(numericOffer) && numericOffer >= 0);
  const symbol = (value: string) => ({ GBP: "\u00a3", EUR: "\u20ac", USD: "$", CAD: "C$", SGD: "S$" })[value] ?? `${value} `;

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
        <label>
          Currency
          <select value={offerCurrency} onChange={(event) => setOfferCurrency(event.target.value)}>
            <option value="GBP">GBP (£)</option>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="CAD">CAD (C$)</option>
            <option value="SGD">SGD (S$)</option>
            <option value="OTHER">Other currency</option>
          </select>
        </label>
        {offerCurrency === "OTHER" && <label>
          Currency code
          <input value={customCurrency} onChange={(event) => setCustomCurrency(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3))} placeholder="e.g. PEN" maxLength={3} />
        </label>}
      </div>
      {canCompare ? <p className="offer-result">This {kind} offer is {symbol(selectedCurrency)}{numericOffer.toFixed(2)} ({selectedCurrency}). Momo&apos;s current possible fixed-compensation estimate is {symbol(currency ?? "GBP")}{amount} per person ({currency}), subject to the stated conditions. {selectedCurrency !== currency ? "They use different currencies, so Momo will not compare their values directly. " : ""}They may cover different things, so check the airline&apos;s wording before deciding.</p> : <small>{offerCurrency === "OTHER" && customCurrency ? "Use a three-letter currency code, such as PEN or AUD. " : ""}Offer currency defaults to GBP. Add an amount after Momo can safely show a possible fixed-compensation estimate.</small>}
    </section>
  );
}
