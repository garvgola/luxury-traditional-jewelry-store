import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { createClient } from "@/lib/supabase/server";

type ProductPageProps = { params: Promise<{ slug: string }> };
const money = (paise: number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  if (!supabase) return <section className="page-section"><p className="simple-page-note">Product services are being configured. Please check back soon.</p></section>;
  const { data: product } = await supabase.from("products").select(`
    id,name,slug,description,category_id,
    product_variants(id,variant_label,price_paise,compare_at_price_paise,is_active,product_availability(availability,estimated_lead_days_min,estimated_lead_days_max,customer_note)),
    product_images(id,storage_path,alt_text,sort_order)
  `).eq("slug",slug).eq("status","active").maybeSingle();
  if (!product) notFound();
  const variant = product.product_variants?.find((item: {is_active:boolean})=>item.is_active);
  const availability = variant?.product_availability?.[0];
  return <section className="product-detail page-section">
    <div className="product-visual"><div className="product-placeholder"><span>✧</span><small>NAMO NAMO JEWELS</small></div></div>
    <div className="product-information">
      <Link href="/collections" className="eyebrow">The collection</Link>
      <h1>{product.name}</h1>
      {variant && <p className="product-price">{money(variant.price_paise)}</p>}
      <p className="product-description">{product.description || "A heritage-inspired piece from the NAMO NAMO collection."}</p>
      <p className="availability-note">{availability?.availability === "made_to_order" ? "Made to order" : availability?.availability === "temporarily_unavailable" ? "Temporarily unavailable" : "Available to order"}</p>
      {availability?.customer_note && <p>{availability.customer_note}</p>}
      {availability?.estimated_lead_days_min != null && <p className="delivery-note">Estimated preparation: {availability.estimated_lead_days_min}{availability.estimated_lead_days_max ? `–${availability.estimated_lead_days_max}` : ""} days. Delivery estimates are indicative.</p>}
      {variant ? <AddToCartButton variantId={variant.id} disabled={availability?.availability === "temporarily_unavailable"} /> : <p className="simple-page-note">This piece is not available to order at the moment.</p>}
    </div>
  </section>;
}
