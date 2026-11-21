"use client";

import { FormEvent,useState } from "react";

type Category={id:string;name:string;slug:string;description:string|null;sort_order:number;is_active:boolean};
export function AdminCategoryManager({initial}:{initial:Category[]}){
  const [categories,setCategories]=useState(initial);const [name,setName]=useState("");const [slug,setSlug]=useState("");const [description,setDescription]=useState("");
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("");
  function changeName(value:string){setName(value);setSlug(value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));}
  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");setMessage("");
    try{
      const response=await fetch("/api/admin/categories",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,slug,description,sortOrder:categories.length})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setMessage("Category created.");window.location.reload();
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not create category.");}
    finally{setBusy(false);}
  }
  async function toggle(category:Category){
    const response=await fetch("/api/admin/categories",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:category.id,isActive:!category.is_active})});
    const result=await response.json();if(!response.ok){setError(result.error);return;}
    setCategories(current=>current.map(item=>item.id===category.id?{...item,is_active:!item.is_active}:item));
  }
  async function deactivate(id:string){
    const response=await fetch("/api/admin/categories",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    const result=await response.json();if(!response.ok){setError(result.error);return;}
    setCategories(current=>current.map(item=>item.id===id?{...item,is_active:false}:item));
  }
  return <div className="admin-category-layout">
    <form className="admin-product-form" onSubmit={create}><h2>Add a category</h2>
      <label>Category name<input required value={name} onChange={event=>changeName(event.target.value)}/></label>
      <label>URL slug<input required value={slug} onChange={event=>setSlug(event.target.value)}/></label>
      <label>Description<textarea rows={3} value={description} onChange={event=>setDescription(event.target.value)}/></label>
      {error&&<p className="form-error" role="alert">{error}</p>}{message&&<p className="form-success" role="status">{message}</p>}
      <button className="button button-primary" disabled={busy}>{busy?"Saving…":"Create category"}</button>
    </form>
    <div className="admin-product-list"><h2>Categories</h2>{!categories.length?<p>No categories created yet.</p>:categories.map(category=><article className="admin-category-row" key={category.id}>
      <div><strong>{category.name}</strong><small>/{category.slug} · {category.description||"No description"}</small></div>
      <div><span className={category.is_active?"admin-status":"admin-status is-inactive"}>{category.is_active?"Active":"Inactive"}</span><div className="admin-category-actions"><button onClick={()=>void toggle(category)}>{category.is_active?"Disable":"Enable"}</button>{category.is_active&&<button onClick={()=>void deactivate(category.id)}>Deactivate</button>}</div></div>
    </article>)}</div>
  </div>;
}
