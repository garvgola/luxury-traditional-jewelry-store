import { createClient } from "@/lib/supabase/server";

const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);

export default async function AdminOrdersPage(){
  const supabase=await createClient();if(!supabase)return null;
  const {data:orders,error}=await supabase.from("orders").select("id,order_number,status,total_paise,created_at,profiles(full_name)").order("created_at",{ascending:false}).limit(100);
  return <section className="admin-content"><span className="eyebrow">Store operations</span><h1>Orders</h1><p className="admin-intro">Recent customer orders. Payment and fulfilment changes remain server-controlled.</p>
    {error?<p className="form-error">Orders could not be loaded. Check the admin RLS policies.</p>:!orders?.length?<div className="empty-state"><h2>No orders yet</h2><p>New customer orders will appear here.</p></div>:
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th></tr></thead><tbody>{orders.map((order:any)=><tr key={order.id}><td>{order.order_number}</td><td>{Array.isArray(order.profiles)?order.profiles[0]?.full_name:order.profiles?.full_name||"Customer"}</td><td>{new Date(order.created_at).toLocaleDateString("en-IN")}</td><td><span className="admin-status">{order.status.replaceAll("_"," ")}</span></td><td>{money(order.total_paise)}</td></tr>)}</tbody></table></div>}
  </section>;
}
