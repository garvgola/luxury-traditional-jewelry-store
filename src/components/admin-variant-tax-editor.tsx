"use client";
import { FormEvent,useState } from "react";
type Props={variantId:string;hsnCode:string|null;gstRateBps:number|null;priceIncludesTax:boolean|null};
export function AdminVariantTaxEditor({variantId,hsnCode,gstRateBps,priceIncludesTax}:Props){
  const [hsn,setHsn]=useState(hsnCode||"");const [rate,setRate]=useState(gstRateBps===null?"":String(gstRateBps/100));
  const [inclusive,setInclusive]=useState(priceIncludesTax??true);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/admin/products",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({variantId,hsnCode:hsn,gstRateBps:Math.round(Number(rate)*100),priceIncludesTax:inclusive})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);setMessage("Tax details saved.");
    }catch(cause){setMessage(cause instanceof Error?cause.message:"Could not save tax details.");}
    finally{setBusy(false);}
  }
  return <form className="admin-tax-editor" onSubmit={save}>
    <label>HSN<input required inputMode="numeric" pattern="[0-9]{4,8}" value={hsn} onChange={event=>setHsn(event.target.value)}/></label>
    <label>GST %<input required type="number" min="0" max="28" step="0.01" value={rate} onChange={event=>setRate(event.target.value)}/></label>
    <label>Price<select value={inclusive?"inclusive":"exclusive"} onChange={event=>setInclusive(event.target.value==="inclusive")}><option value="inclusive">GST included</option><option value="exclusive">GST added</option></select></label>
    <button type="submit" disabled={busy}>{busy?"Saving…":"Save tax"}</button>
    {message&&<small role="status">{message}</small>}
  </form>;
}
