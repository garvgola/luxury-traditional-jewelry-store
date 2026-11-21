"use client";

import { FormEvent,useState } from "react";
import { AdminProductImageUpload } from "@/components/admin-product-image-upload";
import { AdminVariantTaxEditor } from "@/components/admin-variant-tax-editor";
import { AdminVariantPriceEditor } from "@/components/admin-variant-price-editor";
import { AdminProductImageManager } from "@/components/admin-product-image-manager";
import { AdminAddVariant } from "@/components/admin-add-variant";
import { AdminProductDetailsEditor } from "@/components/admin-product-details-editor";

type Availability="available_to_order"|"made_to_order"|"temporarily_unavailable";
type AdminCategory={id:string;name:string;is_active:boolean};
type AdminProduct={
  id:string;name:string;slug:string;description:string|null;status:string;category_id:string|null;
  product_images:{id:string;storage_path:string;alt_text:string;sort_order:number;imageUrl?:string}[];
  product_variants:{
    id:string;variant_label:string;sku:string|null;price_paise:number;is_active:boolean;hsn_code:string|null;gst_rate_bps:number|null;price_includes_tax:boolean|null;
    product_availability:{availability:Availability}[]|{availability:Availability}|null;
  }[];
};
const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);
const availabilityLabel:Record<Availability,string>={
  available_to_order:"Available to order",made_to_order:"Made to order",temporarily_unavailable:"Temporarily unavailable",
};

