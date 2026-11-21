import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);

export default async function AdminDashboard(){
  const supabase=await createClient();
  if(!supabase)return null;
  const [products,orders,customers,paid]=await Promise.all([
    supabase.from("products").select("id",{count:"exact",head:true}),
    supabase.from("orders").select("id",{count:"exact",head:true}),
    supabase.from("profiles").select("id",{count:"exact",head:true}),
    supabase.from("orders").select("total_paise").in("status",["paid","processing","shipped","delivered"]),
  ]);
  const revenue=(paid.data??[]).reduce((sum,row)=>sum+row.total_paise,0);
  return <section className="admin-content">
    <span className="eyebrow">Store operations</span><h1>Overview</h1><p className="admin-intro">A live view of your NAMO NAMO store records.</p>
    <div className="admin-stat-grid">
      <article><small>Products</small><strong>{products.count??0}</strong><span>Catalogue records</span></article>
      <article><small>Orders</small><strong>{orders.count??0}</strong><span>All order statuses</span></article>
      <article><small>Customers</small><strong>{customers.count??0}</strong><span>Registered profiles</span></article>
      <article><small>Paid order value</small><strong>{money(revenue)}</strong><span>Paid and fulfilled orders</span></article>
    </div>
    <div className="admin-quick-links"><Link href="/admin/products">Manage catalogue <span>→</span></Link><Link href="/admin/orders">Review orders <span>→</span></Link></div>
    {(products.error||orders.error||customers.error||paid.error)&&<p className="form-error">Some dashboard metrics could not be loaded. Check the admin database policies.</p>}
  </section>;
}
