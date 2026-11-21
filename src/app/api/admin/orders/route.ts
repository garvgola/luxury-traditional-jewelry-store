import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema=z.object({
  orderId:z.string().uuid(),
  status:z.enum(["processing","shipped","delivered"]),
  shippingCarrier:z.string().trim().min(2).max(100).optional(),
  trackingNumber:z.string().trim().min(3).max(120).optional(),
});
export async function PATCH(request:Request){
  const supabase=await createClient();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in to continue."},{status:401});
  const {data:isAdmin,error:roleError}=await supabase.rpc("has_role",{required_role:"admin"});
  if(roleError||isAdmin!==true)return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Check the order status and shipping details."},{status:400});
  if(parsed.data.status==="shipped"&&(!parsed.data.shippingCarrier||!parsed.data.trackingNumber))
    return NextResponse.json({error:"Carrier and tracking number are required before shipping."},{status:400});
  const {error}=await supabase.rpc("admin_update_order_fulfilment",{
    p_order_id:parsed.data.orderId,p_new_status:parsed.data.status,
    p_shipping_carrier:parsed.data.shippingCarrier??null,p_tracking_number:parsed.data.trackingNumber??null,
  });
  if(error)return NextResponse.json({error:error.message.includes("Invalid order status")?"This order has changed. Refresh and try again.":error.message},{status:400});
  return NextResponse.json({success:true});
}
