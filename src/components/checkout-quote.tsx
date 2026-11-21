"use client";

import Link from "next/link";
import { useEffect,useState } from "react";

type Address={id:string;recipient_name:string;address_line_1:string;city:string;state:string;postal_code:string;is_default:boolean};
type Quote={subtotalPaise:number;taxPaise:number;taxAddedPaise:number;taxConfigured:boolean;shippingFeePaise:number;totalPaise:number;estimatedDaysMin:number;estimatedDaysMax:number;destination:string};
type CheckoutOrder={orderId:string;orderNumber:string;razorpayOrderId:string;amount:number;currency:"INR";keyId:string;customerName:string;customerEmail:string};
type RazorpaySuccess={razorpay_order_id:string;razorpay_payment_id:string;razorpay_signature:string};
declare global{interface Window{Razorpay?:new(options:Record<string,unknown>)=>{open:()=>void;on:(event:string,callback:(response:{error?:{description?:string}})=>void)=>void};}}

const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(paise/100);
async function loadRazorpay(){
  if(window.Razorpay)return true;
  return new Promise<boolean>(resolve=>{
    const existing=document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]');
    if(existing){existing.addEventListener("load",()=>resolve(Boolean(window.Razorpay)),{once:true});existing.addEventListener("error",()=>resolve(false),{once:true});return;}
    const script=document.createElement("script");script.src="https://checkout.razorpay.com/v1/checkout.js";script.async=true;script.dataset.razorpayCheckout="true";
    script.onload=()=>resolve(Boolean(window.Razorpay));script.onerror=()=>resolve(false);document.body.appendChild(script);
  });
}

export function CheckoutQuote(){
  const [addresses,setAddresses]=useState<Address[]>([]);const [addressId,setAddressId]=useState("");
  const [quote,setQuote]=useState<Quote|null>(null);const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");const [message,setMessage]=useState("");const [loading,setLoading]=useState(true);
  const [idempotencyKey,setIdempotencyKey]=useState("");
  useEffect(()=>{
    setIdempotencyKey(window.crypto.randomUUID());
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
    if(!addressId)return;setBusy(true);setError("");setMessage("");setQuote(null);
    try{
      const response=await fetch("/api/checkout/quote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({addressId})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);setQuote(result as Quote);
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not calculate shipping.");}
    finally{setBusy(false);}
  }
  async function pay(){
    if(!addressId||!quote?.taxConfigured||busy)return;
    setBusy(true);setError("");setMessage("");
    try{
      const loaded=await loadRazorpay();if(!loaded)throw new Error("Secure payment checkout could not be loaded. Check your connection and try again.");
      const orderResponse=await fetch("/api/checkout/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({addressId,idempotencyKey})});
      const orderResult=await orderResponse.json();if(!orderResponse.ok)throw new Error(orderResult.error);
      const order=orderResult as CheckoutOrder;
      const options={
        key:order.keyId,amount:order.amount,currency:order.currency,name:"NAMO NAMO jewels",
        description:`Order ${order.orderNumber}`,order_id:order.razorpayOrderId,
        prefill:{name:order.customerName,email:order.customerEmail},
        notes:{order_number:order.orderNumber},
        theme:{color:"#641f31"},
        handler:async(response:RazorpaySuccess)=>{
          setBusy(true);
          try{
            const verifyResponse=await fetch("/api/checkout/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(response)});
            const verified=await verifyResponse.json();if(!verifyResponse.ok)throw new Error(verified.error);
            setMessage(`Payment confirmed. Your order number is ${verified.orderNumber}.`);
            setQuote(null);
            window.location.assign(`/account?order=${encodeURIComponent(verified.orderNumber)}`);
          }catch(cause){setError(cause instanceof Error?cause.message:"Payment confirmation is pending. Do not pay again; check your order status.");}
          finally{setBusy(false);}
        },
        modal:{ondismiss:()=>{setBusy(false);setMessage("Payment window closed. Your order is not marked paid.");}},
      };
      const razorpay=new window.Razorpay!(options);
      razorpay.on("payment.failed",response=>{setError(response.error?.description||"Payment failed. You can try again.");setBusy(false);});
      razorpay.open();
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not start secure checkout.");setBusy(false);}
  }
  return <div className="checkout-quote">
    <div className="checkout-address"><h2>Delivery address</h2>
      {loading?<p>Loading saved addresses…</p>:!addresses.length?<div><p>You need to save a delivery address before checkout.</p><Link href="/account/addresses" className="text-link">Add an address</Link></div>:
      <><select value={addressId} onChange={event=>{setAddressId(event.target.value);setQuote(null);setIdempotencyKey(window.crypto.randomUUID());}}>{addresses.map(address=><option value={address.id} key={address.id}>{address.recipient_name} — {address.address_line_1}, {address.city} {address.postal_code}</option>)}</select><Link href="/account/addresses" className="text-link">Manage addresses</Link><button className="button button-primary" disabled={busy||!addressId} onClick={()=>void calculate()}>{busy?"Please wait…":"Calculate order total"}</button></>}
    </div>
    {error&&<p className="form-error" role="alert">{error}</p>}
    {message&&<p className="form-success" role="status">{message}</p>}
    {quote&&<div className="checkout-summary"><h2>Order summary</h2>
      <div><span>Product subtotal</span><strong>{money(quote.subtotalPaise)}</strong></div>
      {quote.taxConfigured&&<div><span>GST (included/added as configured)</span><strong>{money(quote.taxPaise)}</strong></div>}
      <div><span>Shipping</span><strong>{money(quote.shippingFeePaise)}</strong></div>
      <div><span>Destination</span><strong>{quote.destination}</strong></div>
      <div><span>Estimated delivery</span><strong>{quote.estimatedDaysMin}–{quote.estimatedDaysMax} days</strong></div>
      <div className="checkout-total"><span>Payable total</span><strong>{quote.taxConfigured?money(quote.totalPaise):"Tax setup required"}</strong></div>
      <p>Delivery estimates are indicative. Final tax and shipping are recalculated on the server when your order is created.</p>
      {!quote.taxConfigured?<p className="form-error">The tax classification for one or more products is incomplete. The store must configure the correct HSN and GST treatment before accepting payment.</p>:
      <button className="button button-primary" disabled={busy} onClick={()=>void pay()}>{busy?"Preparing secure payment…":"Pay securely with Razorpay"}</button>}
    </div>}
  </div>;
}
