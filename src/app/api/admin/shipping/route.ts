import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createSchema=z.object({
  name:z.string().trim().min(2).max(100),
  countryCode:z.string().trim().length(2).default("IN"),
  postalPrefixes:z.array(z.string().trim().min(1).max(12)).default([]),
  estimatedDaysMin:z.number().int().min(0).max(90),
  estimatedDaysMax:z.number().int().min(0).max(120),
  feePaise:z.number().int().min(0).max(10000000),
  minOrderSubtotalPaise:z.number().int().min(0).max(1000000000).default(0),
}).refine(value=>value.estimatedDaysMax>=value.estimatedDaysMin,{message:"Maximum delivery days must be at least the minimum."});
const patchSchema=z.object({
  zoneId:z.string().uuid().optional(),rateId:z.string().uuid().optional(),
  isActive:z.boolean().optional(),feePaise:z.number().int().min(0).optional(),
  minOrderSubtotalPaise:z.number().int().min(0).optional(),
  estimatedDaysMin:z.number().int().min(0).optional(),estimatedDaysMax:z.number().int().min(0).optional(),
});
async function admin(){
  const supabase=await createClient();if(!supabase)return {supabase:null,authorized:false};
  const {data:{user}}=await supabase.auth.getUser();if(!user)return {supabase,authorized:false};
  const {data,error}=await supabase.rpc("has_role",{required_role:"admin"});
  return {supabase,authorized:!error&&data===true};
}
export async function GET(){
  const {supabase,authorized}=await admin();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  if(!authorized)return NextResponse.json({error:"Administrator access required."},{status:403});
  const {data,error}=await supabase.from("shipping_zones")
    .select("id,name,country_code,postal_code_prefixes,is_active,estimated_days_min,estimated_days_max,shipping_rates(id,fee_paise,min_order_subtotal_paise,is_active)")
    .order("name");
  if(error)return NextResponse.json({error:"Could not load shipping zones."},{status:500});
  return NextResponse.json({zones:data??[]});
}
export async function POST(request:Request){
  const {supabase,authorized}=await admin();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  if(!authorized)return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=createSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Check shipping zone, postal prefixes, delivery window and rate."},{status:400});
  const p=parsed.data;
  const {data:zone,error:zoneError}=await supabase.from("shipping_zones").insert({
    name:p.name,country_code:p.countryCode.toUpperCase(),postal_code_prefixes:p.postalPrefixes,
    estimated_days_min:p.estimatedDaysMin,estimated_days_max:p.estimatedDaysMax,
  }).select("id").single();
  if(zoneError||!zone)return NextResponse.json({error:"Could not create shipping zone."},{status:500});
  const {error:rateError}=await supabase.from("shipping_rates").insert({
    zone_id:zone.id,fee_paise:p.feePaise,min_order_subtotal_paise:p.minOrderSubtotalPaise,
  });
  if(rateError){
    await supabase.from("shipping_zones").delete().eq("id",zone.id);
    return NextResponse.json({error:"Could not create shipping rate; the zone was rolled back."},{status:500});
  }
  return NextResponse.json({success:true,zoneId:zone.id});
}
export async function PATCH(request:Request){
  const {supabase,authorized}=await admin();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  if(!authorized)return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=patchSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success||(!parsed.data.zoneId&&!parsed.data.rateId))return NextResponse.json({error:"Choose a valid zone or rate."},{status:400});
  const {zoneId,rateId,...values}=parsed.data;
  if(zoneId){
    const zoneValues={is_active:values.isActive,estimated_days_min:values.estimatedDaysMin,estimated_days_max:values.estimatedDaysMax};
    const clean=Object.fromEntries(Object.entries(zoneValues).filter(([,value])=>value!==undefined));
    const {error}=await supabase.from("shipping_zones").update(clean).eq("id",zoneId);
    if(error)return NextResponse.json({error:"Could not update shipping zone."},{status:500});
  }else if(rateId){
    const rateValues={is_active:values.isActive,fee_paise:values.feePaise,min_order_subtotal_paise:values.minOrderSubtotalPaise};
    const clean=Object.fromEntries(Object.entries(rateValues).filter(([,value])=>value!==undefined));
    const {error}=await supabase.from("shipping_rates").update(clean).eq("id",rateId);
    if(error)return NextResponse.json({error:"Could not update shipping rate."},{status:500});
  }
  return NextResponse.json({success:true});
}
export async function DELETE(request:Request){
  const {supabase,authorized}=await admin();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  if(!authorized)return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=z.object({zoneId:z.string().uuid()}).safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Choose a valid zone."},{status:400});
  const {error}=await supabase.from("shipping_zones").delete().eq("id",parsed.data.zoneId);
  if(error)return NextResponse.json({error:"Could not delete shipping zone."},{status:500});
  return NextResponse.json({success:true});
}
