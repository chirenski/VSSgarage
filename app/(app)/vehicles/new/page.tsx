"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Customer = { id: string; name: string; phone: string | null };

export default function NewVehiclePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<string>("");
  const [engine, setEngine] = useState("");
  const [mileage, setMileage] = useState<string>("");

  useEffect(() => {
    supabase
      .from("customers")
      .select("id,name,phone")
      .order("name", { ascending: true })
      .limit(500)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setCustomers(data ?? []);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Избери клиент.");
      return;
    }

    const payload: any = {
      customer_id: customerId,
      reg_number: regNumber.trim().toUpperCase(),
      vin: vin.trim() || null,
      make: make.trim() || null,
      model: model.trim() || null,
      year: year ? Number(year) : null,
      engine: engine.trim() || null,
      mileage: mileage ? Number(mileage) : null,
    };

    const { error } = await supabase.from("vehicles").insert(payload);
    if (error) setError(error.message);
    else router.push("/vehicles");
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ marginTop: 0 }}>Нов автомобил</h1>

      <form onSubmit={save} style={{ display: "grid", gap: 10 }}>
        <label>
          Клиент
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={{ width: "100%", padding: 10 }}>
            <option value="">— избери —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label>
          Рег. номер *
          <input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} required style={{ width: "100%", padding: 10 }} />
        </label>

        <label>
          VIN
          <input value={vin} onChange={(e) => setVin(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label>
            Марка
            <input value={make} onChange={(e) => setMake(e.target.value)} style={{ width: "100%", padding: 10 }} />
          </label>
          <label>
            Модел
            <input value={model} onChange={(e) => setModel(e.target.value)} style={{ width: "100%", padding: 10 }} />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label>
            Година
            <input value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" style={{ width: "100%", padding: 10 }} />
          </label>
          <label>
            Км
            <input value={mileage} onChange={(e) => setMileage(e.target.value)} inputMode="numeric" style={{ width: "100%", padding: 10 }} />
          </label>
        </div>

        <label>
          Двигател
          <input value={engine} onChange={(e) => setEngine(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>

        {error && <div style={{ color: "crimson" }}>{error}</div>}

        <button type="submit" style={{ padding: 12 }}>
          Запази
        </button>
      </form>
    </div>
  );
}
