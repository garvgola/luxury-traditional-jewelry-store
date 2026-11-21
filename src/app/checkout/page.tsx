import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutPage() {
  const supabase=await createClient();
  if(!supabase) return <section className="page-section"><div className="empty-state"><h1>Checkout is being configured</h1><p>Secure checkout will be enabled once the store payment and tax settings are configured.</p><Link href="/cart" className="text-link">Return to your bag</Link></div></section>;
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/auth/login");
  const {data:cart}=await supabase.from("carts").select("id").eq("user_id",user.id).maybeSingle();
  const {data:items}=cart ? await supabase.from("cart_items").select("id,quantity,product_variants(price_paise,products(name))").eq("cart_id",cart.id) : {data:[]};
  if(!items?.length) return <section className="page-section"><div className="empty-state"><h1>Your bag is empty</h1><Link href="/collections" className="button button-primary">Explore jewellery</Link></div></section>;
  return <section className="page-section"><div className="cart-heading"><span className="eyebrow">Almost yours</span><h1>Checkout</h1><p>Your items are saved. Secure payment is not active yet.</p></div><div className="empty-state"><h2>One final setup step</h2><p>Checkout will open after the owner configures verified shipping zones, tax/invoice treatment and Razorpay test credentials. We will not collect payment or show a false payment success before those settings are verified.</p><Link href="/cart" className="text-link">Review your bag</Link></div></section>;
}
