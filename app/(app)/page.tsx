"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    // важен check
    if (!data.session) {
      setErr("Login OK, но няма сесия. Провери cookies / Site URL в Supabase.");
      return;
    }

    router.replace("/");
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "Arial" }}>
      <h2>Вход</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Имейл" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Парола" required />
        {err && <div style={{ color: "crimson" }}>{err}</div>}
        <button disabled={loading} type="submit">{loading ? "Влизане..." : "Вход"}</button>
      </form>
    </div>
  );
}
