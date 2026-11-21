import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductVariantSelector } from "@/components/product-variant-selector";
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
  return <section className="product-detail page-section">
    <ProductGallery images={galleryImages.filter((image):image is {url:string;alt:string}=>image!==null)} productName={product.name}/>
    <div className="product-information">
      <Link href="/collections" className="eyebrow">The collection</Link>
      <h1>{product.name}</h1>
      <p className="product-description">{product.description || "A heritage-inspired piece from the NAMO NAMO collection."}</p>
      <ProductVariantSelector variants={product.product_variants}/>
      <AddToWishlistButton productId={product.id} />
    </div>
  </section>;
}
