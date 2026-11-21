"use client";

import { useState } from "react";

export function AddToCartButton({ variantId, disabled = false }: { variantId: string; disabled?: boolean }) {
  const [busy,setBusy] = useState(false); const [message,setMessage] = useState("");
  async function add() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/cart", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({variantId,quantity:1}) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not add this piece to your bag.");
      setMessage("Added to your bag.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally { setBusy(false); }
  }
  return <div className="add-to-cart-wrap"><button className="button button-primary" disabled={disabled || busy} onClick={add}>{busy ? "Adding…" : "Add to bag"}</button>{message && <span role="status" className="cart-feedback">{message}</span>}</div>;
}
