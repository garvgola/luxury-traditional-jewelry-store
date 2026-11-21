"use client";
import { useState } from "react";
type Order={id:string;order_number:string;customer_name:string;status:string;total_paise:number;created_at:string;shipping_carrier:string|null;tracking_number:string|null};
const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(paise/100);
function FulfilmentCard({order}:{order:Order}){
  const [status,setStatus]=useState(order.status);const [carrier,setCarrier]=useState(order.shipping_carrier||"");const [tracking,setTracking]=useState(order.tracking_number||"");
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("");
  const next=status==="paid"?"processing":status==="processing"?"shipped":status==="shipped"?"delivered":null;
  async function update(){
    if(!next)return;setBusy(true);setError("");setMessage("");
    try{
      const response=await fetch("/api/admin/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        orderId:order.id,status:next,shippingCarrier:carrier,trackingNumber:tracking,
      })});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setStatus(next);setMessage("Order status updated.");if(next==="shipped")window.location.reload();
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not update order.");}
    finally{setBusy(false);}
  }
  return <article className="admin-order-card">
    <div className="admin-order-top"><div><strong>{order.order_number}</strong><small>{order.customer_name} · {new Date(order.created_at).toLocaleDateString("en-IN")}</small></div><div><strong>{money(order.total_paise)}</strong><span className="admin-status">{status.replaceAll("_"," ")}</span></div></div>
    {order.shipping_carrier&&<p className="admin-order-tracking">{order.shipping_carrier} · {order.tracking_number}</p>}
    {next&&<div className="admin-order-actions">
      {next==="shipped"&&<div className="admin-shipment-fields"><label>Shipping carrier<input value={carrier} onChange={event=>setCarrier(event.target.value)} placeholder="Courier partner"/></label><label>Tracking number<input value={tracking} onChange={event=>setTracking(event.target.value)} placeholder="AWB / tracking ID"/></label></div>}
      <button className="button button-primary" disabled={busy||(next==="shipped"&&(!carrier.trim()||!tracking.trim()))} onClick={()=>void update()}>{busy?"Saving…":next==="processing"?"Start processing":next==="shipped"?"Mark as shipped":"Mark as delivered"}</button>
    </div>}
    {error&&<p className="form-error" role="alert">{error}</p>}{message&&<p className="form-success" role="status">{message}</p>}
  </article>;
}
export function AdminOrderManager({orders}:{orders:Order[]}){
  if(!orders.length)return <div className="empty-state"><h2>No orders yet</h2><p>Verified customer orders will appear here.</p></div>;
  return <div className="admin-order-list">{orders.map(order=><FulfilmentCard key={order.id} order={order}/>)}</div>;
}
