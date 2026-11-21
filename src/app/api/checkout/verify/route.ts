import { NextResponse } from "next/server";
import { createHmac,timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime="nodejs";
const schema=z.object({razorpay_order_id:z.string().min(5).max(100),razorpay_payment_id:z.string().min(5).max(100),razorpay_signature:z.string().regex(/^[a-f0-9]{64}$/i)});
const noStore={"Cache-Control":"no-store"};

export async function POST(request:Request){
  const origin=request.headers.get("origin");
  if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403,headers:noStore});
  const supabase=await createClient();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503,headers:noStore});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in to verify your payment."},{status:401,headers:noStore});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Payment verification details are invalid."},{status:400,headers:noStore});
  const secret=process.env.RAZORPAY_KEY_SECRET;
  if(!secret||!process.env.RAZORPAY_KEY_ID)return NextResponse.json({error:"Payment verification is not configured."},{status:503,headers:noStore});

  const {razorpay_order_id:providerOrderId,razorpay_payment_id:providerPaymentId,razorpay_signature:signature}=parsed.data;
  const expected=createHmac("sha256",secret).update(`${providerOrderId}|${providerPaymentId}`).digest("hex");
  const expectedBuffer=Buffer.from(expected,"hex"),receivedBuffer=Buffer.from(signature,"hex");
  if(expectedBuffer.length!==receivedBuffer.length||!timingSafeEqual(expectedBuffer,receivedBuffer))
    return NextResponse.json({error:"Payment signature could not be verified."},{status:400,headers:noStore});

  const admin=createAdminClient();
  if(!admin)return NextResponse.json({error:"Secure payment verification is unavailable."},{status:503,headers:noStore});
  const {data:payment,error}=await admin.from("payments")
    .select("id,order_id,amount_paise,currency,provider_order_id,orders!inner(user_id,order_number)")
    .eq("provider_order_id",providerOrderId).maybeSingle();
  const order=Array.isArray(payment?.orders)?payment.orders[0]:payment?.orders;
  if(error||!payment||order?.user_id!==user.id)
    return NextResponse.json({error:"Payment order does not belong to this account."},{status:404,headers:noStore});

  try{
    const authorization=Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${secret}`).toString("base64");
    const providerResponse=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(providerPaymentId)}`,{
      headers:{Authorization:`Basic ${authorization}`},cache:"no-store",
    });
    const providerPayment=await providerResponse.json().catch(()=>null) as {id?:string;order_id?:string;amount?:number;currency?:string;status?:string}|null;
    if(!providerResponse.ok||providerPayment?.id!==providerPaymentId||providerPayment.order_id!==providerOrderId||
      providerPayment.amount!==payment.amount_paise||providerPayment.currency!==payment.currency||providerPayment.status!=="captured"){
      return NextResponse.json({error:"Payment is not confirmed as captured by the payment provider."},{status:409,headers:noStore});
    }
    const {data:orderId,error:markError}=await admin.rpc("mark_razorpay_payment_captured",{
      p_provider_order_id:providerOrderId,p_provider_payment_id:providerPaymentId,
      p_amount_paise:providerPayment.amount,p_event_id:`checkout-verify:${providerPaymentId}`,p_event_type:"checkout.verify",
    });
    if(markError||!orderId)return NextResponse.json({error:"Payment is verified but order confirmation is pending. Do not pay again; contact the store."},{status:503,headers:noStore});
    return NextResponse.json({success:true,orderId,orderNumber:order.order_number},{headers:noStore});
  }catch{
    return NextResponse.json({error:"Could not confirm payment status. Please check your order before retrying."},{status:502,headers:noStore});
  }
}
