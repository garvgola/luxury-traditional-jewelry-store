import { NextResponse } from "next/server";
import { createHmac,timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime="nodejs";

export async function POST(request:Request){
  const secret=process.env.RAZORPAY_WEBHOOK_SECRET;
  if(!secret)return NextResponse.json({error:"Webhook is not configured."},{status:503});
  const signature=request.headers.get("x-razorpay-signature")||"";
  const eventId=request.headers.get("x-razorpay-event-id")||"";
  if(!/^[a-f0-9]{64}$/i.test(signature)||!eventId||eventId.length>200)
    return NextResponse.json({error:"Invalid webhook headers."},{status:400});
  const rawBody=await request.text();
  if(rawBody.length>1024*1024)return NextResponse.json({error:"Webhook payload too large."},{status:413});
  const expected=createHmac("sha256",secret).update(rawBody).digest("hex");
  const a=Buffer.from(expected,"hex"),b=Buffer.from(signature,"hex");
  if(a.length!==b.length||!timingSafeEqual(a,b))return NextResponse.json({error:"Invalid webhook signature."},{status:400});
  let event:{event?:string;payload?:{payment?:{entity?:{id?:string;order_id?:string;amount?:number;currency?:string;status?:string}}}};
  try{event=JSON.parse(rawBody) as typeof event;}catch{return NextResponse.json({error:"Invalid webhook JSON."},{status:400});}
  const type=event.event||"";
  if(type!=="payment.captured"&&type!=="order.paid"&&type!=="payment.failed")return NextResponse.json({received:true,ignored:true});
  const payment=event.payload?.payment?.entity;
  if(!payment?.id||!payment.order_id||!Number.isInteger(payment.amount)||payment.currency!=="INR"||(type==="payment.failed"?payment.status!=="failed":payment.status!=="captured"))
    return NextResponse.json({error:"Captured payment details are incomplete."},{status:400});
  const admin=createAdminClient();
  if(!admin)return NextResponse.json({error:"Payment database is unavailable."},{status:503});
  const {data:orderId,error}=await admin.rpc(type==="payment.failed"?"mark_razorpay_payment_failed":"mark_razorpay_payment_captured",{
    p_provider_order_id:payment.order_id,p_provider_payment_id:payment.id,
    p_amount_paise:payment.amount,p_event_id:eventId,p_event_type:type,
  });
  if(error||!orderId)return NextResponse.json({error:"Payment event could not be reconciled."},{status:503});
  return NextResponse.json({received:true});
}
