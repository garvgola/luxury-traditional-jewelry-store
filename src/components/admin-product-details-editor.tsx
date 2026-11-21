"use client";
import { useState } from "react";
type Category={id:string;name:string;is_active:boolean};
export function AdminProductDetailsEditor({productId,initialName,initialSlug,initialDescription,initialCategoryId,categories}:{productId:string;initialName:string;initialSlug:string;initialDescription:string|null;initialCategoryId:string|null;categories:Category[]}){
  const [name,setName]=useState(initialName);const [slug,setSlug]=useState(initialSlug);const [description,setDescription]=useState(initialDescription||"");const [categoryId,setCategoryId]=useState(initialCategoryId||"");
  const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  async function save(){
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/admin/products",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,name,slug,description,categoryId:categoryId||null})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);setMessage("Product details saved.");
    }catch(cause){setMessage(cause instanceof Error?cause.message:"Could not save product details.");}
    finally{setBusy(false);}
  }
  return <div className="admin-product-details-editor">
    <button type="button" className="admin-add-variant-toggle" onClick={()=>setOpen(value=>!value)}>{open?"Close product details":"Edit product details"}</button>
    {open&&<div className="admin-product-details-fields">
      <label>Product name<input value={name} maxLength={120} onChange={event=>setName(event.target.value)}/></label>
      <label>URL slug<input value={slug} maxLength={140} onChange={event=>setSlug(event.target.value)}/></label>
      <label>Description<textarea rows={3} value={description} maxLength={5000} onChange={event=>setDescription(event.target.value)}/></label>
      <label>Category<select value={categoryId} onChange={event=>setCategoryId(event.target.value)}><option value="">Uncategorized</option>{categories.filter(item=>item.is_active).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <button className="button button-primary" disabled={busy||!name.trim()||!slug.trim()} onClick={()=>void save()}>{busy?"Saving…":"Save product details"}</button>
      {message&&<small role="status">{message}</small>}
    </div>}
  </div>;
}
