"use client";
import { FormEvent,useState } from "react";
type Availability="available_to_order"|"made_to_order"|"temporarily_unavailable";
export function AdminAddVariant({productId,onCreated}:{productId:string;onCreated:()=>void}){
  const [open,setOpen]=useState(false);const [label,setLabel]=useState("");const [sku,setSku]=useState("");const [price,setPrice]=useState("");
  const [hsn,setHsn]=useState("");const [gst,setGst]=useState("");const [inclusive,setInclusive]=useState<boolean|null>(null);
  const [availability,setAvailability]=useState<Availability>("available_to_order");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");
    const amount=Number(price);
    if(!Number.isFinite(amount)||amount<=0||inclusive===null||!gst||!hsn){setError("Complete the price and accountant-confirmed tax fields.");setBusy(false);return;}
    try{
      const response=await fetch("/api/admin/products/variants",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        productId,variantLabel:label,sku,pricePaise:Math.round(amount*100),availability,hsnCode:hsn,
        gstRateBps:Math.round(Number(gst)*100),priceIncludesTax:inclusive,
      })});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      onCreated();
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not add variant.");}
    finally{setBusy(false);}
  }
  return <div className="admin-add-variant">
    <button type="button" className="admin-add-variant-toggle" onClick={()=>setOpen(value=>!value)}>{open?"Close variant form":"+ Add variant"}</button>
    {open&&<form onSubmit={create}>
      <label>Variant name<input required value={label} onChange={event=>setLabel(event.target.value)} placeholder="e.g. 18 inch / Medium"/></label>
      <div className="admin-form-row"><label>Price (₹)<input required type="number" min="0.01" step="0.01" value={price} onChange={event=>setPrice(event.target.value)}/></label><label>SKU<input value={sku} onChange={event=>setSku(event.target.value)}/></label></div>
      <div className="admin-form-row"><label>HSN<input required inputMode="numeric" pattern="[0-9]{4,8}" value={hsn} onChange={event=>setHsn(event.target.value)}/></label><label>GST %<input required type="number" min="0" max="28" step="0.01" value={gst} onChange={event=>setGst(event.target.value)}/></label></div>
      <label>Price tax treatment<select required value={inclusive===null?"":inclusive?"inclusive":"exclusive"} onChange={event=>setInclusive(event.target.value===""?null:event.target.value==="inclusive")}><option value="" disabled>Choose confirmed treatment</option><option value="inclusive">GST included</option><option value="exclusive">GST added</option></select></label>
      <label>Availability<select value={availability} onChange={event=>setAvailability(event.target.value as Availability)}><option value="available_to_order">Available to order</option><option value="made_to_order">Made to order</option><option value="temporarily_unavailable">Temporarily unavailable</option></select></label>
      {error&&<p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary" disabled={busy}>{busy?"Saving…":"Create variant"}</button>
    </form>}
  </div>;
}
