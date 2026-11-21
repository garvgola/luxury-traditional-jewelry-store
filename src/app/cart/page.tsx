"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CartItem = { id:string; quantity:number; variantId:string; variantLabel:string; pricePaise:number; name:string; slug:string };
const money = (paise:number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);

export default function CartPage() {
  const [items,setItems] = useState<CartItem[]>([]); const [busy,setBusy] = useState(true);
  const [error,setError] = useState("");
  async function load() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/cart"); const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load your bag.");
      setItems(result.items || []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load your bag."); }
    finally { setBusy(false); }
  }
  useEffect(()=>{ void load(); },[]);
  async function update(itemId:string, quantity:number) {
    const response = await fetch("/api/cart",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({itemId,quantity})});
    const result=await response.json(); if(!response.ok){setError(result.error);return;} await load();
  }
  async function remove(itemId:string) {
    const response=await fetch("/api/cart",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({itemId})});
    const result=await response.json(); if(!response.ok){setError(result.error);return;} await load();
  }
  const total=items.reduce((sum,item)=>sum+item.pricePaise*item.quantity,0);
  return <section className="page-section cart-page">
    <div className="cart-heading"><span className="eyebrow">Your selection</span><h1>Your bag</h1><p>Pieces chosen to become part of your story.</p></div>
    {busy ? <p className="simple-page-note">Loading your bag…</p> : error ? <div className="empty-state"><p>{error}</p><Link href="/auth/login" className="text-link">Sign in to continue</Link></div> : items.length===0 ? <div className="empty-state"><span className="empty-ornament">✧</span><h2>Your bag is waiting</h2><p>Discover something meaningful in our collection.</p><Link href="/collections" className="button button-primary">Explore jewellery</Link></div> :
    <div className="cart-layout"><div className="cart-items">{items.map(item=><article className="cart-item" key={item.id}>
      <div className="cart-item-art">✧</div><div className="cart-item-info"><Link href={`/products/${item.slug}`}>{item.name}</Link><small>{item.variantLabel}</small><strong>{money(item.pricePaise)}</strong>
      <div className="quantity-control"><button onClick={()=>void update(item.id,Math.max(1,item.quantity-1))} aria-label="Decrease quantity">−</button><span>{item.quantity}</span><button onClick={()=>void update(item.id,Math.min(20,item.quantity+1))} aria-label="Increase quantity">+</button><button className="remove-item" onClick={()=>void remove(item.id)}>Remove</button></div></div>
      <strong>{money(item.pricePaise*item.quantity)}</strong></article>)}</div>
      <aside className="cart-summary"><h2>Order summary</h2><div><span>Subtotal</span><strong>{money(total)}</strong></div><p>Shipping is calculated from your delivery location at checkout. Final charges are shown before payment.</p><Link href="/checkout" className="button button-primary">Continue to checkout</Link></aside>
    </div>}
  </section>;
}
