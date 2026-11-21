import { redirect } from "next/navigation";
import { CheckoutQuote } from "@/components/checkout-quote";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutPage(){
  const supabase=await createClient();
  if(!supabase)return <section className="page-section"><p className="simple-page-note">Checkout services are being configured.</p></section>;
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/auth/login");
  return <section className="page-section"><div className="cart-heading"><span className="eyebrow">Almost yours</span><h1>Checkout</h1><p>Confirm your delivery details and estimated shipping.</p></div><CheckoutQuote/></section>;
}
