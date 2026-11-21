import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const addSchema = z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(20).default(1) });

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
  if (!variant || !variant.is_active || (variant.products as {status:string}).status !== "active") {
    return NextResponse.json({ error: "This piece is currently unavailable." }, { status: 404 });
  }
  const { data: availability } = await supabase.from("product_availability")
    .select("availability").eq("variant_id", variantId).maybeSingle();
  if (availability?.availability === "temporarily_unavailable") {
    return NextResponse.json({ error: "This piece is temporarily unavailable to order." }, { status: 409 });
  }

  const { data: cart, error: cartError } = await supabase.from("carts")
    .upsert({ user_id: user.id }, { onConflict: "user_id" }).select("id").single();
  if (cartError || !cart) return NextResponse.json({ error: "Your bag could not be opened." }, { status: 500 });

  const { data: existing } = await supabase.from("cart_items").select("id,quantity")
    .eq("cart_id", cart.id).eq("variant_id", variantId).maybeSingle();
  const nextQuantity = Math.min(20, (existing?.quantity ?? 0) + quantity);
  const { error } = await supabase.from("cart_items").upsert(
    { cart_id: cart.id, variant_id: variantId, quantity: nextQuantity },
    { onConflict: "cart_id,variant_id" },
  );
  if (error) return NextResponse.json({ error: "We couldn't update your bag. Please try again." }, { status: 500 });
  return NextResponse.json({ success: true, quantity: nextQuantity });
}
