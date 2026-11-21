"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminProductImageUpload({productId}:{productId:string}){
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [error,setError]=useState("");
  async function upload(file:File){
    setBusy(true);setMessage("");setError("");
    let storagePath="";
    try{
      if(file.size>10*1024*1024)throw new Error("Choose an image smaller than 10 MB.");
      if(!["image/jpeg","image/png","image/webp","image/avif"].includes(file.type))throw new Error("Use JPG, PNG, WebP or AVIF.");
      const extension=file.type==="image/jpeg"?"jpg":file.type.split("/")[1];
      storagePath=`products/${productId}/${crypto.randomUUID()}.${extension}`;
      const supabase=createClient();
      const {error:uploadError}=await supabase.storage.from("product-media").upload(storagePath,file,{contentType:file.type,cacheControl:"3600",upsert:false});
      if(uploadError)throw uploadError;
      const response=await fetch("/api/admin/products/images",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,storagePath,altText:file.name.replace(/.[^.]+$/,"")})});
      const result=await response.json();
      if(!response.ok){await supabase.storage.from("product-media").remove([storagePath]);throw new Error(result.error);}
      setMessage("Image uploaded. Refresh the page to preview it.");
    }catch(cause){setError(cause instanceof Error?cause.message:"Image upload failed.");}
    finally{setBusy(false);}
  }
  return <div className="admin-image-upload"><label>Product image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={event=>{const file=event.target.files?.[0];if(file)void upload(file);event.currentTarget.value="";}}/></label>{busy&&<small>Uploading…</small>}{message&&<small className="form-success">{message}</small>}{error&&<small className="form-error">{error}</small>}</div>;
}
