import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const addSchema = z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(20).default(1) });
const itemSchema = z.object({ itemId: z.string().uuid(), quantity: z.number().int().min(1).max(20).optional() });

async function getCustomerCart(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>, userId: string) {
  return supabase.from("carts").upsert({ user_id: userId }, { onConflict: "user_id" }).select("id").single();
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Store services are not configured yet." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your bag." }, { status: 401 });
  const { data: cart } = await getCustomerCart(supabase, user.id);
  if (!cart) return NextResponse.json({ items: [], totalPaise: 0 });
  const { data, error } = await supabase.from("cart_items")
    .select("id,quantity,product_variants!inner(id,variant_label,price_paise,products!inner(name,slug,status))")
    .eq("cart_id", cart.id);
  if (error) return NextResponse.json({ error: "Your bag could not be loaded." }, { status: 500 });
  const items = (data ?? []).map((item: any) => ({
    id: item.id, quantity: item.quantity, variantId: item.product_variants.id,
    variantLabel: item.product_variants.variant_label, pricePaise: item.product_variants.price_paise,
    name: item.product_variants.products.name, slug: item.product_variants.products.slug,
  }));
  return NextResponse.json({ items, totalPaise: items.reduce((sum: number, item: any) => sum + item.pricePaise * item.quantity, 0) });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Store services are not configured yet." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before adding items to your bag." }, { status: 401 });
  const parsed = addSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please choose a valid product and quantity." }, { status: 400 });

  const { variantId, quantity } = parsed.data;
  const { data: variant } = await supabase.from("product_variants")
    .select("id,is_active,products!inner(status)").eq("id", variantId).maybeSingle();
  const relatedProduct = Array.isArray(variant?.products) ? variant.products[0] : variant?.products;
  if (!variant || !variant.is_active || relatedProduct?.status !== "active") {
    return NextResponse.json({ error: "This piece is currently unavailable." }, { status: 404 });
  }
  const { data: availability } = await supabase.from("product_availability")
    .select("availability").eq("variant_id", variantId).maybeSingle();
  if (availability?.availability === "temporarily_unavailable") {
    return NextResponse.json({ error: "This piece is temporarily unavailable to order." }, { status: 409 });
  }

  const { data: cart, error: cartError } = await getCustomerCart(supabase, user.id);
  if (cartError || !cart) return NextResponse.json({ error: "Your bag could not be opened." }, { status: 500 });
  const { data: existing } = await supabase.from("cart_items").select("id,quantity")
    .eq("cart_id", cart.id).eq("variant_id", variantId).maybeSingle();
  const nextQuantity = Math.min(20, (existing?.quantity ?? 0) + quantity);
  const { error } = await supabase.from("cart_items").upsert(
    { cart_id: cart.id, variant_id: variantId, quantity: nextQuantity }, { onConflict: "cart_id,variant_id" },
  );
  if (error) return NextResponse.json({ error: "We couldn't update your bag. Please try again." }, { status: 500 });
  return NextResponse.json({ success: true, quantity: nextQuantity });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Store services are not configured yet." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your bag." }, { status: 401 });
  const parsed = itemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.quantity === undefined) return NextResponse.json({ error: "Invalid bag update." }, { status: 400 });
  const { data: cart } = await getCustomerCart(supabase, user.id);
  if (!cart) return NextResponse.json({ error: "Bag not found." }, { status: 404 });
  const { error } = await supabase.from("cart_items").update({ quantity: parsed.data.quantity })
    .eq("id", parsed.data.itemId).eq("cart_id", cart.id);
  if (error) return NextResponse.json({ error: "Could not update this item." }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Store services are not configured yet." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your bag." }, { status: 401 });
  const parsed = itemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid bag item." }, { status: 400 });
  const { data: cart } = await getCustomerCart(supabase, user.id);
  if (!cart) return NextResponse.json({ success: true });
  const { error } = await supabase.from("cart_items").delete().eq("id", parsed.data.itemId).eq("cart_id", cart.id);
  if (error) return NextResponse.json({ error: "Could not remove this item." }, { status: 500 });
  return NextResponse.json({ success: true });
}
