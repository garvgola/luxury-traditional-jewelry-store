import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createSchema=z.object({
  name:z.string().trim().min(2).max(100),
  slug:z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description:z.string().trim().max(1000).optional().default(""),
  sortOrder:z.number().int().min(0).max(10000).default(0),
});
const updateSchema=z.object({
  id:z.string().uuid(),name:z.string().trim().min(2).max(100).optional(),
  slug:z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description:z.string().trim().max(1000).optional(),sortOrder:z.number().int().min(0).max(10000).optional(),
  isActive:z.boolean().optional(),
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
  const {data,error}=await supabase.from("categories").select("id,name,slug,description,sort_order,is_active").order("sort_order").order("name");
  if(error)return NextResponse.json({error:"Could not load categories."},{status:500});
  return NextResponse.json({categories:data??[]});
}
export async function POST(request:Request){
  const {supabase,authorized}=await admin();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  if(!authorized)return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=createSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Check the category name and URL slug."},{status:400});
  const p=parsed.data;
  const {data,error}=await supabase.from("categories").insert({name:p.name,slug:p.slug,description:p.description,sort_order:p.sortOrder}).select("id").single();
  if(error)return NextResponse.json({error:error.message.includes("duplicate")?"That category name or URL slug already exists.":"Could not create category."},{status:400});
  return NextResponse.json({success:true,id:data.id});
}
export async function PATCH(request:Request){
  const {supabase,authorized}=await admin();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  if(!authorized)return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=updateSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid category update."},{status:400});
  const {id,...values}=parsed.data;
  const update={
    name:values.name,slug:values.slug,description:values.description,
    sort_order:values.sortOrder,is_active:values.isActive,
  };
  const clean=Object.fromEntries(Object.entries(update).filter(([,value])=>value!==undefined));
  const {error}=await supabase.from("categories").update(clean).eq("id",id);
  if(error)return NextResponse.json({error:"Could not update category."},{status:500});
  return NextResponse.json({success:true});
}
export async function DELETE(request:Request){
  const {supabase,authorized}=await admin();
  if(!supabase)return NextResponse.json({error:"Store services are not configured."},{status:503});
  if(!authorized)return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=z.object({id:z.string().uuid()}).safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Choose a valid category."},{status:400});
  const {error}=await supabase.from("categories").update({is_active:false}).eq("id",parsed.data.id);
  if(error)return NextResponse.json({error:"Could not deactivate category."},{status:500});
  return NextResponse.json({success:true});
}
