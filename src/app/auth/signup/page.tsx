"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name,setName] = useState(""); const [email,setEmail] = useState("");
  const [password,setPassword] = useState(""); const [error,setError] = useState("");
  const [message,setMessage] = useState(""); const [busy,setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setBusy(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/account` },
      });
      if (authError) throw authError;
      if (data.session) { router.replace("/account"); router.refresh(); }
      else setMessage("Check your email for the confirmation link. Your account will be ready after verification.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create your account.");
    } finally { setBusy(false); }
  }

  return <section className="auth-page"><div className="auth-card">
    <span className="eyebrow">Become part of our story</span><h1>Create an account</h1>
    <p>Save favourites and keep your orders in one place.</p>
    <form onSubmit={submit} className="auth-form">
      <label>Full name<input required autoComplete="name" value={name} onChange={e=>setName(e.target.value)} /></label>
      <label>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} /></label>
      <label>Password<input type="password" minLength={8} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} /><small>Use at least 8 characters.</small></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      <button className="button button-primary" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
    </form>
    <p className="auth-foot">Already registered? <Link href="/auth/login">Sign in</Link></p>
  </div></section>;
}
