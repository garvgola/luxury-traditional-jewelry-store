import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/section-heading";
import { createClient } from "@/lib/supabase/server";

type ProductRow={
  id:string;name:string;slug:string;description:string|null;
  product_variants:{id:string;price_paise:number;is_active:boolean}[];
  product_images:{storage_path:string;alt_text:string;sort_order:number}[];
};
type ProductCard=ProductRow&{imageUrl?:string;imageAlt:string};
const allowed=["new-arrivals","earrings","necklaces","bangles","rings"];
const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);

export default async function CollectionPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  if(!allowed.includes(slug))notFound();
  const supabase=await createClient();
  const fallbackTitle=slug.split("-").map(word=>word[0].toUpperCase()+word.slice(1)).join(" ");
  if(!supabase)return <section className="page-section collection-page"><SectionHeading eyebrow="NAMO NAMO jewels" title={fallbackTitle} description="The catalogue will appear once the store database is configured."/><div className="catalogue-empty"><span className="catalogue-empty-mark">✧</span><h2>The collection is taking shape.</h2><p>Verified products and product photography will appear here once published.</p></div></section>;

  let title=fallbackTitle;
  let categoryId:string|null=null;
  if(slug!=="new-arrivals"){
    const {data:category}=await supabase.from("categories").select("id,name,description").eq("slug",slug).eq("is_active",true).maybeSingle();
    if(category){title=category.name;categoryId=category.id;}
  }
  let query=supabase.from("products").select("id,name,slug,description,product_variants(id,price_paise,is_active),product_images(storage_path,alt_text,sort_order)").eq("status","active");
  if(slug!=="new-arrivals")query=query.eq("category_id",categoryId??"00000000-0000-0000-0000-000000000000");
  const {data,error}=await query.order("created_at",{ascending:false});
  const rows=(data??[]) as unknown as ProductRow[];
  const cards:ProductCard[]=await Promise.all(rows.map(async product=>{
    const image=[...product.product_images].sort((a,b)=>a.sort_order-b.sort_order)[0];
    const {data:signed}=image?await supabase.storage.from("product-media").createSignedUrl(image.storage_path,3600):{data:null};
    return {...product,imageUrl:signed?.signedUrl,imageAlt:image?.alt_text||product.name};
  }));
  return <section className="page-section collection-page">
    <SectionHeading eyebrow="NAMO NAMO jewels" title={title} description="Explore pieces for celebrations, everyday rituals and everything in between."/>
    {error?<p className="simple-page-note">We could not load this collection. Please try again later.</p>:!cards.length?<div className="catalogue-empty"><span className="catalogue-empty-mark">✧</span><h2>The collection is taking shape.</h2><p>There are no published pieces in this collection yet.</p><Link href="/collections" className="text-link">Browse all collections</Link></div>:
    <div className="product-grid">{cards.map(product=>{
      const variant=product.product_variants.find(item=>item.is_active);
      return <Link href={`/products/${product.slug}`} className="product-card" key={product.id}>
        <div className={product.imageUrl?"product-card-art has-product-image":"product-card-art"} style={product.imageUrl?{backgroundImage:`url("${product.imageUrl}")`}:undefined} role={product.imageUrl?"img":undefined} aria-label={product.imageAlt}>{!product.imageUrl&&<><span>✧</span><small>NAMO NAMO JEWELS</small></>}</div>
        <div className="product-card-meta"><h3>{product.name}</h3>{variant&&<strong>{money(variant.price_paise)}</strong>}</div>
        <p>{product.description||"A considered heritage-inspired design."}</p>
      </Link>;
    })}</div>}
  </section>;
}
