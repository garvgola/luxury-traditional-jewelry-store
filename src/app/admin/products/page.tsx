import { AdminProductManager } from "@/components/admin-product-manager";
import { createClient } from "@/lib/supabase/server";

type ProductRow={
  id:string;name:string;slug:string;description:string|null;status:string;
  product_images:{id:string;storage_path:string;alt_text:string;sort_order:number}[];
  product_variants:{
    id:string;variant_label:string;sku:string|null;price_paise:number;is_active:boolean;
    product_availability:{availability:"available_to_order"|"made_to_order"|"temporarily_unavailable"}[]|{availability:"available_to_order"|"made_to_order"|"temporarily_unavailable"}|null;
  }[];
};

export default async function AdminProductsPage(){
  const supabase=await createClient();if(!supabase)return null;
  const {data,error}=await supabase.from("products").select("id,name,slug,description,status,product_variants(id,variant_label,sku,price_paise,is_active,product_availability(availability)),product_images(id,storage_path,alt_text,sort_order)").order("created_at",{ascending:false});
  return <section className="admin-content"><span className="eyebrow">Store operations</span><h1>Products</h1><p className="admin-intro">Create catalogue entries and maintain owner-managed availability.</p>
    {error?<p className="form-error">Products could not be loaded. Check admin RLS policies.</p>:<AdminProductManager products={(data??[]) as unknown as ProductRow[]}/>}
  </section>;
}
