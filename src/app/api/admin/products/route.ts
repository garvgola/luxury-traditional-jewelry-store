import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createSchema=z.object({
  name:z.string().trim().min(2).max(120),
  slug:z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description:z.string().trim().max(5000).optional().default(""),
  pricePaise:z.number().int().positive().max(1000000000),
  sku:z.string().trim().max(80).optional().default(""),
  variantLabel:z.string().trim().max(100).optional().default("Default"),
  availability:z.enum(["available_to_order","made_to_order","temporarily_unavailable"]),
});
const availabilitySchema=z.object({
  variantId:z.string().uuid(),
  availability:z.enum(["available_to_order","made_to_order","temporarily_unavailable"]),
});
const archiveSchema=z.object({productId:z.string().uuid()});

async function adminClient(){
  const supabase=await createClient();
  if(!supabase)return {supabase:null,user:null,authorized:false};
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return {supabase,user:null,authorized:false};
  const {data:isAdmin,error}=await supabase.rpc("has_role",{required_role:"admin"});
  return {supabase,user,authorized:!error&&isAdmin===true};
}

export async function GET(){
  const {supabase,authorized}=await adminClient();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  if(!authorized)return NextResponse.json({error:"Administrator access required."},{status:403});
  const {data,error}=await supabase.from("products")
    .select("id,name,slug,description,status,created_at,product_variants(id,variant_label,sku,price_paise,is_active,product_availability(availability)),product_images(id,storage_path,alt_text,sort_order)")
    .order("created_at",{ascending:false});
  if(error)return NextResponse.json({error:"Could not load products."},{status:500});
  return NextResponse.json({products:data??[]});
}

export async function POST(request:Request){
  const {supabase,authorized}=await adminClient();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  if(!authorized)return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=createSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Check the product details and price."},{status:400});
  const p=parsed.data;
  const {data,error}=await supabase.rpc("admin_create_product",{
    p_name:p.name,p_slug:p.slug,p_description:p.description,p_category_id:null,
    p_price_paise:p.pricePaise,p_sku:p.sku,p_variant_label:p.variantLabel,p_availability:p.availability,
  });
  if(error)return NextResponse.json({error:error.message.includes("duplicate")?"A product with this URL slug or SKU already exists.":"Could not create this product."},{status:400});
  return NextResponse.json({success:true,productId:data});
}

export async function PATCH(request:Request){
  const {supabase,user,authorized}=await adminClient();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  if(!authorized||!user)return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=availabilitySchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Choose a valid availability state."},{status:400});
  const {error}=await supabase.from("product_availability").upsert({
    variant_id:parsed.data.variantId,availability:parsed.data.availability,updated_by:user.id,
  },{onConflict:"variant_id"});
  if(error)return NextResponse.json({error:"Could not update product availability."},{status:500});
  return NextResponse.json({success:true});
}

export async function DELETE(request:Request){
  const {supabase,authorized}=await adminClient();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  if(!authorized)return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=archiveSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Choose a valid product."},{status:400});
  const {error}=await supabase.from("products").update({status:"archived"}).eq("id",parsed.data.productId);
  if(error)return NextResponse.json({error:"Could not archive this product."},{status:500});
  return NextResponse.json({success:true});
}
