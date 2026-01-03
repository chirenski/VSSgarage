"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type VehicleRow = {
  id: string;
  reg_number: string;
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  engine: string | null;
  mileage: number | null;
  customer_id: string;
};

type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
};

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [customersById, setCustomersById] = useState<Record<string, CustomerRow>>({});
  const [vehicleId, setVehicleId] = useState("");
  const [complaint, setComplaint] = useState("");
  const [mileage, setMileage] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: cust, error: e1 } = await supabase
        .from("customers")
        .select("id,name,phone")
        .order("name", { ascending: true })
        .limit(1000);

      if (e1) return setError(e1.message);

      const map: Record<string, CustomerRow> = {};
      (cust ?? []).forEach((c) => (map[c.id] = c));
      setCustomersById(map);

      const { data: veh, error: e2 } = await supabase
        .from("vehicles")
        .select("id,reg_number,vin,make,model,year,engine,mileage,customer_id")
        .order("updated_at", { ascending: false })
        .limit(2000);

      if (e2) return setError(e2.message);
      setVehicles(veh ?? []);
    })();
  }, []);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicles, vehicleId]
  );

  async function createWorkOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedVehicle) {
      setError("Избери автомобил.");
      return;
    }

    const customer = customersById[selectedVehicle.customer_id];
    if (!customer) {
      setError("Липсва клиент за този автомобил.");
      return;
    }

    setSaving(true);

    // 1) next number from DB
    const { data: numData, error: numErr } = await supabase.rpc("next_work_order_number");
    if (numErr) {
      setSaving(false);
      setError("Не мога да взема следващ номер: " + numErr.message);
      return;
    }
    const nextNumber = String(numData);

    // 2) insert snapshot work order
    const { data: inserted, error: insErr } = await supabase
      .from("work_orders")
      .insert({
        number: nextNumber,
        status: "RECEIVED",
        customer_id: customer.id,
        vehicle_id: selectedVehicle.id,

        customer_name: customer.name,
        customer_phone: customer.phone,

        vehicle_reg: selectedVehicle.reg_number,
        vehicle_vin: selectedVehicle.vin,
        vehicle_make: selectedVehicle.make,
        vehicle_model: selectedVehicle.model,
        vehicle_year: selectedVehicle.year,
        vehicle_engine: selectedVehicle.engine,

        mileage: mileage ? Number(mileage) : selectedVehicle.mileage,
        complaint: complaint || null,
      })
      .select("id")
      .single();

    setSaving(false);

    if (insErr) {
      setError(insErr.message);
      return;
    }

    router.push(`/work-orders/${inserted.id}`);
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ marginTop: 0 }}>Нова работна карта</h1>

      <form onSubmit={createWorkOrder} style={{ display: "grid", gap: 10 }}>
        <label>
          Автомобил
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} style={{ width: "100%", padding: 10 }}>
            <option value="">— избери —</option>
            {vehicles.map((v) => {
              const c = customersById[v.customer_id];
              const label = `${v.reg_number} — ${v.make ?? ""} ${v.model ?? ""}${c ? ` (${c.name})` : ""}`;
              return (
                <option key={v.id} value={v.id}>
                  {label}
                </option>
              );
            })}
          </select>
        </label>

        <label>
          Км (по желание)
          <input value={mileage} onChange={(e) => setMileage(e.target.value)} inputMode="numeric" style={{ width: "100%", padding: 10 }} />
        </label>

        <label>
          Оплакване / задача
          <textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} rows={4} style={{ width: "100%", padding: 10 }} />
        </label>

        {selectedVehicle && (
          <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
            <div><b>Избран:</b> {selectedVehicle.reg_number}</div>
            <div>
              <b>Автомобил:</b> {(selectedVehicle.make ?? "—") + " " + (selectedVehicle.model ?? "")} ({selectedVehicle.year ?? "—"})
            </div>
            <div><b>VIN:</b> {selectedVehicle.vin ?? "—"}</div>
          </div>
        )}

        {error && <div style={{ color: "crimson" }}>{error}</div>}

        <button disabled={saving} style={{ padding: 12 }}>
          {saving ? "Създаване..." : "Създай работна карта"}
        </button>
      </form>
    </div>
  );
}
