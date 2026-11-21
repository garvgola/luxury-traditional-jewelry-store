"use client";

import Link from "next/link";
import { useEffect,useState } from "react";

type Item={id:string;name:string;slug:string;description:string|null;pricePaise:number|null};
const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);

export default function WishlistPage() {
  const [items,setItems]=useState<Item[]>([]); const [busy,setBusy]=useState(true); const [error,setError]=useState("");
  async function load() {
    setBusy(true);setError("");
    try { const response=await fetch("/api/wishlist");const result=await response.json();if(!response.ok)throw new Error(result.error);setItems(result.items||[]); }
    catch(cause){setError(cause instanceof Error?cause.message:"Unable to load your wishlist.");}
    finally{setBusy(false);}
  }
  useEffect(()=>{void load();},[]);
  async function remove(productId:string) {
    const response=await fetch("/api/wishlist",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId})});
    const result=await response.json();if(!response.ok){setError(result.error);return;}await load();
  }
  return <section className="page-section wishlist-page"><div className="cart-heading"><span className="eyebrow">Saved with care</span><h1>Your wishlist</h1><p>Keep the pieces you love close at hand.</p></div>
    {busy?<p className="simple-page-note">Loading your wishlist…</p>:error?<div className="empty-state"><p>{error}</p><Link href="/auth/login" className="text-link">Sign in</Link></div>:!items.length?<div className="empty-state"><span className="empty-ornament">♡</span><h2>Your favourites live here</h2><p>Save a piece from any product page and return to it whenever you like.</p><Link href="/collections" className="button button-primary">Explore jewellery</Link></div>:
    <div className="product-grid">{items.map(item=><article className="product-card" key={item.id}><Link href={`/products/${item.slug}`}><div className="product-card-art"><span>✧</span><small>NAMO NAMO JEWELS</small></div><div className="product-card-meta"><h3>{item.name}</h3>{item.pricePaise!==null&&<strong>{money(item.pricePaise)}</strong>}</div></Link><p>{item.description||"A considered heritage-inspired design."}</p><button className="text-link" onClick={()=>void remove(item.id)}>Remove from wishlist</button></article>)}</div>}
  </section>;
}
