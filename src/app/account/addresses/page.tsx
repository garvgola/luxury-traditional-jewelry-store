import Link from "next/link";
import { redirect } from "next/navigation";
import { AddressManager } from "@/components/address-manager";
import { createClient } from "@/lib/supabase/server";

export default async function AddressesPage(){
  const supabase=await createClient();
  if(!supabase)return <section className="page-section"><p className="simple-page-note">Account services are being configured.</p></section>;
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/auth/login?next=/account/addresses");
  return <section className="page-section">
    <div className="cart-heading"><span className="eyebrow">Your account</span><h1>Delivery addresses</h1><p>Keep your delivery details up to date.</p></div>
    <AddressManager/>
    <p className="account-back"><Link href="/account" className="text-link">Back to your account</Link></p>
  </section>;
}
