"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

export default function NewWorkOrderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get("customerId");

  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [customersById, setCustomersById] = useState<Record<string, CustomerRow>>(
    {}
  );

  const [vehicleId, setVehicleId] = useState("");
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");

  const [complaint, setComplaint] = useState("");
  const [mileage, setMileage] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const vehicleBoxRef = useRef<HTMLDivElement | null>(null);

  const accentOutline =
    "accent-ring border-orange-400/30 hover:border-orange-400/50 hover:bg-orange-500/10 hover:shadow-orange-500/25";

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!vehicleBoxRef.current) return;
      if (!vehicleBoxRef.current.contains(e.target as Node)) {
        setVehicleOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      const { data: cust, error: e1 } = await supabase
        .from("customers")
        .select("id,name,phone")
        .order("name", { ascending: true });

      if (e1) {
        setError(e1.message);
        setLoading(false);
        return;
      }

      const map: Record<string, CustomerRow> = {};
      (cust ?? []).forEach((c: any) => (map[c.id] = c));
      setCustomersById(map);

      const { data: v, error: e2 } = await supabase
        .from("vehicles")
        .select("id,reg_number,vin,make,model,year,engine,mileage,customer_id")
        .order("reg_number", { ascending: true });

      if (e2) {
        setError(e2.message);
        setLoading(false);
        return;
      }

      setVehicles((v ?? []) as any);
      setLoading(false);
    })();
  }, []);

  const vehiclesForCustomer = useMemo(() => {
    if (!customerIdParam) return vehicles;
    return vehicles.filter((v) => v.customer_id === customerIdParam);
  }, [vehicles, customerIdParam]);

  const filteredVehicles = useMemo(() => {
    const base = vehiclesForCustomer;
    const s = vehicleSearch.trim().toLowerCase();
    if (!s) return base;

    return base.filter((v) => {
      const label = [
        v.reg_number,
        v.make ?? "",
        v.model ?? "",
        v.year ? String(v.year) : "",
        v.vin ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return label.includes(s);
    });
  }, [vehiclesForCustomer, vehicleSearch]);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicles, vehicleId]
  );

  const selectedCustomer = selectedVehicle
    ? customersById[selectedVehicle.customer_id]
    : null;

  const selectedVehicleLabel = useMemo(() => {
    if (!selectedVehicle) return "— Избери автомобил —";
    const parts = [
      selectedVehicle.reg_number,
      [selectedVehicle.make, selectedVehicle.model].filter(Boolean).join(" "),
      selectedVehicle.year ? `(${selectedVehicle.year})` : "",
    ].filter(Boolean);
    return parts.join(" ");
  }, [selectedVehicle]);

  async function createOrder(e: React.FormEvent) {
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

    const { data: numData, error: numErr } = await supabase.rpc(
      "next_work_order_number"
    );
    if (numErr) {
      setSaving(false);
      setError("Не мога да взема следващ номер: " + numErr.message);
      return;
    }
    const nextNumber = String(numData);

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
        complaint: complaint.trim() || null,
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
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Нова поръчка <span className="text-orange-300">•</span>
          </h1>
          <p className="mt-2 text-gray-300">
            Избери автомобил, въведи оплакване и (по желание) километри. След
            създаване ще отидеш към детайла на поръчката.
          </p>
        </div>

        <Button asChild variant="outline" className={accentOutline}>
          <Link href="/work-orders">← Назад</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Данни за поръчката</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && <div className="text-sm text-red-300">{error}</div>}
          {loading && <div className="text-sm text-gray-400">Зареждане...</div>}

          <form onSubmit={createOrder} className="space-y-4">
            {/* Vehicle - custom dropdown */}
            <div className="space-y-2" ref={vehicleBoxRef}>
              <label className="text-sm text-gray-200">Автомобил</label>

              <button
                type="button"
                onClick={() => setVehicleOpen((v) => !v)}
                disabled={loading}
                className={[
                  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white",
                  "outline-none transition focus:ring-4 focus:ring-orange-500/15",
                  "hover:bg-white/10",
                  loading ? "opacity-60" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={selectedVehicle ? "text-white" : "text-white/60"}>
                    {selectedVehicleLabel}
                  </span>
                  <span className="text-white/60">▾</span>
                </div>
              </button>

              {vehicleOpen && (
                <div className="relative">
                  <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b0f14]/95 shadow-2xl backdrop-blur">
                    <div className="p-3 border-b border-white/10">
                      <Input
                        value={vehicleSearch}
                        onChange={(e) => setVehicleSearch(e.target.value)}
                        placeholder="Търси: рег. № / марка / модел / VIN"
                      />
                    </div>

                    <div className="max-h-64 overflow-auto p-1">
                      {filteredVehicles.length === 0 && (
                        <div className="px-3 py-3 text-sm text-white/60">Няма резултати.</div>
                      )}

                      {filteredVehicles.map((v) => {
                        const label = [
                          v.reg_number,
                          [v.make, v.model].filter(Boolean).join(" "),
                          v.year ? `(${v.year})` : "",
                        ]
                          .filter(Boolean)
                          .join(" ");

                        const isActive = v.id === vehicleId;

                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setVehicleId(v.id);
                              setVehicleOpen(false);
                              setVehicleSearch("");
                            }}
                            className={[
                              "w-full rounded-lg px-3 py-2 text-left text-sm transition",
                              isActive
                                ? "bg-orange-500/10 text-orange-100"
                                : "text-white/90 hover:bg-white/5",
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium">{label}</span>
                              <span className="text-xs text-white/50">{v.vin ?? ""}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {customerIdParam && vehiclesForCustomer.length === 0 && (
                <div className="text-sm text-gray-400">Няма автомобили за този клиент.</div>
              )}
            </div>

            {/* Mileage */}
            <div className="space-y-2">
              <label className="text-sm text-gray-200">Км (по желание)</label>
              <Input
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="например 184500"
                inputMode="numeric"
              />
            </div>

            {/* Complaint */}
            <div className="space-y-2">
              <label className="text-sm text-gray-200">Оплакване / задача</label>
              <textarea
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:ring-4 focus:ring-orange-500/15"
                placeholder="Какво да се направи?"
              />
            </div>

            {/* Summary */}
            {selectedVehicle && (
              <Card>
                <CardHeader>
                  <CardTitle>Избрано</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-gray-200">
                  <div>
                    <b>Клиент:</b> {selectedCustomer?.name ?? "—"}
                    {selectedCustomer?.phone ? ` • ${selectedCustomer.phone}` : ""}
                  </div>
                  <div>
                    <b>Автомобил:</b> {selectedVehicle.reg_number}{" "}
                    {(selectedVehicle.make || selectedVehicle.model) && (
                      <span className="text-gray-300">
                        • {[selectedVehicle.make, selectedVehicle.model]
                          .filter(Boolean)
                          .join(" ")}
                      </span>
                    )}
                  </div>
                  <div>
                    <b>VIN:</b> {selectedVehicle.vin ?? "—"}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="submit"
                variant="outline"
                className={accentOutline}
                disabled={saving || loading}
              >
                {saving ? "Създаване..." : "Създай поръчка"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
