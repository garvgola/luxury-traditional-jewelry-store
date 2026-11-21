import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createSchema=z.object({
  recipient_name:z.string().trim().min(2).max(100),
  phone:z.string().trim().min(7).max(20),
  address_line_1:z.string().trim().min(4).max(200),
  address_line_2:z.string().trim().max(200).optional().nullable(),
  locality:z.string().trim().max(100).optional().nullable(),
  city:z.string().trim().min(2).max(100),
  state:z.string().trim().min(2).max(100),
  postal_code:z.string().trim().min(4).max(12),
  country_code:z.string().trim().length(2).default("IN"),
  is_default:z.boolean().default(false),
});
const updateSchema=z.object({
  id:z.string().uuid(),
  recipient_name:z.string().trim().min(2).max(100).optional(),
  phone:z.string().trim().min(7).max(20).optional(),
  address_line_1:z.string().trim().min(4).max(200).optional(),
  address_line_2:z.string().trim().max(200).optional().nullable(),
  locality:z.string().trim().max(100).optional().nullable(),
  city:z.string().trim().min(2).max(100).optional(),
  state:z.string().trim().min(2).max(100).optional(),
  postal_code:z.string().trim().min(4).max(12).optional(),
  country_code:z.string().trim().length(2).optional(),
  is_default:z.boolean().optional(),
});

async function currentUser(){
  const supabase=await createClient();
  if(!supabase)return {supabase:null,user:null};
  const {data:{user}}=await supabase.auth.getUser();
  return {supabase,user};
}

export async function GET(){
  const {supabase,user}=await currentUser();
  if(!supabase)return NextResponse.json({error:"Store services are not configured yet."},{status:503});
  if(!user)return NextResponse.json({error:"Sign in to manage delivery addresses."},{status:401});
  const {data,error}=await supabase.from("customer_addresses").select("*").eq("user_id",user.id).order("is_default",{ascending:false}).order("created_at",{ascending:false});
  if(error)return NextResponse.json({error:"Could not load your addresses."},{status:500});
  return NextResponse.json({addresses:data??[]});
}

export async function POST(request:Request){
  const {supabase,user}=await currentUser();
  if(!supabase)return NextResponse.json({error:"Store services are not configured yet."},{status:503});
  if(!user)return NextResponse.json({error:"Sign in to save a delivery address."},{status:401});
  const parsed=createSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Check the address details and try again."},{status:400});
  const {is_default,...values}=parsed.data;
  const {data:address,error}=await supabase.from("customer_addresses").insert({...values,user_id:user.id,is_default:false}).select("id").single();
  if(error||!address)return NextResponse.json({error:"Could not save this address."},{status:500});
  if(is_default){
    const {error:defaultError}=await supabase.rpc("set_default_customer_address",{p_address_id:address.id});
    if(defaultError)return NextResponse.json({error:"Address saved, but could not set it as default."},{status:500});
  }
  return NextResponse.json({success:true,id:address.id});
}

export async function PATCH(request:Request){
  const {supabase,user}=await currentUser();
  if(!supabase)return NextResponse.json({error:"Store services are not configured yet."},{status:503});
  if(!user)return NextResponse.json({error:"Sign in to update your addresses."},{status:401});
  const parsed=updateSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Check the address details and try again."},{status:400});
  const {id,is_default,...values}=parsed.data;
  if(Object.values(values).some(value=>value!==undefined)){
    const {data,error}=await supabase.from("customer_addresses").update(values).eq("id",id).eq("user_id",user.id).select("id").maybeSingle();
    if(error)return NextResponse.json({error:"Could not update this address."},{status:500});
    if(!data)return NextResponse.json({error:"Address not found."},{status:404});
  }
  if(is_default===true){
    const {error}=await supabase.rpc("set_default_customer_address",{p_address_id:id});
    if(error)return NextResponse.json({error:"Could not set this address as default."},{status:500});
  }else if(is_default===false){
    const {error}=await supabase.from("customer_addresses").update({is_default:false}).eq("id",id).eq("user_id",user.id);
    if(error)return NextResponse.json({error:"Could not update the default address."},{status:500});
  }
  return NextResponse.json({success:true});
}

export async function DELETE(request:Request){
  const {supabase,user}=await currentUser();
  if(!supabase)return NextResponse.json({error:"Store services are not configured yet."},{status:503});
  if(!user)return NextResponse.json({error:"Sign in to manage your addresses."},{status:401});
  const parsed=z.object({id:z.string().uuid()}).safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Choose a valid address."},{status:400});
  const {error}=await supabase.from("customer_addresses").delete().eq("id",parsed.data.id).eq("user_id",user.id);
  if(error)return NextResponse.json({error:"Could not delete this address."},{status:500});
  return NextResponse.json({success:true});
}
