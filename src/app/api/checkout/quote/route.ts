import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema=z.object({addressId:z.string().uuid()});
type QuoteCartRow={
  quantity:number;
  product_variants:{
    id:string;price_paise:number;is_active:boolean;
    products:{status:string}|{status:string}[];
    product_availability:{availability:string}[]|{availability:string}|null;
  }|{
    id:string;price_paise:number;is_active:boolean;
    products:{status:string}|{status:string}[];
    product_availability:{availability:string}[]|{availability:string}|null;
  }[];
};

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
    .select("quantity,product_variants!inner(id,price_paise,is_active,products!inner(status),product_availability(availability))")
    .eq("cart_id",cart.id);
  if(cartError)return NextResponse.json({error:"Could not calculate your bag."},{status:500});
  const rows=(cartData??[]) as unknown as QuoteCartRow[];
  if(!rows.length)return NextResponse.json({error:"Your bag is empty."},{status:400});

  let subtotalPaise=0;
  for(const row of rows){
    const variant=Array.isArray(row.product_variants)?row.product_variants[0]:row.product_variants;
    if(!variant||!variant.is_active)return NextResponse.json({error:"A product in your bag is no longer available."},{status:409});
    const product=Array.isArray(variant.products)?variant.products[0]:variant.products;
    const availability=Array.isArray(variant.product_availability)?variant.product_availability[0]:variant.product_availability;
    if(product?.status!=="active"||availability?.availability==="temporarily_unavailable")
      return NextResponse.json({error:"A product in your bag is currently unavailable."},{status:409});
    subtotalPaise+=variant.price_paise*row.quantity;
  }

  const serviceClient=createAdminClient();
  if(!serviceClient)return NextResponse.json({error:"Secure shipping quote service is not configured. Ask the store owner to configure the server-only service key."},{status:503});
  const {data:quotes,error}=await serviceClient.rpc("quote_shipping",{
    p_country_code:address.country_code,p_postal_code:address.postal_code,p_subtotal_paise:subtotalPaise,
  });
  if(error)return NextResponse.json({error:"Shipping could not be calculated. Please contact the store."},{status:503});
  const quote=quotes?.[0];
  if(!quote)return NextResponse.json({error:"Shipping is not configured for this PIN code yet. Please contact the store before ordering."},{status:422});
  return NextResponse.json({
    subtotalPaise,shippingFeePaise:quote.shipping_fee_paise,
    estimatedDaysMin:quote.estimated_days_min,estimatedDaysMax:quote.estimated_days_max,
    destination:`${address.city}, ${address.state} ${address.postal_code}`,
    paymentEnabled:false,taxConfigured:false,
  });
}
