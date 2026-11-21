import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type OrderItem={id:string;product_name_snapshot:string;variant_label_snapshot:string|null;sku_snapshot:string|null;unit_price_paise:number;quantity:number;line_total_paise:number;hsn_code_snapshot:string|null;gst_rate_bps_snapshot:number|null;tax_paise:number};
const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(paise/100);
export default async function CustomerOrderPage({params}:{params:Promise<{orderNumber:string}>}){
  const {orderNumber}=await params;const supabase=await createClient();
  if(!supabase)return <section className="page-section"><p>Order services are being configured.</p></section>;
  const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/auth/login");
  const {data:order}=await supabase.from("orders").select("id,order_number,status,subtotal_paise,tax_paise,tax_added_paise,tax_breakdown,shipping_paise,total_paise,shipping_address_snapshot,delivery_estimate_min,delivery_estimate_max,shipping_carrier,tracking_number,shipped_at,delivered_at,created_at")
    .eq("order_number",decodeURIComponent(orderNumber)).eq("user_id",user.id).maybeSingle();
  if(!order)notFound();
  const {data:items,error}=await supabase.from("order_items").select("id,product_name_snapshot,variant_label_snapshot,sku_snapshot,unit_price_paise,quantity,line_total_paise,hsn_code_snapshot,gst_rate_bps_snapshot,tax_paise")
    .eq("order_id",order.id).order("created_at");
  const address=order.shipping_address_snapshot as {recipient_name?:string;phone?:string;address_line_1?:string;address_line_2?:string;locality?:string;city?:string;state?:string;postal_code?:string;country_code?:string};
  return <section className="page-section customer-order-page">
    <Link href="/account" className="text-link">← Back to account</Link>
    <span className="eyebrow">Order confirmation</span><h1>{order.order_number}</h1>
    <p className="order-status-line">Status: <strong>{order.status.replaceAll("_"," ")}</strong></p>
    {order.status==="paid"&&<div className="checkout-success"><strong>Payment received</strong><p>Your payment has been verified. We will prepare your order and update its status here.</p></div>}
    <div className="customer-order-layout">
      <article className="customer-order-items"><h2>Items ordered</h2>
        {error?<p className="form-error">Order items could not be loaded.</p>:(items as OrderItem[]??[]).map(item=><div className="customer-order-item" key={item.id}>
          <div><strong>{item.product_name_snapshot}</strong><small>{item.variant_label_snapshot||"Default"} · Qty {item.quantity}</small><small>HSN {item.hsn_code_snapshot||"—"} · GST {(item.gst_rate_bps_snapshot??0)/100}%</small></div>
          <strong>{money(item.line_total_paise)}</strong>
        </div>)}
      </article>
      <aside className="customer-order-summary"><h2>Order summary</h2>
        <div><span>Subtotal</span><strong>{money(order.subtotal_paise)}</strong></div>
        <div><span>GST (included where configured)</span><strong>{money(order.tax_paise)}</strong></div>
        <div><span>Shipping</span><strong>{money(order.shipping_paise)}</strong></div>
        <p>GST shown above is included in product prices where configured; GST is added only where the product tax treatment specifies it.</p>
        <div className="checkout-total"><span>{order.status==="paid"||order.status==="processing"||order.status==="shipped"||order.status==="delivered"?"Total paid":"Total due"}</span><strong>{money(order.total_paise)}</strong></div>
        {order.shipping_carrier&&<><h3>Shipment tracking</h3><p>{order.shipping_carrier}<br/>Tracking: {order.tracking_number||"Pending"}</p></>}
        <h3>Delivery address</h3><p>{address.recipient_name}<br/>{address.address_line_1}<br/>{address.address_line_2&&<>{address.address_line_2}<br/></>}{address.locality&&<>{address.locality}<br/></>}{address.city}, {address.state} {address.postal_code}<br/>{address.country_code}<br/>{address.phone}</p>
        <p>Estimated delivery: {order.delivery_estimate_min||"To be confirmed"} – {order.delivery_estimate_max||"To be confirmed"}</p>
      </aside>
    </div>
  </section>;
}
