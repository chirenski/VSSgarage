"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function EditMechanicPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [rate, setRate] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase
        .from("mechanics")
        .select("name,phone,email,hourly_rate_eur,is_active")
        .eq("id", id)
        .single();

      setLoading(false);

      if (error) return setError(error.message);

      setName(data.name ?? "");
      setPhone(data.phone ?? "");
      setEmail(data.email ?? "");
      setRate(String(data.hourly_rate_eur ?? 0));
      setIsActive(Boolean(data.is_active));
    })();
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { error } = await supabase
      .from("mechanics")
      .update({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        hourly_rate_eur: Number(rate || 0),
        is_active: isActive,
      })
      .eq("id", id);

    setSaving(false);

    if (error) return setError(error.message);

    router.push("/mechanics");
  }

  if (loading) return <div style={{ padding: 20 }}>Зареждане...</div>;

  return (
    <div style={{ maxWidth: 520, padding: 20 }}>
      <h1 style={{ marginTop: 0 }}>Редакция механик</h1>

      <form onSubmit={save} style={{ display: "grid", gap: 12 }}>
        <label>
          Име *
          <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%", padding: 10 }} />
        </label>

        <label>
          Телефон
          <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>

        <label>
          Ставка (EUR/ч)
          <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" style={{ width: "100%", padding: 10 }} />
        </label>

        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Активен
        </label>

        {error && <div style={{ color: "crimson" }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button disabled={saving} style={{ padding: 12 }}>
            {saving ? "Запис..." : "Запази"}
          </button>
          <button type="button" onClick={() => router.push("/mechanics")} style={{ padding: 12 }}>
            Отказ
          </button>
        </div>
      </form>
    </div>
  );
}
