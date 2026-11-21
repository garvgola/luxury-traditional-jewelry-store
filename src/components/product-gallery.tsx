"use client";
import { useState } from "react";
type Image={url:string;alt:string};
export function ProductGallery({images,productName}:{images:Image[];productName:string}){
  const [active,setActive]=useState(0);
  if(!images.length)return <div className="product-visual"><div className="product-placeholder"><span>✧</span><small>NAMO NAMO JEWELS</small></div></div>;
  const current=images[active]||images[0];
  return <div className="product-gallery">
    <div className="product-gallery-main">
      <img src={current.url} alt={current.alt||productName}/>
      {images.length>1&&<><button type="button" aria-label="Previous product image" onClick={()=>setActive(value=>(value-1+images.length)%images.length)}>‹</button><button type="button" aria-label="Next product image" onClick={()=>setActive(value=>(value+1)%images.length)}>›</button><span>{active+1} / {images.length}</span></>}
    </div>
    {images.length>1&&<div className="product-gallery-thumbnails" aria-label="Product images">{images.map((image,index)=><button type="button" key={image.url} aria-label={`Show image ${index+1}`} aria-pressed={active===index} onClick={()=>setActive(index)}><img src={image.url} alt=""/></button>)}</div>}
  </div>;
}
