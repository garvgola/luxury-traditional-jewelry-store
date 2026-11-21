"use client";
import { useState } from "react";
type Props={variantId:string;pricePaise:number;sku:string|null;variantLabel:string};
export function AdminVariantPriceEditor({variantId,pricePaise,sku,variantLabel}:Props){
  const [value,setValue]=useState((pricePaise/100).toFixed(2));const [code,setCode]=useState(sku||"");const [label,setLabel]=useState(variantLabel);
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  async function save(){
    const amount=Number(value);if(!Number.isFinite(amount)||amount<=0){setMessage("Enter a valid price.");return;}
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/admin/products",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({variantId,pricePaise:Math.round(amount*100),sku:code,variantLabel:label})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);setMessage("Variant details saved.");
    }catch(cause){setMessage(cause instanceof Error?cause.message:"Could not save variant.");}
    finally{setBusy(false);}
  }
  return <div className="admin-variant-price-editor">
    <label>Variant name<input value={label} maxLength={100} onChange={event=>setLabel(event.target.value)}/></label>
    <label>SKU<input value={code} maxLength={80} onChange={event=>setCode(event.target.value)}/></label>
    <label>Price (₹)<input type="number" min="0.01" step="0.01" value={value} onChange={event=>setValue(event.target.value)}/></label>
    <button type="button" disabled={busy} onClick={()=>void save()}>{busy?"Saving…":"Save variant"}</button>
    {message&&<small role="status">{message}</small>}
  </div>;
}
