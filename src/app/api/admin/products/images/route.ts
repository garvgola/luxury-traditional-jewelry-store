import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const addSchema=z.object({
  productId:z.string().uuid(),
  storagePath:z.string().trim().min(8).max(500),
  altText:z.string().trim().max(250).default(""),
});
async function admin(){
  const supabase=await createClient();if(!supabase)return {supabase:null,authorized:false};
  const {data:{user}}=await supabase.auth.getUser();if(!user)return {supabase,authorized:false};
  const {data,error}=await supabase.rpc("has_role",{required_role:"admin"});
  return {supabase,authorized:!error&&data===true};
}
export async function POST(request:Request){
  const {supabase,authorized}=await admin();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  if(!authorized)return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=addSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid product image details."},{status:400});
  const {productId,storagePath,altText}=parsed.data;
  if(!storagePath.startsWith(`products/${productId}/`))return NextResponse.json({error:"Image path does not match this product."},{status:400});
  const {data:existing}=await supabase.from("product_images").select("sort_order").eq("product_id",productId).order("sort_order",{ascending:false}).limit(1);
  const sortOrder=(existing?.[0]?.sort_order??0)+10;
  const {error}=await supabase.from("product_images").insert({product_id:productId,storage_path:storagePath,alt_text:altText,sort_order:sortOrder});
  if(error)return NextResponse.json({error:"Could not attach image to product."},{status:500});
  return NextResponse.json({success:true});
}
export async function PATCH(request:Request){
  const {supabase,authorized}=await admin();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  if(!authorized)return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=z.object({imageId:z.string().uuid(),altText:z.string().trim().max(250).optional(),sortOrder:z.number().int().min(0).max(10000).optional()}).refine(value=>value.altText!==undefined||value.sortOrder!==undefined).safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid image update."},{status:400});
  const {imageId,altText,sortOrder}=parsed.data;
  const update={alt_text:altText,sort_order:sortOrder};
  const clean=Object.fromEntries(Object.entries(update).filter(([,value])=>value!==undefined));
  const {error}=await supabase.from("product_images").update(clean).eq("id",imageId);
  if(error)return NextResponse.json({error:"Could not update product image."},{status:500});
  return NextResponse.json({success:true});
}
export async function PATCH(request:Request){
  const {supabase,authorized}=await admin();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  if(!authorized)return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=z.object({imageId:z.string().uuid(),altText:z.string().trim().max(250).optional(),sortOrder:z.number().int().min(0).max(10000).optional()}).refine(value=>value.altText!==undefined||value.sortOrder!==undefined).safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid image update."},{status:400});
  const {imageId,altText,sortOrder}=parsed.data;
  const update={alt_text:altText,sort_order:sortOrder};
  const clean=Object.fromEntries(Object.entries(update).filter(([,value])=>value!==undefined));
  const {error}=await supabase.from("product_images").update(clean).eq("id",imageId);
  if(error)return NextResponse.json({error:"Could not update product image."},{status:500});
  return NextResponse.json({success:true});
}
export async function DELETE(request:Request){
  const {supabase,authorized}=await admin();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  if(!authorized)return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=z.object({imageId:z.string().uuid()}).safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Choose a valid image."},{status:400});
  const {data:image,error:readError}=await supabase.from("product_images").select("id,storage_path").eq("id",parsed.data.imageId).maybeSingle();
  if(readError||!image)return NextResponse.json({error:"Product image not found."},{status:404});
  const {error}=await supabase.from("product_images").delete().eq("id",image.id);
  if(error)return NextResponse.json({error:"Could not remove image from the catalogue."},{status:500});
  const {error:storageError}=await supabase.storage.from("product-media").remove([image.storage_path]);
  return NextResponse.json({success:true,...(storageError?{warning:"Image is no longer published but storage cleanup is pending."}:{})});
}
