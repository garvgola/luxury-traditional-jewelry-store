"use client";

import { FormEvent,useState } from "react";

type Rate={id:string;fee_paise:number;min_order_subtotal_paise:number;is_active:boolean};
type Zone={id:string;name:string;country_code:string;postal_code_prefixes:string[];is_active:boolean;estimated_days_min:number;estimated_days_max:number;shipping_rates:Rate[]};
const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);

export function AdminShippingManager({initial}:{initial:Zone[]}){
  const [zones,setZones]=useState(initial);const [name,setName]=useState("");const [prefixes,setPrefixes]=useState("");
  const [daysMin,setDaysMin]=useState("5");const [daysMax,setDaysMax]=useState("10");
  const [fee,setFee]=useState("");const [freeThreshold,setFreeThreshold]=useState("0");
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("");

  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");setMessage("");
    const feeNumber=Number(fee),thresholdNumber=Number(freeThreshold);
    if(!Number.isFinite(feeNumber)||feeNumber<0||!Number.isFinite(thresholdNumber)||thresholdNumber<0){setError("Enter valid shipping amounts.");setBusy(false);return;}
    try{
      const response=await fetch("/api/admin/shipping",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        name,countryCode:"IN",postalPrefixes:prefixes.split(",").map(value=>value.trim()).filter(Boolean),
        estimatedDaysMin:Number(daysMin),estimatedDaysMax:Number(daysMax),
        feePaise:Math.round(feeNumber*100),minOrderSubtotalPaise:Math.round(thresholdNumber*100),
      })});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setMessage("Shipping zone created.");window.location.reload();
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not create shipping zone.");}
    finally{setBusy(false);}
  }
  async function update(payload:Record<string,string|boolean|number>){
    const response=await fetch("/api/admin/shipping",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const result=await response.json();if(!response.ok){setError(result.error);return false;}return true;
  }
  async function toggleZone(zone:Zone){
    if(await update({zoneId:zone.id,isActive:!zone.is_active}))setZones(current=>current.map(item=>item.id===zone.id?{...item,is_active:!item.is_active}:item));
  }
  async function toggleRate(rate:Rate){
    if(await update({rateId:rate.id,isActive:!rate.is_active}))setZones(current=>current.map(zone=>({...zone,shipping_rates:zone.shipping_rates.map(item=>item.id===rate.id?{...item,is_active:!item.is_active}:item)})));
  }
  async function remove(zoneId:string){
    const response=await fetch("/api/admin/shipping",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({zoneId})});
    const result=await response.json();if(!response.ok){setError(result.error);return;}
    setZones(current=>current.filter(zone=>zone.id!==zoneId));
  }
  return <div className="admin-shipping">
    <form className="admin-product-form" onSubmit={create}>
      <h2>Create shipping zone</h2>
      <label>Zone name<input required value={name} onChange={event=>setName(event.target.value)}/></label>
      <label>PIN code prefixes<input value={prefixes} onChange={event=>setPrefixes(event.target.value)} placeholder="e.g. 110, 122, 201"/><small>Comma-separated. Leave blank only if this rate should cover all PIN codes in India.</small></label>
      <div className="admin-form-row"><label>Min delivery days<input type="number" min="0" max="90" required value={daysMin} onChange={event=>setDaysMin(event.target.value)}/></label><label>Max delivery days<input type="number" min="0" max="120" required value={daysMax} onChange={event=>setDaysMax(event.target.value)}/></label></div>
      <div className="admin-form-row"><label>Shipping fee (₹)<input type="number" min="0" step="0.01" required value={fee} onChange={event=>setFee(event.target.value)}/></label><label>Minimum subtotal (₹)<input type="number" min="0" step="0.01" required value={freeThreshold} onChange={event=>setFreeThreshold(event.target.value)}/></label></div>
      <p className="admin-form-hint">Create separate rates with different minimum subtotals to support threshold pricing. For free shipping, set the fee to ₹0 at the chosen threshold.</p>
      {error&&<p className="form-error" role="alert">{error}</p>}{message&&<p className="form-success" role="status">{message}</p>}
      <button className="button button-primary" disabled={busy}>{busy?"Saving…":"Create zone and rate"}</button>
    </form>
    <div className="admin-product-list"><h2>Configured zones</h2>
      {!zones.length?<p>No shipping zones configured.</p>:zones.map(zone=><article className="admin-zone" key={zone.id}>
        <div className="admin-zone-heading"><div><strong>{zone.name}</strong><small>{zone.country_code} · {zone.postal_code_prefixes.length?zone.postal_code_prefixes.join(", "):"All PIN codes"} · {zone.estimated_days_min}–{zone.estimated_days_max} days</small></div><span className={zone.is_active?"admin-status":"admin-status is-inactive"}>{zone.is_active?"Active":"Inactive"}</span></div>
        {zone.shipping_rates.map(rate=><div className="admin-rate-row" key={rate.id}><span>{money(rate.fee_paise)} from {money(rate.min_order_subtotal_paise)} subtotal</span><button onClick={()=>void toggleRate(rate)}>{rate.is_active?"Disable rate":"Enable rate"}</button></div>)}
        <div className="admin-zone-actions"><button onClick={()=>void toggleZone(zone)}>{zone.is_active?"Disable zone":"Enable zone"}</button><button onClick={()=>void remove(zone.id)}>Delete zone</button></div>
      </article>)}
    </div>
  </div>;
}
