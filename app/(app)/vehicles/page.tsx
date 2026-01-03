"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Vehicle = {
  id: string;
  reg_number: string;
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  customer_id: string;
};

type Customer = {
  id: string;
  name: string;
};

export default function VehiclesPage() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);

    // 1️⃣ клиенти (за имената)
    const { data: cust, error: e1 } = await supabase
      .from("customers")
      .select("id,name");

    if (e1) {
      setError(e1.message);
      return;
    }

    const map: Record<string, Customer> = {};
    (cust ?? []).forEach((c) => (map[c.id] = c));
    setCustomers(map);

    // 2️⃣ автомобили
    const { data: veh, error: e2 } = await supabase
      .from("vehicles")
      .select("id,reg_number,vin,make,model,year,customer_id")
      .order("created_at", { ascending: false });

    if (e2) {
      setError(e2.message);
      return;
    }

    setRows((veh ?? []) as Vehicle[]);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Автомобили</h1>
        <Link href="/vehicles/new">+ Нов автомобил</Link>
      </div>

      {error && <div style={{ color: "crimson" }}>Грешка: {error}</div>}

      {rows.length === 0 && <p>Няма добавени автомобили.</p>}

      {rows.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Рег. №</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Марка / Модел</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Год.</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Клиент</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  <Link href={`/vehicles/${v.id}`}>{v.reg_number}</Link>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  {(v.make ?? "—") + " " + (v.model ?? "")}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  {v.year ?? "—"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  {customers[v.customer_id]?.name ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 10 }}>
        <button type="button" onClick={load}>↻ Refresh</button>
      </div>
    </div>
  );
}
