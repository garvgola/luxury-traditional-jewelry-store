import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({children}:{children:React.ReactNode}){
  const supabase=await createClient();
  if(!supabase)return <div className="admin-config-notice">Admin services are not configured. Add Supabase environment variables first.</div>;
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/auth/login?next=/admin");
  const {data:isAdmin,error}=await supabase.rpc("has_role",{required_role:"admin"});
  if(error||!isAdmin)redirect("/account");
  return <div className="admin-shell">
    <aside className="admin-sidebar"><Link href="/admin" className="admin-brand">NAMO NAMO <small>ADMIN</small></Link>
      <nav><Link href="/admin">Overview</Link><Link href="/admin/products">Products</Link><Link href="/admin/categories">Categories</Link><Link href="/admin/orders">Orders</Link><Link href="/admin/shipping">Shipping</Link><Link href="/account">Storefront</Link></nav>
    </aside>
    <main className="admin-main">{children}</main>
  </div>;
}
