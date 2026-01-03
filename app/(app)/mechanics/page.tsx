"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Mechanic = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  hourly_rate_eur: number | null;
  is_active: boolean;
  created_at: string;
};

type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function MechanicsPage() {
  const [rows, setRows] = useState<Mechanic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [active, setActive] = useState<ActiveFilter>("ACTIVE");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setError(null);
    setLoading(true);

    const { data, error } = await supabase
      .from("mechanics")
      .select("id,name,phone,email,hourly_rate_eur,is_active,created_at")
      .order("created_at", { ascending: false })
      .limit(2000);

    setLoading(false);

    if (error) return setError(error.message);
    setRows((data ?? []) as any);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return rows.filter((m) => {
      if (active === "ACTIVE" && !m.is_active) return false;
      if (active === "INACTIVE" && m.is_active) return false;

      if (!needle) return true;
      const hay = `${m.name} ${m.phone ?? ""} ${m.email ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q, active]);

  async function toggleActive(m: Mechanic) {
    setError(null);
    setBusyId(m.id);

    const { error } = await supabase
      .from("mechanics")
      .update({ is_active: !m.is_active })
      .eq("id", m.id);

    setBusyId(null);

    if (error) return setError(error.message);

    setRows((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_active: !m.is_active } : x)));
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Механици</h1>
        <Link href="/mechanics/new">+ Нов механик</Link>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Търси: име / телефон / email"
          style={{ padding: 10, minWidth: 280, flex: 1, border: "1px solid #ccc", borderRadius: 8 }}
        />

        <select value={active} onChange={(e) => setActive(e.target.value as ActiveFilter)} style={{ padding: 10, borderRadius: 8 }}>
          <option value="ACTIVE">Само активни</option>
          <option value="INACTIVE">Само неактивни</option>
          <option value="ALL">Всички</option>
        </select>

        <button type="button" onClick={load} style={{ padding: 10, borderRadius: 8 }}>
          ↻ Refresh
        </button>

        <span style={{ color: "#666" }}>
          Показва: <b>{filtered.length}</b> / {rows.length}
        </span>
      </div>

      {error && <div style={{ color: "crimson", marginTop: 10 }}>Грешка: {error}</div>}
      {loading && <div style={{ marginTop: 10 }}>Зареждане...</div>}

      {!loading && filtered.length === 0 && <p style={{ marginTop: 12 }}>Няма резултати.</p>}

      {!loading && filtered.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Име</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Телефон</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Email</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 8 }}>Ставка (EUR/ч)</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Статус</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  <Link href={`/mechanics/${m.id}/edit`}>{m.name}</Link>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{m.phone ?? "—"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{m.email ?? "—"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "right" }}>
                  {Number(m.hourly_rate_eur ?? 0).toFixed(2)}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  {m.is_active ? "Активен" : "Неактивен"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link
                      href={`/mechanics/${m.id}/edit`}
                      style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #ddd", textDecoration: "none", color: "#111" }}
                    >
                      ✏️ Редакция
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === m.id}
                      onClick={() => toggleActive(m)}
                      style={{ padding: "6px 8px", borderRadius: 8 }}
                    >
                      {m.is_active ? "Деактивирай" : "Активирай"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
