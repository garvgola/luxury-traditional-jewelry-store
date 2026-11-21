import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { createClient } from "@/lib/supabase/server";

type ProductRow={
  id:string;name:string;slug:string;description:string|null;
  product_variants:{id:string;price_paise:number;is_active:boolean}[];
  product_images:{storage_path:string;alt_text:string;sort_order:number}[];
};
type ProductCard=ProductRow&{imageUrl?:string;imageAlt:string};
const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);

export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}){
  const {q=""}=await searchParams;
  const term=q.trim().slice(0,80);
  const supabase=await createClient();
  if(!supabase)return <section className="page-section search-page"><SectionHeading eyebrow="Find your piece" title="Search the collection" description="Product search will be available when the store database is configured."/><form action="/search" method="get" className="catalogue-search"><input name="q" defaultValue={term} placeholder="Search jewellery by name…" aria-label="Search jewellery"/><button className="button button-primary">Search</button></form></section>;
  let rows:ProductRow[]=[];
  let error=false;
  if(term){
    const escaped=term.replace(/[\\%_]/g,"\\$&");
    const pattern=`%${escaped}%`;
    const [nameResult,descriptionResult]=await Promise.all([
      supabase.from("products").select("id,name,slug,description,product_variants(id,price_paise,is_active),product_images(storage_path,alt_text,sort_order)").eq("status","active").ilike("name",pattern).limit(40),
      supabase.from("products").select("id,name,slug,description,product_variants(id,price_paise,is_active),product_images(storage_path,alt_text,sort_order)").eq("status","active").ilike("description",pattern).limit(40),
    ]);
    error=Boolean(nameResult.error||descriptionResult.error);
    const unique=new Map<string,ProductRow>();
    for(const product of [...(nameResult.data??[]),...(descriptionResult.data??[])])unique.set(product.id,product as unknown as ProductRow);
    rows=[...unique.values()].slice(0,60);
  }
  const cards:ProductCard[]=await Promise.all(rows.map(async product=>{
    const image=[...product.product_images].sort((a,b)=>a.sort_order-b.sort_order)[0];
    const {data:signed}=image?await supabase.storage.from("product-media").createSignedUrl(image.storage_path,3600):{data:null};
    return {...product,imageUrl:signed?.signedUrl,imageAlt:image?.alt_text||product.name};
  }));
  return <section className="page-section search-page">
    <SectionHeading eyebrow="Find your piece" title="Search the collection" description="Search published jewellery by product name or description."/>
    <form action="/search" method="get" className="catalogue-search"><input name="q" defaultValue={term} placeholder="Search jewellery by name…" aria-label="Search jewellery"/><button className="button button-primary">Search</button></form>
    {!term?<div className="catalogue-empty"><h2>What are you looking for?</h2><p>Try a product name or a detail from its description.</p></div>:error?<p className="simple-page-note">Search is temporarily unavailable. Please try again.</p>:!cards.length?<div className="catalogue-empty"><h2>No pieces found</h2><p>Try a different search term or browse all collections.</p><Link href="/collections" className="text-link">Explore the collection</Link></div>:
    <><p className="search-result-count">{cards.length} result{cards.length===1?"":"s"} for “{term}”</p><div className="product-grid">{cards.map(product=>{
      const variant=product.product_variants.find(item=>item.is_active);
      return <Link href={`/products/${product.slug}`} className="product-card" key={product.id}>
        <div className={product.imageUrl?"product-card-art has-product-image":"product-card-art"} style={product.imageUrl?{backgroundImage:`url("${product.imageUrl}")`}:undefined} role={product.imageUrl?"img":undefined} aria-label={product.imageAlt}>{!product.imageUrl&&<><span>✧</span><small>NAMO NAMO JEWELS</small></>}</div>
        <div className="product-card-meta"><h3>{product.name}</h3>{variant&&<strong>{money(variant.price_paise)}</strong>}</div><p>{product.description||"A considered heritage-inspired design."}</p>
      </Link>;
    })}</div></>}
  </section>;
}
