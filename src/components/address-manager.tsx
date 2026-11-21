"use client";

import { FormEvent,useCallback,useEffect,useState } from "react";

type Address={
  id:string;recipient_name:string;phone:string;address_line_1:string;address_line_2:string|null;
  locality:string|null;city:string;state:string;postal_code:string;country_code:string;is_default:boolean;
};
type FormState={
  recipient_name:string;phone:string;address_line_1:string;address_line_2:string;locality:string;
  city:string;state:string;postal_code:string;country_code:string;is_default:boolean;
};
const empty:FormState={recipient_name:"",phone:"",address_line_1:"",address_line_2:"",locality:"",city:"",state:"",postal_code:"",country_code:"IN",is_default:false};

export function AddressManager(){
  const [addresses,setAddresses]=useState<Address[]>([]);
  const [form,setForm]=useState<FormState>(empty);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  const load=useCallback(async()=>{
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/addresses");
      const result=await response.json();
      if(!response.ok)throw new Error(result.error);
      setAddresses(result.addresses||[]);
    }catch(cause){
      setError(cause instanceof Error?cause.message:"Unable to load addresses.");
    }finally{setBusy(false);}
  },[]);
  useEffect(()=>{void load();},[load]);

  function edit(address:Address){
    setEditingId(address.id);
    setForm({
      recipient_name:address.recipient_name,phone:address.phone,address_line_1:address.address_line_1,
      address_line_2:address.address_line_2||"",locality:address.locality||"",city:address.city,
      state:address.state,postal_code:address.postal_code,country_code:address.country_code,is_default:address.is_default,
    });
    window.scrollTo({top:0,behavior:"smooth"});
  }
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");setMessage("");
    try{
      const response=await fetch("/api/addresses",{
        method:editingId?"PATCH":"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify(editingId?{id:editingId,...form}:form),
      });
      const result=await response.json();
      if(!response.ok)throw new Error(result.error);
      setMessage(editingId?"Address updated.":"Address saved.");
      setForm(empty);setEditingId(null);await load();
    }catch(cause){
      setError(cause instanceof Error?cause.message:"Unable to save address.");
    }finally{setBusy(false);}
  }
  async function remove(id:string){
    const response=await fetch("/api/addresses",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    const result=await response.json();
    if(!response.ok){setError(result.error);return;}
    await load();
  }
  async function makeDefault(id:string){
    const response=await fetch("/api/addresses",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,is_default:true})});
    const result=await response.json();
    if(!response.ok){setError(result.error);return;}
    await load();
  }
  const field=(key:keyof Omit<FormState,"is_default">,label:string,required=true)=>
    <label>{label}<input required={required} value={form[key]} onChange={event=>setForm(current=>({...current,[key]:event.target.value}))}/></label>;

  return <div className="address-manager">
    <form className="address-form auth-form" onSubmit={submit}>
      <h2>{editingId?"Edit address":"Add a delivery address"}</h2>
      {field("recipient_name","Recipient name")}
      {field("phone","Phone number")}
      {field("address_line_1","Address line 1")}
      {field("address_line_2","Address line 2",false)}
      {field("locality","Area / locality",false)}
      <div className="address-form-grid">
        {field("city","City")}{field("state","State")}{field("postal_code","PIN code")}{field("country_code","Country code")}
      </div>
      <label className="address-default"><input type="checkbox" checked={form.is_default} onChange={event=>setForm(current=>({...current,is_default:event.target.checked}))}/> Set as default address</label>
      {error&&<p className="form-error" role="alert">{error}</p>}
      {message&&<p className="form-success" role="status">{message}</p>}
      <div className="address-form-actions">
        <button className="button button-primary" disabled={busy}>{busy?"Saving…":editingId?"Save changes":"Save address"}</button>
        {editingId&&<button type="button" className="button button-secondary" onClick={()=>{setEditingId(null);setForm(empty);}}>Cancel</button>}
      </div>
    </form>
    <div className="saved-addresses">
      <h2>Saved addresses</h2>
      {busy&&!addresses.length?<p>Loading addresses…</p>:!addresses.length?<p>No addresses saved yet.</p>:addresses.map(address=>
        <article className="saved-address" key={address.id}>
          <div>
            <strong>{address.recipient_name}</strong>{address.is_default&&<span className="address-default-tag">Default</span>}
            <p>{address.address_line_1}{address.address_line_2?", "+address.address_line_2:""}{address.locality?", "+address.locality:""}, {address.city}, {address.state} {address.postal_code}</p>
            <small>{address.phone}</small>
          </div>
          <div className="saved-address-actions">
            {!address.is_default&&<button onClick={()=>void makeDefault(address.id)}>Make default</button>}
            <button onClick={()=>edit(address)}>Edit</button>
            <button onClick={()=>void remove(address.id)}>Delete</button>
          </div>
        </article>
      )}
    </div>
  </div>;
}
