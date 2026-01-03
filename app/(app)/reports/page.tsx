"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type InvoiceRow = {
  id: string;
  number: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "CANCELED";
  issue_date: string;
  total_eur: number;
  paid_at: string | null;
};

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function firstDayOfThisMonthISO() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [from, setFrom] = useState(firstDayOfThisMonthISO());
  const [to, setTo] = useState(todayISO());
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);

    const { data, error } = await supabase
      .from("invoices")
      .select("id,number,status,issue_date,total_eur,paid_at")
      .gte("issue_date", from)
      .lte("issue_date", to)
      .order("issue_date", { ascending: false });

    if (error) return setError(error.message);
    setRows((data ?? []) as any);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const issued = rows.filter((r) => r.status === "ISSUED" || r.status === "PAID");
    const paid = rows.filter((r) => r.status === "PAID");
    const draft = rows.filter((r) => r.status === "DRAFT");
    const canceled = rows.filter((r) => r.status === "CANCELED");

    const sum = (arr: InvoiceRow[]) => arr.reduce((s, r) => s + Number(r.total_eur ?? 0), 0);

    return {
      countAll: rows.length,
      sumAll: sum(rows),

      countIssued: issued.length,
      sumIssued: sum(issued),

      countPaid: paid.length,
      sumPaid: sum(paid),

      countDraft: draft.length,
      sumDraft: sum(draft),

      countCanceled: canceled.length,
      sumCanceled: sum(canceled),
    };
  }, [rows]);

  return (
    <div style={{ padding: 20, maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Отчети</h1>
        <button onClick={load}>↻ Обнови</button>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <label>
          От:
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ marginLeft: 8, padding: 8 }} />
        </label>
        <label>
          До:
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ marginLeft: 8, padding: 8 }} />
        </label>
        <button onClick={load} style={{ padding: 10 }}>Покажи</button>
      </div>

      {error && <div style={{ color: "crimson", marginTop: 10 }}>Грешка: {error}</div>}

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Оборот</h3>
          <div><b>ISSUED + PAID:</b> {totals.sumIssued.toFixed(2)} EUR ({totals.countIssued} фактури)</div>
          <div><b>PAID:</b> {totals.sumPaid.toFixed(2)} EUR ({totals.countPaid} фактури)</div>
        </div>

        <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Състояние</h3>
          <div><b>DRAFT:</b> {totals.sumDraft.toFixed(2)} EUR ({totals.countDraft})</div>
          <div><b>CANCELED:</b> {totals.sumCanceled.toFixed(2)} EUR ({totals.countCanceled})</div>
          <div><b>Всички:</b> {totals.sumAll.toFixed(2)} EUR ({totals.countAll})</div>
        </div>
      </div>

      <div style={{ marginTop: 12, border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Фактури (по период)</h3>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>№</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Дата</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Статус</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Платена</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 8 }}>Сума</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.number}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.issue_date}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.status}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.paid_at ? new Date(r.paid_at).toLocaleString("bg-BG") : "—"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "right" }}>{Number(r.total_eur ?? 0).toFixed(2)} EUR</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
