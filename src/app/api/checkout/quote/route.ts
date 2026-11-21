import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema=z.object({addressId:z.string().uuid()});
type Variant={
  price_paise:number;is_active:boolean;hsn_code:string|null;gst_rate_bps:number|null;price_includes_tax:boolean|null;
  products:{status:string}|{status:string}[];
  product_availability:{availability:string}[]|{availability:string}|null;
};
type CartRow={quantity:number;product_variants:Variant|Variant[]};

export async function POST(request:Request){
  const supabase=await createClient();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in before checkout."},{status:401});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Select a valid delivery address."},{status:400});
  const {data:address}=await supabase.from("customer_addresses").select("id,country_code,postal_code,city,state")
    .eq("id",parsed.data.addressId).eq("user_id",user.id).maybeSingle();
  if(!address)return NextResponse.json({error:"Delivery address not found."},{status:404});
  const {data:cart}=await supabase.from("carts").select("id").eq("user_id",user.id).maybeSingle();
  if(!cart)return NextResponse.json({error:"Your bag is empty."},{status:400});
  const {data:cartData,error:cartError}=await supabase.from("cart_items")
    .select("quantity,product_variants!inner(id,price_paise,is_active,hsn_code,gst_rate_bps,price_includes_tax,products!inner(status),product_availability(availability))")
    .eq("cart_id",cart.id);
  if(cartError)return NextResponse.json({error:"Could not calculate your bag."},{status:500});
  const rows=(cartData??[]) as unknown as CartRow[];
  if(!rows.length)return NextResponse.json({error:"Your bag is empty."},{status:400});

  let subtotalPaise=0,taxPaise=0,taxAddedPaise=0,taxConfigured=true;
  for(const row of rows){
    const variant=Array.isArray(row.product_variants)?row.product_variants[0]:row.product_variants;
    const product=variant?(Array.isArray(variant.products)?variant.products[0]:variant.products):null;
    const availability=variant?(Array.isArray(variant.product_availability)?variant.product_availability[0]:variant.product_availability):null;
    if(!variant||!variant.is_active||product?.status!=="active"||availability?.availability==="temporarily_unavailable")
      return NextResponse.json({error:"A product in your bag is currently unavailable."},{status:409});
    const line=variant.price_paise*row.quantity;
    subtotalPaise+=line;
    if(variant.hsn_code===null||variant.gst_rate_bps===null||variant.price_includes_tax===null){taxConfigured=false;continue;}
    const lineTax=Math.round(line*variant.gst_rate_bps/(variant.price_includes_tax?10000+variant.gst_rate_bps:10000));
    taxPaise+=lineTax;if(!variant.price_includes_tax)taxAddedPaise+=lineTax;
  }
  const serviceClient=createAdminClient();
  if(!serviceClient)return NextResponse.json({error:"Secure shipping quote service is not configured."},{status:503});
  const {data:quotes,error}=await serviceClient.rpc("quote_shipping",{
    p_country_code:address.country_code,p_postal_code:address.postal_code,p_subtotal_paise:subtotalPaise,
  });
  if(error)return NextResponse.json({error:"Shipping could not be calculated. Please contact the store."},{status:503});
  const quote=quotes?.[0];
  if(!quote)return NextResponse.json({error:"Shipping is not configured for this PIN code yet. Please contact the store before ordering."},{status:422});
  return NextResponse.json({
    subtotalPaise,taxPaise,taxAddedPaise,taxConfigured,
    shippingFeePaise:quote.shipping_fee_paise,totalPaise:subtotalPaise+taxAddedPaise+quote.shipping_fee_paise,
    estimatedDaysMin:quote.estimated_days_min,estimatedDaysMax:quote.estimated_days_max,
    destination:`${address.city}, ${address.state} ${address.postal_code}`,
  },{headers:{"Cache-Control":"no-store"}});
}
