"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function NewMechanicPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [rate, setRate] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Името е задължително.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("mechanics").insert({
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      hourly_rate_eur: Number(rate || 0),
      is_active: isActive,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/mechanics");
  }

  return (
    <div style={{ maxWidth: 520, padding: 20 }}>
      <h1 style={{ marginTop: 0 }}>Нов механик</h1>

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
