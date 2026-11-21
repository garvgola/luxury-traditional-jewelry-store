import { AdminCategoryManager } from "@/components/admin-category-manager";
import { createClient } from "@/lib/supabase/server";

type Category={id:string;name:string;slug:string;description:string|null;sort_order:number;is_active:boolean};
export default async function AdminCategoriesPage(){
  const supabase=await createClient();if(!supabase)return null;
  const {data,error}=await supabase.from("categories").select("id,name,slug,description,sort_order,is_active").order("sort_order").order("name");
  return <section className="admin-content"><span className="eyebrow">Store operations</span><h1>Categories</h1><p className="admin-intro">Create the category pages used by the storefront and assign products to them.</p>
    {error?<p className="form-error">Categories could not be loaded.</p>:<AdminCategoryManager initial={(data??[]) as Category[]}/>}
  </section>;
}
