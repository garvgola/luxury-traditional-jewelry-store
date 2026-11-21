import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema=z.object({
  productId:z.string().uuid(),
  variantLabel:z.string().trim().min(1).max(100),
  sku:z.string().trim().max(80).optional().default(""),
  pricePaise:z.number().int().min(1).max(1000000000),
  availability:z.enum(["available_to_order","made_to_order","temporarily_unavailable"]),
  hsnCode:z.string().trim().regex(/^[0-9]{4,8}$/),
  gstRateBps:z.number().int().min(0).max(2800),
  priceIncludesTax:z.boolean(),
});
export async function POST(request:Request){
  const supabase=await createClient();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in to continue."},{status:401});
  const {data:isAdmin,error:roleError}=await supabase.rpc("has_role",{required_role:"admin"});
  if(roleError||isAdmin!==true)return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Check the variant name, price and tax classification."},{status:400});
  const p=parsed.data;
  const {data,error}=await supabase.rpc("admin_add_product_variant",{
    p_product_id:p.productId,p_variant_label:p.variantLabel,p_sku:p.sku,
    p_price_paise:p.pricePaise,p_availability:p.availability,p_hsn_code:p.hsnCode,
    p_gst_rate_bps:p.gstRateBps,p_price_includes_tax:p.priceIncludesTax,
  });
  if(error)return NextResponse.json({error:error.message.includes("duplicate")?"That SKU is already in use.":"Could not add this product variant."},{status:400});
  return NextResponse.json({success:true,variantId:data});
}
