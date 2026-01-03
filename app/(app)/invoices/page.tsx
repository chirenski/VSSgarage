"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type InvoiceRow = {
  id: string;
  number: string;
  issue_date: string;
  status: string;
  total_eur: number;
  customer_snapshot: any;
};

export default function InvoicesPage() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | "DRAFT" | "ISSUED" | "PAID" | "CANCELED">("ALL");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);

    const { data, error } = await supabase
      .from("invoices")
      .select("id,number,issue_date,status,total_eur,customer_snapshot")
      .order("issue_date", { ascending: false });

    if (error) return setError(error.message);
    setRows((data ?? []) as any);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "ALL" && r.status !== status) return false;
      if (!needle) return true;
      const buyer =
        `${r.number} ${r.customer_snapshot?.name ?? ""} ${r.customer_snapshot?.company_name ?? ""}`.toLowerCase();
      return buyer.includes(needle);
    });
  }, [rows, q, status]);

  return (
    <div style={{ padding: 20, maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Фактури</h1>
        <button onClick={load}>↻ Refresh</button>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Търси № / клиент / фирма"
          style={{ padding: 10, minWidth: 280, flex: 1, border: "1px solid #ccc", borderRadius: 8 }}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value as any)} style={{ padding: 10, borderRadius: 8 }}>
          <option value="ALL">Всички</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ISSUED">ISSUED</option>
          <option value="PAID">PAID</option>
          <option value="CANCELED">CANCELED</option>
        </select>

        <span style={{ color: "#666" }}>
          Показва: <b>{filtered.length}</b> / {rows.length}
        </span>
      </div>

      {error && <div style={{ color: "crimson", marginTop: 10 }}>Грешка: {error}</div>}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>№</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Клиент</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Дата</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Статус</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 8 }}>Сума</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id}>
              <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                <Link href={`/invoices/${r.id}`}>{r.number}</Link>
              </td>
              <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                <div><b>{r.customer_snapshot?.name ?? "—"}</b></div>
                {r.customer_snapshot?.company_name && (
                  <div style={{ fontSize: 12, color: "#666" }}>{r.customer_snapshot.company_name}</div>
                )}
              </td>
              <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.issue_date}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.status}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "right" }}>
                {Number(r.total_eur ?? 0).toFixed(2)} EUR
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
