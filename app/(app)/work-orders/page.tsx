"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  number: string;
  status: string;
  received_at: string | null;

  vehicle_reg: string | null;
  vehicle_vin: string | null;

  customer_name: string | null;
  customer_phone: string | null;

  mileage: number | null;
};

const STATUSES = ["ALL", "RECEIVED", "IN_PROGRESS", "WAITING_PARTS", "READY", "DELIVERED", "CANCELED"] as const;
type StatusFilter = (typeof STATUSES)[number];

export default function WorkOrdersPage() {
  const [rows, setRows] = useState<WorkOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setError(null);
    setLoading(true);

    // дърпаме повече и филтрираме локално (по-бързо за малък сервиз)
    const { data, error } = await supabase
      .from("work_orders")
      .select("id,number,status,received_at,vehicle_reg,vehicle_vin,customer_name,customer_phone,mileage")
      .order("received_at", { ascending: false })
      .limit(500);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setRows((data ?? []) as WorkOrder[]);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return rows.filter((w) => {
      if (status !== "ALL" && w.status !== status) return false;

      if (!needle) return true;

      const hay = [
        w.number,
        w.status,
        w.vehicle_reg ?? "",
        w.vehicle_vin ?? "",
        w.customer_name ?? "",
        w.customer_phone ?? "",
        String(w.mileage ?? ""),
      ]
        .join(" ")
        .toLowerCase();

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

    if (error) {
      setError(error.message);
      return;
    }

    // update локално без да теглим пак
    setRows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: newStatus, received_at: w.received_at } : w
      )
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Работни карти</h1>
        <Link href="/work-orders/new">+ Нова РК</Link>
      </div>

      {/* Controls */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Търси: № РК / рег. № / VIN / телефон / име"
          style={{ padding: 10, minWidth: 320, flex: 1, border: "1px solid #ccc", borderRadius: 8 }}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          style={{ padding: 10, borderRadius: 8 }}
        >
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
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>№</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Статус</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Дата</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Автомобил</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Клиент</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Тел.</th>
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
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{w.customer_name ?? "—"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{w.customer_phone ?? "—"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "right" }}>
                  {w.mileage ?? "—"}
                </td>

                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      disabled={busyId === w.id}
                      onClick={() => quickStatus(w.id, "IN_PROGRESS")}
                      style={{ padding: "6px 8px", borderRadius: 8 }}
                    >
                      Работи се
                    </button>
                    <button
                      type="button"
                      disabled={busyId === w.id}
                      onClick={() => quickStatus(w.id, "READY")}
                      style={{ padding: "6px 8px", borderRadius: 8 }}
                    >
                      Готов
                    </button>
                    <button
                      type="button"
                      disabled={busyId === w.id}
                      onClick={() => quickStatus(w.id, "DELIVERED")}
                      style={{ padding: "6px 8px", borderRadius: 8 }}
                    >
                      Издаден
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
