import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase=await createClient();
  if(!supabase) return <section className="page-section"><div className="empty-state"><h1>Account services are being configured</h1><p>Please check back soon.</p></div></section>;
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/auth/login?next=/account");
  const [{data:profile},{data:orders}]=await Promise.all([
    supabase.from("profiles").select("full_name,phone").eq("id",user.id).maybeSingle(),
    supabase.from("orders").select("id,order_number,status,total_paise,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(10),
  ]);
  const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);
  return <section className="page-section account-page">
    <span className="eyebrow">Your NAMO NAMO account</span><h1>Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</h1>
    <p className="account-email">{user.email}</p>
    <div className="account-grid"><article><h2>Account details</h2><p>{profile?.full_name || "Name not added"}</p><p>{profile?.phone || "Phone not added"}</p><Link href="/account/profile" className="text-link">Manage details</Link></article>
    <article><h2>Your orders</h2>{orders?.length ? orders.map(order=><div className="order-row" key={order.id}><div><strong>{order.order_number}</strong><small>{new Date(order.created_at).toLocaleDateString("en-IN")}</small></div><div><strong>{money(order.total_paise)}</strong><small>{order.status.replaceAll("_"," ")}</small></div></div>) : <p>Your order history will appear here after your first purchase.</p>}</article></div>
    <form action="/api/auth/logout" method="post"><button className="text-link" type="submit">Sign out</button></form>
  </section>;
}
