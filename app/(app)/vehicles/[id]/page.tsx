import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function VehicleDetails({ params }: { params: { id: string } }) {
  const { data: v, error: e1 } = await supabase
    .from("vehicles")
    .select("id, reg_number, vin, make, model, year, engine, mileage, customer_id")
    .eq("id", params.id)
    .single();

  if (e1) return <div>Грешка: {e1.message}</div>;

  const { data: hist, error: e2 } = await supabase
    .from("vehicle_history")
    .select("work_order_id, number, status, received_at, delivered_at, complaint, work_done, mileage")
    .eq("vehicle_id", params.id)
    .order("received_at", { ascending: false })
    .limit(50);

  if (e2) return <div>Грешка: {e2.message}</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>
        {v.reg_number} <span style={{ color: "#666", fontSize: 14 }}>{v.make ?? ""} {v.model ?? ""}</span>
      </h1>

      <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, maxWidth: 720 }}>
        <div><b>VIN:</b> {v.vin ?? "—"}</div>
        <div><b>Година:</b> {v.year ?? "—"}</div>
        <div><b>Двигател:</b> {v.engine ?? "—"}</div>
        <div><b>Км:</b> {v.mileage ?? "—"}</div>
      </div>

      <h2 style={{ marginTop: 20 }}>История (работни карти)</h2>

      {hist && hist.length ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>№</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Статус</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Приета</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Км</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Оплакване</th>
            </tr>
          </thead>
          <tbody>
            {hist.map((h) => (
              <tr key={h.work_order_id}>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                  <Link href={`/work-orders/${h.work_order_id}`}>{h.number}</Link>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{h.status}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                  {h.received_at ? new Date(h.received_at).toLocaleString("bg-BG") : "—"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{h.mileage ?? "—"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{h.complaint ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>Няма история за този автомобил.</div>
      )}

      <div style={{ marginTop: 16 }}>
        <Link href="/work-orders/new">+ Нова работна карта</Link>
      </div>
    </div>
  );
}
