import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { AddToWishlistButton } from "@/components/add-to-wishlist-button";
import { ProductGallery } from "@/components/product-gallery";
import { createClient } from "@/lib/supabase/server";

type ProductPageProps = { params: Promise<{ slug: string }> };
const money = (paise: number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  if (!supabase) return <section className="page-section"><p className="simple-page-note">Product services are being configured. Please check back soon.</p></section>;
  const { data: product } = await supabase.from("products").select(`
    id,name,slug,description,category_id,
    product_variants(id,variant_label,price_paise,compare_at_price_paise,is_active,hsn_code,gst_rate_bps,price_includes_tax,product_availability(availability,estimated_lead_days_min,estimated_lead_days_max,customer_note)),
    product_images(id,storage_path,alt_text,sort_order)
  `).eq("slug",slug).eq("status","active").maybeSingle();
  if (!product) notFound();
  const sortedImages=[...(product.product_images??[])].sort((a,b)=>a.sort_order-b.sort_order);
  const galleryImages=await Promise.all(sortedImages.map(async image=>{
    const {data}=await supabase.storage.from("product-media").createSignedUrl(image.storage_path,3600);
    return data?.signedUrl?{url:data.signedUrl,alt:image.alt_text||product.name}:null;
  }));
  const variant = product.product_variants?.find((item: {is_active:boolean})=>item.is_active);
  const availabilityRows = variant?.product_availability;
  const availability = Array.isArray(availabilityRows) ? availabilityRows[0] : availabilityRows;
  return <section className="product-detail page-section">
    <ProductGallery images={galleryImages.filter((image):image is {url:string;alt:string}=>image!==null)} productName={product.name}/>
    <div className="product-information">
      <Link href="/collections" className="eyebrow">The collection</Link>
      <h1>{product.name}</h1>
      {variant && <><p className="product-price">{money(variant.price_paise)}</p><p className="product-tax-note">{variant.price_includes_tax===true?"Inclusive of GST":variant.price_includes_tax===false?"GST calculated at checkout":"Tax details being confirmed"}</p></> }
      <p className="product-description">{product.description || "A heritage-inspired piece from the NAMO NAMO collection."}</p>
      <p className="availability-note">{availability?.availability === "made_to_order" ? "Made to order" : availability?.availability === "temporarily_unavailable" ? "Temporarily unavailable" : "Available to order"}</p>
      {availability?.customer_note && <p>{availability.customer_note}</p>}
      {availability?.estimated_lead_days_min != null && <p className="delivery-note">Estimated preparation: {availability.estimated_lead_days_min}{availability.estimated_lead_days_max ? `–${availability.estimated_lead_days_max}` : ""} days. Delivery estimates are indicative.</p>}
      {variant ? <AddToCartButton variantId={variant.id} disabled={availability?.availability === "temporarily_unavailable"} /> : <p className="simple-page-note">This piece is not available to order at the moment.</p>}
      <AddToWishlistButton productId={product.id} />
    </div>
  </section>;
}
