"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Customer = { id: string; name: string; phone: string | null };

export default function NewVehiclePage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form fields
  const [customerId, setCustomerId] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [mileage, setMileage] = useState("");

  // custom customer dropdown
  const [custOpen, setCustOpen] = useState(false);
  const [custSearch, setCustSearch] = useState("");
  const custBoxRef = useRef<HTMLDivElement | null>(null);

  const accentOutline =
    "accent-ring border-orange-400/30 hover:border-orange-400/50 hover:bg-orange-500/10 hover:shadow-orange-500/25";

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!custBoxRef.current) return;
      if (!custBoxRef.current.contains(e.target as Node)) setCustOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("customers")
        .select("id,name,phone")
        .order("name", { ascending: true });

      if (error) {
        setError(error.message);
        setCustomers([]);
      } else {
        setCustomers((data ?? []) as any);
      }

      setLoading(false);
    })();
  }, []);

  const filteredCustomers = useMemo(() => {
    const s = custSearch.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter((c) => {
      const blob = `${c.name} ${c.phone ?? ""}`.toLowerCase();
      return blob.includes(s);
    });
  }, [customers, custSearch]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) ?? null,
    [customers, customerId]
  );

  const selectedCustomerLabel = selectedCustomer
    ? `${selectedCustomer.name}${selectedCustomer.phone ? ` • ${selectedCustomer.phone}` : ""}`
    : "— Избери клиент —";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerId) return setError("Избери клиент.");
    if (!regNumber.trim()) return setError("Регистрационният номер е задължителен.");

    setSaving(true);

    const payload = {
      customer_id: customerId,
      reg_number: regNumber.trim(),
      vin: vin.trim() || null,
      make: make.trim() || null,
      model: model.trim() || null,
      year: year ? Number(year) : null,
      engine: engine.trim() || null,
      mileage: mileage ? Number(mileage) : null,
    };

    const { error } = await supabase.from("vehicles").insert(payload);

    setSaving(false);

    if (error) setError(error.message);
    else router.push("/vehicles");
  }

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Нов автомобил <span className="text-orange-300">•</span>
          </h1>
          <p className="mt-2 text-gray-300">
            Добави автомобил към клиент и попълни основните данни (по желание).
          </p>
        </div>

        <Button asChild variant="outline" className={accentOutline}>
          <Link href="/vehicles">← Назад</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Данни за автомобила</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && <div className="text-sm text-red-300">{error}</div>}
          {loading && <div className="text-sm text-gray-400">Зареждане...</div>}

          <form onSubmit={save} className="space-y-4">
            {/* Customer custom dropdown */}
            <div className="space-y-2" ref={custBoxRef}>
              <label className="text-sm text-gray-200">Клиент</label>

              <button
                type="button"
                onClick={() => setCustOpen((v) => !v)}
                disabled={loading}
                className={[
                  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white",
                  "outline-none transition focus:ring-4 focus:ring-orange-500/15",
                  "hover:bg-white/10",
                  loading ? "opacity-60" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={selectedCustomer ? "text-white" : "text-white/60"}>
                    {selectedCustomerLabel}
                  </span>
                  <span className="text-white/60">▾</span>
                </div>
              </button>

              {custOpen && (
                <div className="relative">
                  <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b0f14]/95 shadow-2xl backdrop-blur">
                    <div className="p-3 border-b border-white/10">
                      <Input
                        value={custSearch}
                        onChange={(e) => setCustSearch(e.target.value)}
                        placeholder="Търси: име / телефон"
                      />
                    </div>

                    <div className="max-h-64 overflow-auto p-1">
                      {filteredCustomers.length === 0 && (
                        <div className="px-3 py-3 text-sm text-white/60">
                          Няма резултати.
                        </div>
                      )}

                      {filteredCustomers.map((c) => {
                        const isActive = c.id === customerId;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCustomerId(c.id);
                              setCustOpen(false);
                              setCustSearch("");
                            }}
                            className={[
                              "w-full rounded-lg px-3 py-2 text-left text-sm transition",
                              isActive
                                ? "bg-orange-500/10 text-orange-100"
                                : "text-white/90 hover:bg-white/5",
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium">{c.name}</span>
                              <span className="text-xs text-white/50">
                                {c.phone ?? ""}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-gray-200">Рег. № *</label>
                <Input
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="например CB1234AB"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-200">VIN</label>
                <Input
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  placeholder="например WVW..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-200">Марка</label>
                <Input value={make} onChange={(e) => setMake(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-200">Модел</label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-200">Година</label>
                <Input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  inputMode="numeric"
                  placeholder="например 2005"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-200">Километри</label>
                <Input
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  inputMode="numeric"
                  placeholder="например 184500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-200">Двигател</label>
              <Input
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                placeholder="например 1.9 TDI"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="submit"
                variant="outline"
                className={accentOutline}
                disabled={saving || loading}
              >
                {saving ? "Запис..." : "Запази"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
