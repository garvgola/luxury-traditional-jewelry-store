import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const productSchema=z.object({productId:z.string().uuid()});
type WishlistProduct = {
  id:string; name:string; slug:string; description:string|null;
  product_variants:{id:string;price_paise:number;is_active:boolean}[];
};
type WishlistRow = {product_id:string;products:WishlistProduct|WishlistProduct[]};

async function getWishlist(supabase:NonNullable<Awaited<ReturnType<typeof createClient>>>,userId:string) {
  return supabase.from("wishlists").upsert({user_id:userId},{onConflict:"user_id"}).select("id").single();
}

export async function GET() {
  const supabase=await createClient();
  if(!supabase) return NextResponse.json({error:"Store services are not configured yet."},{status:503});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return NextResponse.json({error:"Sign in to view your wishlist."},{status:401});
  const {data:wishlist}=await getWishlist(supabase,user.id);
  if(!wishlist) return NextResponse.json({items:[]});
  const {data,error}=await supabase.from("wishlist_items")
    .select("product_id,products!inner(id,name,slug,description,product_variants(id,price_paise,is_active))")
    .eq("wishlist_id",wishlist.id);
  if(error) return NextResponse.json({error:"Your wishlist could not be loaded."},{status:500});
  const rows=(data??[]) as unknown as WishlistRow[];
  const items=rows.flatMap(row=>{
    const product=Array.isArray(row.products)?row.products[0]:row.products;
    if(!product) return [];
    const variant=product.product_variants.find(item=>item.is_active);
    return [{id:product.id,name:product.name,slug:product.slug,description:product.description,pricePaise:variant?.price_paise??null}];
  });
  return NextResponse.json({items});
}

export async function POST(request:Request) {
  const supabase=await createClient();
  if(!supabase) return NextResponse.json({error:"Store services are not configured yet."},{status:503});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return NextResponse.json({error:"Sign in to save favourites."},{status:401});
  const parsed=productSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({error:"Choose a valid product."},{status:400});
  const {data:product}=await supabase.from("products").select("id").eq("id",parsed.data.productId).eq("status","active").maybeSingle();
  if(!product) return NextResponse.json({error:"This product is no longer available."},{status:404});
  const {data:wishlist,error:wishlistError}=await getWishlist(supabase,user.id);
  if(wishlistError||!wishlist) return NextResponse.json({error:"Your wishlist could not be opened."},{status:500});
  const {error}=await supabase.from("wishlist_items").upsert(
    {wishlist_id:wishlist.id,product_id:product.id},{onConflict:"wishlist_id,product_id",ignoreDuplicates:true},
  );
  if(error) return NextResponse.json({error:"Could not save this product."},{status:500});
  return NextResponse.json({success:true});
}

export async function DELETE(request:Request) {
  const supabase=await createClient();
  if(!supabase) return NextResponse.json({error:"Store services are not configured yet."},{status:503});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return NextResponse.json({error:"Sign in to manage favourites."},{status:401});
  const parsed=productSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({error:"Choose a valid product."},{status:400});
  const {data:wishlist}=await getWishlist(supabase,user.id);
  if(!wishlist) return NextResponse.json({success:true});
  const {error}=await supabase.from("wishlist_items").delete().eq("wishlist_id",wishlist.id).eq("product_id",parsed.data.productId);
  if(error) return NextResponse.json({error:"Could not remove this product."},{status:500});
  return NextResponse.json({success:true});
}
