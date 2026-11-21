import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { createClient } from "@/lib/supabase/server";

type ProductCardRow = {
  id: string; name: string; slug: string; description: string | null;
  product_variants: { id: string; price_paise: number; is_active: boolean }[];
  product_images: { storage_path:string; alt_text:string; sort_order:number }[];
};
type ProductCardWithImage = ProductCardRow & { imageUrl?: string; imageAlt: string };
const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);

export default async function CollectionsPage() {
  const supabase=await createClient();
  if(!supabase) return <section className="page-section"><SectionHeading eyebrow="Explore the edit" title="The collections" description="Our catalogue is being prepared. Please return soon." /></section>;
  const {data:products,error}=await supabase.from("products")
    .select("id,name,slug,description,product_variants(id,price_paise,is_active),product_images(storage_path,alt_text,sort_order)")
    .eq("status","active").order("created_at",{ascending:false});
  const cards: ProductCardWithImage[] = await Promise.all(((products ?? []) as unknown as ProductCardRow[]).map(async (product) => {
    const image = [...(product.product_images ?? [])].sort((a,b)=>a.sort_order-b.sort_order)[0];
    const { data } = image ? await supabase.storage.from("product-media").createSignedUrl(image.storage_path,3600) : { data:null };
    return { ...product, imageUrl:data?.signedUrl, imageAlt:image?.alt_text || product.name };
  }));
  return <section className="page-section collection-page">
    <SectionHeading eyebrow="Explore the edit" title="The collections" description="Discover pieces shaped by heritage, detail and a contemporary point of view." />
    {error ? <p className="simple-page-note">We could not load the collection just now. Please try again later.</p> : !products?.length ? <div className="empty-state"><span className="empty-ornament">✧</span><h2>Something beautiful is taking shape</h2><p>Our first collection will appear here as soon as the verified catalogue is published.</p></div> :
    <div className="product-grid">{cards.map((product)=>{
      const variant=product.product_variants?.find((v)=>v.is_active);
      return <Link href={`/products/${product.slug}`} className="product-card" key={product.id}>
        <div className={product.imageUrl?"product-card-art has-product-image":"product-card-art"} style={product.imageUrl?{backgroundImage:`url("${product.imageUrl}")`}:undefined} role={product.imageUrl?"img":undefined} aria-label={product.imageAlt}>{!product.imageUrl&&<><span>✧</span><small>NAMO NAMO JEWELS</small></>}</div>
        <div className="product-card-meta"><h3>{product.name}</h3>{variant&&<strong>{money(variant.price_paise)}</strong>}</div>
        <p>{product.description || "A considered heritage-inspired design."}</p>
      </Link>;
    })}</div>}
  </section>;
}
