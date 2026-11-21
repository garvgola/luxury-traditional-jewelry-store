import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime="nodejs";
const schema=z.object({addressId:z.string().uuid(),idempotencyKey:z.string().regex(/^[A-Za-z0-9_-]{16,80}$/)});
const noStore={"Cache-Control":"no-store"};

export async function POST(request:Request){
  const origin=request.headers.get("origin");
  if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403,headers:noStore});
  const supabase=await createClient();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503,headers:noStore});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in before checkout."},{status:401,headers:noStore});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Select a valid delivery address."},{status:400,headers:noStore});

  const keyId=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;
  if(!keyId||!secret)return NextResponse.json({error:"Online payment is not configured yet. Please contact the store."},{status:503,headers:noStore});
  const admin=createAdminClient();
  if(!admin)return NextResponse.json({error:"Secure checkout is not configured."},{status:503,headers:noStore});

  const {data:created,error:createError}=await admin.rpc("create_checkout_order",{
    p_user_id:user.id,p_address_id:parsed.data.addressId,p_idempotency_key:parsed.data.idempotencyKey,
  });
  if(createError||!created?.length){
    const message=createError?.message||"Could not create your order.";
    const status=/Tax configuration is incomplete|Shipping is not configured|empty|unavailable|not published|Delivery address/i.test(message)?422:500;
    return NextResponse.json({error:message.includes("Tax configuration is incomplete")?"The tax details for one or more products are incomplete. Please contact the store.":message},{status,headers:noStore});
  }
  const order=created[0];
  const {data:payment,error:paymentError}=await admin.from("payments")
    .select("id,provider_order_id,amount_paise,status").eq("order_id",order.order_id).maybeSingle();
  if(paymentError||!payment)return NextResponse.json({error:"Payment record could not be loaded."},{status:500,headers:noStore});
  if(payment.status==="captured")return NextResponse.json({error:"This order has already been paid."},{status:409,headers:noStore});
  if(payment.provider_order_id){
    return NextResponse.json({orderId:order.order_id,orderNumber:order.order_number,razorpayOrderId:payment.provider_order_id,
      amount:payment.amount_paise,currency:"INR",keyId,customerName:user.user_metadata?.full_name||"",customerEmail:user.email||""},{headers:noStore});
  }

  const claimToken=randomUUID();
  const {data:claimed,error:claimError}=await admin.rpc("claim_checkout_payment",{p_order_id:order.order_id,p_claim_token:claimToken});
  if(claimError||claimed!==true)return NextResponse.json({error:"Your secure payment session is being prepared. Please wait a moment and try again."},{status:409,headers:noStore});

  try{
    const authorization=Buffer.from(`${keyId}:${secret}`).toString("base64");
    const providerResponse=await fetch("https://api.razorpay.com/v1/orders",{
      method:"POST",headers:{Authorization:`Basic ${authorization}`,"Content-Type":"application/json"},
      body:JSON.stringify({amount:order.total_paise,currency:"INR",receipt:order.order_number,
        notes:{store_order_id:order.order_id,order_number:order.order_number}}),
      cache:"no-store",
    });
    const providerOrder=await providerResponse.json().catch(()=>null) as {id?:string;amount?:number;currency?:string;error?:{description?:string}}|null;
    if(!providerResponse.ok||!providerOrder?.id||providerOrder.amount!==order.total_paise||providerOrder.currency!=="INR"){
      return NextResponse.json({error:providerOrder?.error?.description||"Payment provider could not create a secure order. Please try again."},{status:502,headers:noStore});
    }
    const {error:updateError}=await admin.from("payments").update({provider_order_id:providerOrder.id})
      .eq("id",payment.id).is("provider_order_id",null);
    if(updateError){
      return NextResponse.json({error:"Payment session was created but could not be linked. Please contact the store before retrying."},{status:503,headers:noStore});
    }
    return NextResponse.json({orderId:order.order_id,orderNumber:order.order_number,razorpayOrderId:providerOrder.id,
      amount:order.total_paise,currency:"INR",keyId,customerName:user.user_metadata?.full_name||"",customerEmail:user.email||""},{headers:noStore});
  }catch{
    return NextResponse.json({error:"Payment provider is temporarily unavailable. Please try again."},{status:502,headers:noStore});
  }finally{
    await admin.rpc("release_checkout_payment_claim",{p_order_id:order.order_id,p_claim_token:claimToken});
  }
}
