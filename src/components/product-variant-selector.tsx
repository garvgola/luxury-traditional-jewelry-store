"use client";
import { useMemo,useState } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
type Availability="available_to_order"|"made_to_order"|"temporarily_unavailable";
type Variant={
  id:string;variant_label:string;price_paise:number;is_active:boolean;price_includes_tax:boolean|null;
  product_availability:{availability:Availability;estimated_lead_days_min:number|null;estimated_lead_days_max:number|null;customer_note:string|null}[]|
  {availability:Availability;estimated_lead_days_min:number|null;estimated_lead_days_max:number|null;customer_note:string|null}|null;
};
const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);
export function ProductVariantSelector({variants:allVariants}:{variants:Variant[]}){
  const variants=useMemo(()=>allVariants.filter(item=>item.is_active),[allVariants]);
  const [selectedId,setSelectedId]=useState(variants[0]?.id||"");
  const selected=variants.find(item=>item.id===selectedId)||variants[0];
  if(!selected)return <p className="simple-page-note">This piece is not available to order at the moment.</p>;
  const availabilityRows=selected.product_availability;
  const availability=Array.isArray(availabilityRows)?availabilityRows[0]:availabilityRows;
  const unavailable=availability?.availability==="temporarily_unavailable";
  return <div className="product-variant-selector">
    {variants.length>1&&<label>Choose your option<select value={selected.id} onChange={event=>setSelectedId(event.target.value)}>{variants.map(item=><option value={item.id} key={item.id}>{item.variant_label}</option>)}</select></label>}
    {variants.length===1&&<p className="product-variant-label">{selected.variant_label}</p>}
    <p className="product-price">{money(selected.price_paise)}</p>
    <p className="product-tax-note">{selected.price_includes_tax===true?"Inclusive of GST":selected.price_includes_tax===false?"GST calculated at checkout":"Tax details being confirmed"}</p>
    <p className="availability-note">{unavailable?"Temporarily unavailable":availability?.availability==="made_to_order"?"Made to order":"Available to order"}</p>
    {availability?.customer_note&&<p>{availability.customer_note}</p>}
    {availability?.estimated_lead_days_min!=null&&<p className="delivery-note">Estimated preparation: {availability.estimated_lead_days_min}{availability.estimated_lead_days_max?"–"+availability.estimated_lead_days_max:""} days. Delivery estimates are indicative.</p>}
    <AddToCartButton variantId={selected.id} disabled={unavailable}/>
  </div>;
}
