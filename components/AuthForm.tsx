"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AuthForm() {
  const sb = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMsg(null); setError(null);
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}` } });
    setSending(false);
    if (error) setError(error.message);
    else setMsg("لینک ورود ارسال شد. لطفاً ایمیل خود را چک کنید.");
  };

  const signOut = async () => {
    await sb.auth.signOut(); location.reload();
  }

  return (
    <div className="card">
      <h3>ورود با ایمیل (Magic Link)</h3>
      <form onSubmit={onSubmit} className="row">
        <input required type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
        <button disabled={sending} type="submit">ارسال لینک</button>
        <button type="button" onClick={signOut}>خروج</button>
      </form>
      {msg && <div className="success small">{msg}</div>}
      {error && <div className="error small">{error}</div>}
    </div>
  );
}
