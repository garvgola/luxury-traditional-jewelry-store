"use client";
import { useState } from "react";
type Image={id:string;alt_text:string;sort_order:number;imageUrl?:string};
export function AdminProductImageManager({images:initial}:{images:Image[]}){
  const [images,setImages]=useState([...initial].sort((a,b)=>a.sort_order-b.sort_order));
  const [alts,setAlts]=useState<Record<string,string>>(()=>Object.fromEntries(initial.map(image=>[image.id,image.alt_text||""])));
  const [busy,setBusy]=useState("");const [message,setMessage]=useState("");const [error,setError]=useState("");
  async function patch(imageId:string,values:{altText?:string;sortOrder?:number}){
    const response=await fetch("/api/admin/products/images",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({imageId,...values})});
    const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not update image.");
  }
  async function saveAlt(image:Image){
    setBusy(image.id);setError("");setMessage("");
    try{await patch(image.id,{altText:alts[image.id]||""});setMessage("Image description saved.");}
    catch(cause){setError(cause instanceof Error?cause.message:"Could not save image description.");}
    finally{setBusy("");}
  }
  async function move(index:number,direction:-1|1){
    const target=index+direction;if(target<0||target>=images.length)return;
    const next=[...images];[next[index],next[target]]=[next[target],next[index]];
    setBusy("reorder");setError("");setMessage("");
    try{
      await Promise.all(next.map((image,position)=>patch(image.id,{sortOrder:(position+1)*10})));
      setImages(next.map((image,position)=>({...image,sort_order:(position+1)*10})));
      setMessage("Gallery order saved.");
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not reorder images.");}
    finally{setBusy("");}
  }
  async function remove(image:Image){
    if(!window.confirm("Remove this product image?"))return;
    setBusy(image.id);setError("");setMessage("");
    try{
      const response=await fetch("/api/admin/products/images",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({imageId:image.id})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not remove image.");
      setImages(current=>current.filter(item=>item.id!==image.id));setMessage(result.warning||"Image removed.");
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not remove image.");}
    finally{setBusy("");}
  }
  if(!images.length)return <p className="admin-image-empty">No product images uploaded yet.</p>;
  return <div className="admin-image-manager">
    {images.map((image,index)=><article className="admin-image-row" key={image.id}>
      {image.imageUrl?<img src={image.imageUrl} alt={image.alt_text||"Product image preview"}/>:<div className="admin-image-missing">Preview unavailable</div>}
      <div className="admin-image-fields"><label>Image alt text<input value={alts[image.id]??""} maxLength={250} onChange={event=>setAlts(current=>({...current,[image.id]:event.target.value}))}/></label>
        <div className="admin-image-actions"><button type="button" disabled={busy!==""||index===0} onClick={()=>void move(index,-1)} aria-label="Move image up">↑</button><button type="button" disabled={busy!==""||index===images.length-1} onClick={()=>void move(index,1)} aria-label="Move image down">↓</button><button type="button" disabled={busy!==""} onClick={()=>void saveAlt(image)}>{busy===image.id?"Saving…":"Save alt text"}</button><button type="button" disabled={busy!==""} onClick={()=>void remove(image)}>Remove</button></div>
      </div>
    </article>)}
    {message&&<p className="form-success" role="status">{message}</p>}{error&&<p className="form-error" role="alert">{error}</p>}
  </div>;
}
