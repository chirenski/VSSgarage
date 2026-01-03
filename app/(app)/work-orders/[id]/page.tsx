"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  customer_id: string;

  number: string;
  status: string;
  received_at: string;
  delivered_at: string | null;

  customer_name: string;
  customer_phone: string | null;

  vehicle_reg: string;
  vehicle_vin: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;

  mileage: number | null;

  complaint: string | null;
  diagnosis: string | null;
  work_done: string | null;
  recommendations: string | null;

  discount_eur: number | null;
};

type Mechanic = { id: string; name: string; hourly_rate_eur: number | null; is_active: boolean };
type Part = { id: string; name: string; qty: number; unit_price_eur: number };
type Labor = {
  id: string;
  operation: string;
  hours: number | null;
  rate_eur: number | null;
  amount_eur: number;
  mechanic_id: string | null;
};

type InvoiceMini = {
  id: string;
  number: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "CANCELED";
};

type SettingsMini = {
  vat_percent: number | null;
};

const STATUSES = ["RECEIVED", "IN_PROGRESS", "WAITING_PARTS", "READY", "DELIVERED", "CANCELED"];

function toNum(s: string) {
  const x = Number(String(s ?? "").replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

export default function WorkOrderDetails() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [labor, setLabor] = useState<Labor[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [invoice, setInvoice] = useState<InvoiceMini | null>(null);
  const [settings, setSettings] = useState<SettingsMini | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [newPart, setNewPart] = useState({ name: "", qty: "1", price: "0" });
  const [newLabor, setNewLabor] = useState({ operation: "", hours: "", rate: "", amount: "" });
  const [mechanicId, setMechanicId] = useState<string>("");

  async function load() {
    setError(null);

    const { data: s, error: sErr } = await supabase.from("settings").select("vat_percent").limit(1);
    if (sErr) return setError(sErr.message);
    setSettings((s?.[0] ?? { vat_percent: 0 }) as any);

    const { data: mechs, error: mechErr } = await supabase
      .from("mechanics")
      .select("id,name,hourly_rate_eur,is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (mechErr) return setError(mechErr.message);
    setMechanics((mechs ?? []) as any);

    const { data: w, error: e1 } = await supabase.from("work_orders").select("*").eq("id", id).single();
    if (e1) return setError(e1.message);
    setWo(w as any);

    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .select("id,number,status")
      .eq("work_order_id", id)
      .limit(1);

    if (invErr) return setError(invErr.message);
    setInvoice(inv && inv.length ? (inv[0] as any) : null);

    const { data: p, error: e2 } = await supabase
      .from("work_order_parts")
      .select("id,name,qty,unit_price_eur")
      .eq("work_order_id", id)
      .order("created_at", { ascending: true });

    if (e2) return setError(e2.message);
    setParts((p ?? []) as any);

    const { data: l, error: e3 } = await supabase
      .from("work_order_labor")
      .select("id,operation,hours,rate_eur,amount_eur,mechanic_id")
      .eq("work_order_id", id)
      .order("created_at", { ascending: true });

    if (e3) return setError(e3.message);
    setLabor((l ?? []) as any);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const partsTotal = useMemo(
    () => parts.reduce((sum, p) => sum + Number(p.qty) * Number(p.unit_price_eur), 0),
    [parts]
  );
  const laborTotal = useMemo(() => labor.reduce((sum, l) => sum + Number(l.amount_eur), 0), [labor]);

  const discount = Number(wo?.discount_eur ?? 0);
  const subtotal = partsTotal + laborTotal;
  const net = subtotal - discount;

  const vatPercent = Number(settings?.vat_percent ?? 0);
  const vatAmount = net * (vatPercent / 100);
  const grandTotal = net + vatAmount;

  const mechanicsById = useMemo(() => {
    const m: Record<string, Mechanic> = {};
    mechanics.forEach((x) => (m[x.id] = x));
    return m;
  }, [mechanics]);

  const isLocked = invoice?.status === "ISSUED" || invoice?.status === "PAID";

  async function updateStatus(status: string) {
    if (!wo) return;
    const delivered_at = status === "DELIVERED" ? new Date().toISOString() : null;

    const { error } = await supabase.from("work_orders").update({ status, delivered_at }).eq("id", wo.id);
    if (error) setError(error.message);
    else load();
  }

  async function addPart(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;

    setError(null);

    const { error } = await supabase.from("work_order_parts").insert({
      work_order_id: id,
      name: newPart.name,
      qty: Number(newPart.qty || 1),
      unit_price_eur: toNum(newPart.price),
    });

    if (error) setError(error.message);
    else {
      setNewPart({ name: "", qty: "1", price: "0" });
      load();
    }
  }

  async function addLabor(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;

    setError(null);

    const hours = newLabor.hours ? toNum(newLabor.hours) : 0;
    const rate = newLabor.rate ? toNum(newLabor.rate) : 0;

    const hoursNullable = newLabor.hours ? hours : null;
    const rateNullable = newLabor.rate ? rate : null;

    const amount = newLabor.hours && newLabor.rate ? hours * rate : newLabor.amount ? toNum(newLabor.amount) : 0;

    const { error } = await supabase.from("work_order_labor").insert({
      work_order_id: id,
      operation: newLabor.operation,
      hours: hoursNullable,
      rate_eur: rateNullable,
      amount_eur: amount,
      mechanic_id: mechanicId || null,
    });

    if (error) setError(error.message);
    else {
      setNewLabor({ operation: "", hours: "", rate: "", amount: "" });
      setMechanicId("");
      load();
    }
  }

  async function createInvoice() {
    if (!wo) return;
    setError(null);

    if (invoice) {
      window.location.href = `/invoices/${invoice.id}`;
      return;
    }

    const { data: invNumber, error: numErr } = await supabase.rpc("next_invoice_number");
    if (numErr) return setError(numErr.message);

    const { data: c, error: cErr } = await supabase
      .from("customers")
      .select("id,name,phone,email,company_name,company_address,company_eik,vat_number,company_mol")
      .eq("id", wo.customer_id)
      .single();

    if (cErr) return setError(cErr.message);

    const customerSnapshot = {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      company_name: c.company_name,
      company_address: c.company_address,
      company_eik: c.company_eik,
      vat_number: c.vat_number,
      company_mol: c.company_mol,
    };

    const workOrderSnapshot = {
      id: wo.id,
      number: wo.number,
      vehicle_reg: wo.vehicle_reg,
      parts,
      labor,
      totals: { partsTotal, laborTotal, subtotal, discount, net, vatPercent, vatAmount, grandTotal },
    };

    const { data: inv, error: insErr } = await supabase
      .from("invoices")
      .insert({
        number: invNumber,
        work_order_id: wo.id,
        customer_id: wo.customer_id,
        issue_date: new Date().toISOString().slice(0, 10),

        subtotal_eur: subtotal,
        discount_eur: discount,
        vat_percent: vatPercent,
        vat_amount_eur: vatAmount,
        total_eur: grandTotal,

        status: "DRAFT",
        customer_snapshot: customerSnapshot,
        work_order_snapshot: workOrderSnapshot,
      })
      .select("id,number,status")
      .single();

    if (insErr) return setError(insErr.message);

    window.location.href = `/invoices/${inv.id}`;
  }

  if (!wo) return <div style={{ padding: 20 }}>Зареждане...</div>;

  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ marginTop: 0 }}>Поръчка № {wo.number}</h1>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={createInvoice}>🧾 {invoice ? "Отвори фактура" : "Създай фактура"}</button>
          <Link href={`/print/work-orders/${wo.id}`} target="_blank">🖨️ Печат A4</Link>
          <Link href="/work-orders">← към списъка</Link>
        </div>
      </div>

      {error && <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div>}

      {invoice && (
        <div style={{ marginBottom: 12, border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
          <div>
            <b>Фактура:</b> <Link href={`/invoices/${invoice.id}`}>{invoice.number}</Link> • <b>Статус:</b> {invoice.status}
          </div>

          {isLocked && (
            <div style={{ marginTop: 8, color: "crimson" }}>
              Тази поръчка е <b>заключена</b>, защото фактурата е <b>{invoice.status}</b>. (Части/Труд не могат да се променят)
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Клиент</h3>
          <div><b>Име:</b> {wo.customer_name}</div>
          <div><b>Тел:</b> {wo.customer_phone ?? "—"}</div>
        </div>

        <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Автомобил</h3>
          <div><b>Рег №:</b> {wo.vehicle_reg}</div>
          <div><b>Марка/модел:</b> {(wo.vehicle_make ?? "—") + " " + (wo.vehicle_model ?? "")}</div>
          <div><b>VIN:</b> {wo.vehicle_vin ?? "—"}</div>
          <div><b>Км:</b> {wo.mileage ?? "—"}</div>
        </div>
      </div>

      <div style={{ marginTop: 12, border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Статус</h3>
        <select value={wo.status} onChange={(e) => updateStatus(e.target.value)} style={{ padding: 10 }}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div style={{ marginTop: 8, color: "#666" }}>
          Приета: {wo.received_at ? new Date(wo.received_at).toLocaleString("bg-BG") : "—"}
          {wo.delivered_at ? ` • Предадена: ${new Date(wo.delivered_at).toLocaleString("bg-BG")}` : ""}
        </div>
      </div>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, opacity: isLocked ? 0.6 : 1 }}>
          <h3 style={{ marginTop: 0 }}>Части</h3>

          <form onSubmit={addPart} style={{ display: "grid", gap: 8, marginBottom: 10 }}>
            <input disabled={isLocked} placeholder="Име" value={newPart.name} onChange={(e) => setNewPart({ ...newPart, name: e.target.value })} required />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input disabled={isLocked} placeholder="Кол." value={newPart.qty} onChange={(e) => setNewPart({ ...newPart, qty: e.target.value })} />
              <input disabled={isLocked} placeholder="Ед. цена EUR" value={newPart.price} onChange={(e) => setNewPart({ ...newPart, price: e.target.value })} />
            </div>
            <button disabled={isLocked}>+ Добави част</button>
          </form>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Име</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 6 }}>Кол.</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 6 }}>Цена</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 6 }}>Сума</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: 6, borderBottom: "1px solid #f0f0f0" }}>{p.name}</td>
                  <td style={{ padding: 6, borderBottom: "1px solid #f0f0f0", textAlign: "right" }}>{p.qty}</td>
                  <td style={{ padding: 6, borderBottom: "1px solid #f0f0f0", textAlign: "right" }}>{Number(p.unit_price_eur).toFixed(2)}</td>
                  <td style={{ padding: 6, borderBottom: "1px solid #f0f0f0", textAlign: "right" }}>
                    {(Number(p.qty) * Number(p.unit_price_eur)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 8, textAlign: "right" }}>
            <b>Части общо:</b> {partsTotal.toFixed(2)} EUR
          </div>
        </div>

        <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, opacity: isLocked ? 0.6 : 1 }}>
          <h3 style={{ marginTop: 0 }}>Труд</h3>

          <form onSubmit={addLabor} style={{ display: "grid", gap: 8, marginBottom: 10 }}>
            <label>
              Механик
              <select
                disabled={isLocked}
                value={mechanicId}
                onChange={(e) => {
                  const mid = e.target.value;
                  setMechanicId(mid);

                  const mechRate = mid ? (mechanics.find((m) => m.id === mid)?.hourly_rate_eur ?? 0) : 0;

                  setNewLabor((prev) => {
                    const nextRateStr = String(mechRate ?? 0);
                    const h = prev.hours ? toNum(prev.hours) : 0;
                    const a = h > 0 ? h * (mechRate ?? 0) : prev.amount ? toNum(prev.amount) : 0;
                    return { ...prev, rate: nextRateStr, amount: a ? String(a) : prev.amount };
                  });
                }}
                style={{ width: "100%", padding: 10 }}
              >
                <option value="">— избери —</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>

            <input disabled={isLocked} placeholder="Операция" value={newLabor.operation} onChange={(e) => setNewLabor({ ...newLabor, operation: e.target.value })} required />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <input
                disabled={isLocked}
                placeholder="Часове"
                value={newLabor.hours}
                onChange={(e) => {
                  const hoursStr = e.target.value;
                  setNewLabor((prev) => {
                    const h = hoursStr ? toNum(hoursStr) : 0;
                    const r = prev.rate ? toNum(prev.rate) : 0;
                    const a = h > 0 && r > 0 ? h * r : prev.amount ? toNum(prev.amount) : 0;
                    return { ...prev, hours: hoursStr, amount: a ? String(a) : prev.amount };
                  });
                }}
              />

              <input
                disabled={isLocked}
                placeholder="Ставка EUR"
                value={newLabor.rate}
                onChange={(e) => {
                  const rateStr = e.target.value;
                  setNewLabor((prev) => {
                    const r = rateStr ? toNum(rateStr) : 0;
                    const h = prev.hours ? toNum(prev.hours) : 0;
                    const a = h > 0 && r > 0 ? h * r : prev.amount ? toNum(prev.amount) : 0;
                    return { ...prev, rate: rateStr, amount: a ? String(a) : prev.amount };
                  });
                }}
              />

              <input
                disabled={isLocked}
                placeholder="Сума EUR (ако няма час/ставка)"
                value={newLabor.amount}
                onChange={(e) => setNewLabor({ ...newLabor, amount: e.target.value })}
              />
            </div>

            <button disabled={isLocked}>+ Добави труд</button>
          </form>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Механик</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Операция</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 6 }}>Сума</th>
              </tr>
            </thead>
            <tbody>
              {labor.map((l) => (
                <tr key={l.id}>
                  <td style={{ padding: 6, borderBottom: "1px solid #f0f0f0" }}>
                    {l.mechanic_id ? (mechanicsById[l.mechanic_id]?.name ?? "—") : "—"}
                  </td>
                  <td style={{ padding: 6, borderBottom: "1px solid #f0f0f0" }}>{l.operation}</td>
                  <td style={{ padding: 6, borderBottom: "1px solid #f0f0f0", textAlign: "right" }}>{Number(l.amount_eur).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 8, textAlign: "right" }}>
            <b>Труд общо:</b> {laborTotal.toFixed(2)} EUR
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, border: "1px solid #eee", borderRadius: 10, padding: 12, textAlign: "right" }}>
        <div><b>Междинна сума:</b> {subtotal.toFixed(2)} EUR</div>
        <div><b>Отстъпка:</b> {discount.toFixed(2)} EUR</div>
        <div><b>ДДС ({vatPercent.toFixed(2)}%):</b> {vatAmount.toFixed(2)} EUR</div>
        <div style={{ fontSize: 18 }}><b>Крайна сума:</b> {grandTotal.toFixed(2)} EUR</div>
      </div>
    </div>
  );
}
