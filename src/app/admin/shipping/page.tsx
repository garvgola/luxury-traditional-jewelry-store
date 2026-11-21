import { AdminShippingManager } from "@/components/admin-shipping-manager";
import { createClient } from "@/lib/supabase/server";

type Rate={id:string;fee_paise:number;min_order_subtotal_paise:number;is_active:boolean};
type Zone={id:string;name:string;country_code:string;postal_code_prefixes:string[];is_active:boolean;estimated_days_min:number;estimated_days_max:number;shipping_rates:Rate[]};

export default async function AdminShippingPage(){
  const supabase=await createClient();if(!supabase)return null;
  const {data,error}=await supabase.from("shipping_zones").select("id,name,country_code,postal_code_prefixes,is_active,estimated_days_min,estimated_days_max,shipping_rates(id,fee_paise,min_order_subtotal_paise,is_active)").order("name");
  return <section className="admin-content"><span className="eyebrow">Store operations</span><h1>Shipping</h1><p className="admin-intro">Configure owner-managed delivery areas, fees and indicative delivery windows.</p>
    {error?<p className="form-error">Shipping zones could not be loaded. Check admin RLS policies.</p>:<AdminShippingManager initial={(data??[]) as unknown as Zone[]}/>}
  </section>;
}
