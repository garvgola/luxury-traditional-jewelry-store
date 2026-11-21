"use client";

import Link from "next/link";
import { useEffect,useState } from "react";

type Address={id:string;recipient_name:string;address_line_1:string;city:string;state:string;postal_code:string;is_default:boolean};
type Quote={subtotalPaise:number;shippingFeePaise:number;estimatedDaysMin:number;estimatedDaysMax:number;destination:string;paymentEnabled:false;taxConfigured:false};
const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);

export function CheckoutQuote(){
  const [addresses,setAddresses]=useState<Address[]>([]);const [addressId,setAddressId]=useState("");
  const [quote,setQuote]=useState<Quote|null>(null);const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");const [loading,setLoading]=useState(true);
  useEffect(()=>{
    async function load(){
      try{
        const response=await fetch("/api/addresses");const result=await response.json();
        if(!response.ok)throw new Error(result.error);const rows:Address[]=result.addresses||[];
        setAddresses(rows);setAddressId(rows.find(item=>item.is_default)?.id||rows[0]?.id||"");
      }catch(cause){setError(cause instanceof Error?cause.message:"Could not load delivery addresses.");}
      finally{setLoading(false);}
    }
    void load();
  },[]);
  async function calculate(){
    if(!addressId)return;setBusy(true);setError("");setQuote(null);
    try{
      const response=await fetch("/api/checkout/quote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({addressId})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);setQuote(result as Quote);
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not calculate shipping.");}
    finally{setBusy(false);}
  }
  return <div className="checkout-quote">
    <div className="checkout-address"><h2>Delivery address</h2>
      {loading?<p>Loading saved addresses…</p>:!addresses.length?<div><p>You need to save a delivery address before checkout.</p><Link href="/account/addresses" className="text-link">Add an address</Link></div>:
      <><select value={addressId} onChange={event=>{setAddressId(event.target.value);setQuote(null);}}>{addresses.map(address=><option value={address.id} key={address.id}>{address.recipient_name} — {address.address_line_1}, {address.city} {address.postal_code}</option>)}</select><Link href="/account/addresses" className="text-link">Manage addresses</Link><button className="button button-primary" disabled={busy||!addressId} onClick={()=>void calculate()}>{busy?"Calculating…":"Calculate delivery estimate"}</button></>}
    </div>
    {error&&<p className="form-error" role="alert">{error}</p>}
    {quote&&<div className="checkout-summary"><h2>Shipping estimate</h2><div><span>Bag subtotal</span><strong>{money(quote.subtotalPaise)}</strong></div><div><span>Shipping</span><strong>{money(quote.shippingFeePaise)}</strong></div><div><span>Destination</span><strong>{quote.destination}</strong></div><div><span>Estimated delivery</span><strong>{quote.estimatedDaysMin}–{quote.estimatedDaysMax} days</strong></div><p>These are indicative delivery days, not a guaranteed delivery date.</p></div>}
    <div className="checkout-blocked"><strong>Payment is not enabled yet</strong><p>Tax/GST and invoice treatment must be confirmed by the store owner/accountant, and Razorpay test credentials must be configured. This estimate is not a final payable total. No order or payment will be created from this page.</p></div>
  </div>;
}
