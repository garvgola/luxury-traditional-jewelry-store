import { AdminProductManager } from "@/components/admin-product-manager";
import { createClient } from "@/lib/supabase/server";

type ProductRow={
  id:string;name:string;slug:string;description:string|null;status:string;
  product_images:{id:string;storage_path:string;alt_text:string;sort_order:number}[];
  product_variants:{
    id:string;variant_label:string;sku:string|null;price_paise:number;is_active:boolean;hsn_code:string|null;gst_rate_bps:number|null;price_includes_tax:boolean|null;
    product_availability:{availability:"available_to_order"|"made_to_order"|"temporarily_unavailable"}[]|{availability:"available_to_order"|"made_to_order"|"temporarily_unavailable"}|null;
  }[];
};
type CategoryRow={id:string;name:string;is_active:boolean};

export default async function AdminProductsPage(){
  const supabase=await createClient();if(!supabase)return null;
  const [productsResult,categoriesResult]=await Promise.all([
    supabase.from("products").select("id,name,slug,description,status,product_variants(id,variant_label,sku,price_paise,is_active,hsn_code,gst_rate_bps,price_includes_tax,product_availability(availability)),product_images(id,storage_path,alt_text,sort_order)").order("created_at",{ascending:false}),
    supabase.from("categories").select("id,name,is_active").order("sort_order"),
  ]);
  return <section className="admin-content"><span className="eyebrow">Store operations</span><h1>Products</h1><p className="admin-intro">Create catalogue entries, assign categories, upload images and maintain owner-managed availability.</p>
    {productsResult.error?<p className="form-error">Products could not be loaded. Check admin RLS policies.</p>:<AdminProductManager products={(productsResult.data??[]) as unknown as ProductRow[]} categories={(categoriesResult.data??[]) as CategoryRow[]}/>}
  </section>;
}
