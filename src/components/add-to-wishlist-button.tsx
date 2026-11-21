"use client";

import { useState } from "react";

export function AddToWishlistButton({productId}:{productId:string}) {
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  async function save() {
    setBusy(true); setMessage("");
    try {
      const response=await fetch("/api/wishlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId})});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"Could not save this piece.");
      setMessage("Saved to your wishlist.");
    } catch(error) { setMessage(error instanceof Error?error.message:"Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="wishlist-action-wrap"><button type="button" className="button button-secondary" onClick={save} disabled={busy}>{busy?"Saving…":"♡ Save to wishlist"}</button>{message&&<span role="status">{message}</span>}</div>;
}
