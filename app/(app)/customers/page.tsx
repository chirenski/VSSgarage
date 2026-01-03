"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at?: string;
};

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");

  async function load() {
    setError(null);
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .select("id,name,phone,email,created_at")
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
    if (!needle) return rows;

    return rows.filter((c) => {
      const hay = `${c.name} ${c.phone ?? ""} ${c.email ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Клиенти</h1>
        <Link href="/customers/new">+ Нов клиент</Link>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Търси: име / телефон / email"
          style={{ padding: 10, minWidth: 280, flex: 1, border: "1px solid #ccc", borderRadius: 8 }}
        />
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
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  <Link href={`/customers/${c.id}`}>{c.name}</Link>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{c.phone ?? "—"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{c.email ?? "—"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link
                      href={`/customers/${c.id}`}
                      style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #ddd", textDecoration: "none", color: "#111" }}
                    >
                      📄 Работни карти
                    </Link>
                    <Link
                      href={`/customers/${c.id}/edit`}
                      style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #ddd", textDecoration: "none", color: "#111" }}
                    >
                      ✏️ Редактирай
                    </Link>
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
