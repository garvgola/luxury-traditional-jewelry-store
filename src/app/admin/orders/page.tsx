import { AdminOrderManager } from "@/components/admin-order-manager";
import { createClient } from "@/lib/supabase/server";
type OrderRow={id:string;order_number:string;user_id:string;status:string;total_paise:number;created_at:string;shipping_carrier:string|null;tracking_number:string|null};
type ProfileRow={id:string;full_name:string|null};
export default async function AdminOrdersPage(){
  const supabase=await createClient();if(!supabase)return null;
  const {data:orders,error}=await supabase.from("orders").select("id,order_number,user_id,status,total_paise,created_at,shipping_carrier,tracking_number").order("created_at",{ascending:false}).limit(100);
  const rows=(orders??[]) as OrderRow[];const userIds=[...new Set(rows.map(order=>order.user_id))];
  const {data:profiles}=userIds.length?await supabase.from("profiles").select("id,full_name").in("id",userIds):{data:[]};
  const names=new Map(((profiles??[]) as ProfileRow[]).map(profile=>[profile.id,profile.full_name||"Customer"]));
  const view=rows.map(order=>({...order,customer_name:names.get(order.user_id)||"Customer"}));
  return <section className="admin-content"><span className="eyebrow">Store operations</span><h1>Orders</h1><p className="admin-intro">Process paid orders, add carrier tracking and mark deliveries. Payment and refund states remain server-controlled.</p>
    {error?<p className="form-error">Orders could not be loaded. Check the admin RLS policies.</p>:<AdminOrderManager orders={view}/>}
  </section>;
}
