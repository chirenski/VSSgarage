"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Customer = { id: string; name: string; phone: string | null; email: string | null };

type WorkOrder = {
  id: string;
  number: string;
  status: string;
  received_at: string | null;
  vehicle_reg: string | null;
  vehicle_vin: string | null;
  mileage: number | null;
};

const STATUSES = ["ALL", "RECEIVED", "IN_PROGRESS", "WAITING_PARTS", "READY", "DELIVERED", "CANCELED"] as const;
type StatusFilter = (typeof STATUSES)[number];

export default function CustomerDetailsPage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rows, setRows] = useState<WorkOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");

  async function load() {
    setError(null);
    setLoading(true);

    const { data: c, error: e1 } = await supabase
      .from("customers")
      .select(`
  id,
  name,
  phone,
  email,
  company_name,
  company_address,
  company_eik,
  vat_number,
  company_mol
`)

      .eq("id", customerId)
      .single();

    if (e1) {
      setLoading(false);
      return setError(e1.message);
    }
    setCustomer(c as any);

    const { data: w, error: e2 } = await supabase
      .from("work_orders")
      .select("id,number,status,received_at,vehicle_reg,vehicle_vin,mileage")
      .eq("customer_id", customerId)
      .order("received_at", { ascending: false })
      .limit(1000);

    setLoading(false);

    if (e2) return setError(e2.message);
    setRows((w ?? []) as any);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return rows.filter((w) => {
      if (status !== "ALL" && w.status !== status) return false;
      if (!needle) return true;

      const hay = `${w.number} ${w.status} ${w.vehicle_reg ?? ""} ${w.vehicle_vin ?? ""} ${w.mileage ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q, status]);

  async function quickStatus(id: string, newStatus: string) {
    setError(null);
    setBusyId(id);

    const delivered_at = newStatus === "DELIVERED" ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("work_orders")
      .update({ status: newStatus, delivered_at })
      .eq("id", id);

    setBusyId(null);

    if (error) return setError(error.message);

    setRows((prev) => prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w)));
  }

  if (loading) return <div style={{ padding: 20 }}>Зареждане...</div>;
  if (!customer) return <div style={{ padding: 20 }}>Няма такъв клиент.</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>{customer.name}</h1>
          <div style={{ color: "#666", marginTop: 4 }}>
            Тел: {customer.phone ?? "—"} • Email: {customer.email ?? "—"}
          </div>
        </div>
{customer.company_name && (
  <div
    style={{
      border: "1px solid #eee",
      borderRadius: 10,
      padding: 12,
      marginTop: 10,
      maxWidth: 720,
    }}
  >
    <div><b>Фирма:</b> {customer.company_name}</div>
    <div><b>Адрес:</b> {customer.company_address ?? "—"}</div>
    <div><b>ЕИК / БУЛСТАТ:</b> {customer.company_eik ?? "—"}</div>
    <div><b>ИН по ЗДДС:</b> {customer.vat_number ?? "—"}</div>
    <div><b>МОЛ:</b> {customer.company_mol ?? "—"}</div>
  </div>
)}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={`/customers/${customer.id}/edit`}>✏️ Редактирай</Link>
          <Link href="/customers">← Клиенти</Link>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Търси: № РК / рег. № / VIN / км"
          style={{ padding: 10, minWidth: 320, flex: 1, border: "1px solid #ccc", borderRadius: 8 }}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} style={{ padding: 10, borderRadius: 8 }}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "Всички статуси" : s}
            </option>
          ))}
        </select>

        <button type="button" onClick={load} style={{ padding: 10, borderRadius: 8 }}>
          ↻ Refresh
        </button>

        <span style={{ color: "#666" }}>
          РК: <b>{filtered.length}</b> / {rows.length}
        </span>
      </div>

      {error && <div style={{ color: "crimson", marginTop: 10 }}>Грешка: {error}</div>}

      {filtered.length === 0 ? (
        <p style={{ marginTop: 12 }}>Няма работни карти за този клиент.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>№</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Статус</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Дата</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Автомобил</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 8 }}>Км</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Бърз статус</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  <Link href={`/work-orders/${w.id}`}>{w.number}</Link>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{w.status}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  {w.received_at ? new Date(w.received_at).toLocaleString("bg-BG") : "—"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{w.vehicle_reg ?? "—"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "right" }}>{w.mileage ?? "—"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button type="button" disabled={busyId === w.id} onClick={() => quickStatus(w.id, "IN_PROGRESS")} style={{ padding: "6px 8px", borderRadius: 8 }}>
                      В работа
                    </button>
                    <button type="button" disabled={busyId === w.id} onClick={() => quickStatus(w.id, "READY")} style={{ padding: "6px 8px", borderRadius: 8 }}>
                      Готова
                    </button>
                    <button type="button" disabled={busyId === w.id} onClick={() => quickStatus(w.id, "DELIVERED")} style={{ padding: "6px 8px", borderRadius: 8 }}>
                      Предадена
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