export function AdminProductManager({products:initial,categories}:{products:AdminProduct[];categories:AdminCategory[]}){
  const [products,setProducts]=useState(initial);
  const [name,setName]=useState("");const [slug,setSlug]=useState("");const [description,setDescription]=useState("");
  const [price,setPrice]=useState("");const [sku,setSku]=useState("");const [categoryId,setCategoryId]=useState("");
  const [hsnCode,setHsnCode]=useState("");const [gstRate,setGstRate]=useState("");const [priceIncludesTax,setPriceIncludesTax]=useState<boolean|null>(null);const [availability,setAvailability]=useState<Availability>("available_to_order");
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("");

  function changeName(value:string){setName(value);setSlug(value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));}
  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");setMessage("");
    const priceNumber=Number(price);
    if(!Number.isFinite(priceNumber)||priceNumber<=0){setError("Enter a valid price in rupees.");setBusy(false);return;}
    if(!hsnCode||!gstRate||priceIncludesTax===null){setError("Enter the accountant-confirmed HSN, GST rate and tax treatment.");setBusy(false);return;}
    try{
      const response=await fetch("/api/admin/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        name,slug,description,categoryId:categoryId||null,pricePaise:Math.round(priceNumber*100),sku,variantLabel:"Default",availability,
        hsnCode,gstRateBps:Math.round(Number(gstRate)*100),priceIncludesTax:priceIncludesTax===true,
      })});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setMessage("Product created. Refreshing catalogue…");window.location.reload();
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not create product.");}
    finally{setBusy(false);}
  }
  async function updateAvailability(variantId:string,value:Availability){
    const response=await fetch("/api/admin/products",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({variantId,availability:value})});
    const result=await response.json();if(!response.ok){setError(result.error);return;}
    setProducts(current=>current.map(product=>({...product,product_variants:product.product_variants.map(variant=>variant.id===variantId?{...variant,product_availability:{availability:value}}:variant)})));
    setMessage("Availability updated.");
  }
  async function archive(productId:string){
    const response=await fetch("/api/admin/products",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId})});
    const result=await response.json();if(!response.ok){setError(result.error);return;}
    setProducts(current=>current.map(product=>product.id===productId?{...product,status:"archived"}:product));
    setMessage("Product archived.");
  }

  return <div className="admin-products">
    <form className="admin-product-form" onSubmit={create}>
      <h2>Add a product</h2>
      <label>Product name<input required value={name} onChange={event=>changeName(event.target.value)}/></label>
      <label>URL slug<input required value={slug} onChange={event=>setSlug(event.target.value)}/></label>
      <label>Description<textarea value={description} onChange={event=>setDescription(event.target.value)} rows={3}/></label>
      <label>Category<select value={categoryId} onChange={event=>setCategoryId(event.target.value)}><option value="">Uncategorized</option>{categories.filter(category=>category.is_active).map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <div className="admin-form-row"><label>Price (₹)<input required type="number" min="0.01" step="0.01" value={price} onChange={event=>setPrice(event.target.value)}/></label><label>SKU (optional)<input value={sku} onChange={event=>setSku(event.target.value)}/></label></div>
      <div className="admin-form-row"><label>HSN code<input required inputMode="numeric" pattern="[0-9]{4,8}" value={hsnCode} onChange={event=>setHsnCode(event.target.value)} placeholder="4–8 digit HSN"/></label><label>GST rate (%)<input required type="number" min="0" max="28" step="0.01" value={gstRate} onChange={event=>setGstRate(event.target.value)} placeholder="As confirmed by accountant"/></label></div>
      <label>Product price tax treatment<select required value={priceIncludesTax===null?"":priceIncludesTax?"inclusive":"exclusive"} onChange={event=>setPriceIncludesTax(event.target.value===""?null:event.target.value==="inclusive")}><option value="" disabled>Choose accountant-confirmed treatment</option><option value="inclusive">Listed price includes GST</option><option value="exclusive">GST added to listed price</option></select></label>
      <p className="admin-form-hint">Enter the HSN, applicable GST rate and whether the listed price includes GST exactly as confirmed by your accountant. These values are saved with the product variant.</p>
      <label>Availability<select value={availability} onChange={event=>setAvailability(event.target.value as Availability)}><option value="available_to_order">Available to order</option><option value="made_to_order">Made to order</option><option value="temporarily_unavailable">Temporarily unavailable</option></select></label>
      {error&&<p className="form-error" role="alert">{error}</p>}{message&&<p className="form-success" role="status">{message}</p>}
      <button className="button button-primary" disabled={busy}>{busy?"Saving…":"Create product"}</button>
    </form>
    <div className="admin-product-list"><h2>Catalogue</h2>{products.length===0?<p>No products have been added yet.</p>:products.map(product=><article className="admin-product-row" key={product.id}>
      <div><strong>{product.name}</strong><small>/{product.slug} · {product.status}</small><AdminProductDetailsEditor productId={product.id} initialName={product.name} initialSlug={product.slug} initialDescription={product.description} initialCategoryId={product.category_id} categories={categories}/><AdminProductImageUpload productId={product.id}/><AdminProductImageManager images={product.product_images}/><AdminAddVariant productId={product.id} onCreated={()=>window.location.reload()}/>
        {product.product_variants.map(variant=>{
          const availabilityRow=variant.product_availability;
          const current=Array.isArray(availabilityRow)?availabilityRow[0]?.availability:availabilityRow?.availability;
          return <div className="admin-variant-row" key={variant.id}><span>{money(variant.price_paise)} · {variant.variant_label}</span><select value={current||"available_to_order"} onChange={event=>void updateAvailability(variant.id,event.target.value as Availability)}>{Object.entries(availabilityLabel).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>;
        })}
        {product.product_variants.map(variant=><AdminVariantPriceEditor key={variant.id} variantId={variant.id} pricePaise={variant.price_paise} sku={variant.sku} variantLabel={variant.variant_label}/>)}
        {product.product_variants.map(variant=><AdminVariantTaxEditor key={variant.id} variantId={variant.id} hsnCode={variant.hsn_code} gstRateBps={variant.gst_rate_bps} priceIncludesTax={variant.price_includes_tax}/>)}
      </div>
      {product.status!=="archived"&&<button className="admin-archive" onClick={()=>void archive(product.id)}>Archive</button>}
    </article>)}</div>
  </div>;
}
