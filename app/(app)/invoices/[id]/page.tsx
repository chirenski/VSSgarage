"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Invoice = {
  id: string;
  number: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "CANCELED";
  issue_date: string;
  due_date: string | null;

  issued_at: string | null;
  paid_at: string | null;
  paid_method: string | null;

  currency: string;
  subtotal_eur: number;
  discount_eur: number;
  vat_percent: number;
  vat_amount_eur: number;
  total_eur: number;

  customer_snapshot: any;
  work_order_snapshot: any;
  work_order_id: string;
};

function fmtDT(s: string | null) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("bg-BG");
  } catch {
    return s;
  }
}

export default function InvoiceDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [inv, setInv] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setError(null);

    const { data: s, error: sErr } = await supabase
      .from("settings")
      .select("company_name,company_address,company_eik,company_vat,company_mol,vat_percent,invoice_prefix,invoice_next_number")
      .limit(1);

    if (sErr) return setError(sErr.message);
    setSettings(s?.[0] ?? null);

    const { data, error } = await supabase.from("invoices").select("*").eq("id", id).single();
    if (error) return setError(error.message);
    setInv(data as any);
  }

  useEffect(() => {
    load();
  }, [id]);

  const parts = useMemo(() => inv?.work_order_snapshot?.parts ?? [], [inv]);
  const labor = useMemo(() => inv?.work_order_snapshot?.labor ?? [], [inv]);

  async function setStatus(next: Invoice["status"], paidMethod?: string | null) {
    if (!inv) return;
    setError(null);
    setBusy(true);

    const patch: any = { status: next };

    if (next === "ISSUED") {
      patch.issued_at = new Date().toISOString();
      patch.paid_at = null;
      patch.paid_method = null;
    }

    if (next === "PAID") {
      // ако не е била “издадена”, маркираме и issued_at
      patch.issued_at = inv.issued_at ?? new Date().toISOString();
      patch.paid_at = new Date().toISOString();
      patch.paid_method = paidMethod ?? inv.paid_method ?? "CASH";
    }

    if (next === "CANCELED") {
      patch.paid_at = null;
      patch.paid_method = null;
      // issued_at оставяме както е (ако е била издадена)
    }

    if (next === "DRAFT") {
      patch.issued_at = null;
      patch.paid_at = null;
      patch.paid_method = null;
    }

    const { error } = await supabase.from("invoices").update(patch).eq("id", inv.id);
    setBusy(false);

    if (error) return setError(error.message);
    load();
  }

  if (!inv) return <div style={{ padding: 20 }}>Зареждане...</div>;

  const buyer = inv.customer_snapshot ?? {};
  const seller = settings ?? {};

  return (
    <div style={{ padding: 20, maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Фактура {inv.number}</h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Link href={`/print/invoices/${inv.id}`} target="_blank">🖨️ Печат A4</Link>
          <Link href="/invoices">← към списъка</Link>
        </div>
      </div>

      {error && <div style={{ color: "crimson", marginTop: 10 }}>Грешка: {error}</div>}

      <div style={{ marginTop: 12, border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div><b>Статус:</b> {inv.status}</div>
            <div><b>Дата (issue_date):</b> {inv.issue_date}</div>
            <div><b>Издадена:</b> {fmtDT(inv.issued_at)}</div>
            <div><b>Платена:</b> {fmtDT(inv.paid_at)}</div>
            <div><b>Метод:</b> {inv.paid_method ?? "—"}</div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button disabled={busy || inv.status === "DRAFT"} onClick={() => setStatus("DRAFT")}>DRAFT</button>
            <button disabled={busy || inv.status === "ISSUED"} onClick={() => setStatus("ISSUED")}>ISSUED</button>
            <button disabled={busy || inv.status === "PAID"} onClick={() => setStatus("PAID", "CASH")}>✅ PAID (Cash)</button>
            <button disabled={busy || inv.status === "PAID"} onClick={() => setStatus("PAID", "BANK")}>✅ PAID (Bank)</button>
            <button disabled={busy || inv.status === "CANCELED"} onClick={() => setStatus("CANCELED")}>⛔ CANCELED</button>
          </div>
        </div>

        <div style={{ marginTop: 10, color: "#666" }}>
          Работна карта: <b>{inv.work_order_snapshot?.number ?? inv.work_order_id}</b> • Автомобил: <b>{inv.work_order_snapshot?.vehicle_reg ?? "—"}</b>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Доставчик (Сервиз)</h3>
          <div><b>Фирма:</b> {seller.company_name ?? "—"}</div>
          <div><b>Адрес:</b> {seller.company_address ?? "—"}</div>
          <div><b>ЕИК:</b> {seller.company_eik ?? "—"}</div>
          <div><b>ДДС №:</b> {seller.company_vat ?? "—"}</div>
          <div><b>МОЛ:</b> {seller.company_mol ?? "—"}</div>
        </div>

        <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Клиент</h3>
          <div><b>Име:</b> {buyer.name ?? "—"}</div>
          <div><b>Тел:</b> {buyer.phone ?? "—"}</div>
          <div><b>Email:</b> {buyer.email ?? "—"}</div>
          <div><b>Фирма:</b> {buyer.company_name ?? "—"}</div>
          <div><b>Адрес:</b> {buyer.company_address ?? "—"}</div>
          <div><b>ЕИК/БУЛСТАТ:</b> {buyer.company_eik ?? "—"}</div>
          <div><b>ИН по ЗДДС:</b> {buyer.vat_number ?? "—"}</div>
          <div><b>МОЛ:</b> {buyer.company_mol ?? "—"}</div>
        </div>
      </div>

      <div style={{ marginTop: 12, border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Позиции</h3>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Описание</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 8 }}>Кол./Час</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 8 }}>Ед. цена</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 8 }}>Сума</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p: any, idx: number) => (
              <tr key={`p-${idx}`}>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>Част: {p.name}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "right" }}>{Number(p.qty ?? 0).toFixed(2)}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "right" }}>{Number(p.unit_price_eur ?? 0).toFixed(2)}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "right" }}>
                  {(Number(p.qty ?? 0) * Number(p.unit_price_eur ?? 0)).toFixed(2)}
                </td>
              </tr>
            ))}

            {labor.map((l: any, idx: number) => (
              <tr key={`l-${idx}`}>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>Труд: {l.operation}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "right" }}>{l.hours ?? "—"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "right" }}>{Number(l.rate_eur ?? 0).toFixed(2)}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "right" }}>{Number(l.amount_eur ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 12, textAlign: "right" }}>
          <div><b>Междинна сума:</b> {Number(inv.subtotal_eur ?? 0).toFixed(2)} EUR</div>
          <div><b>Отстъпка:</b> {Number(inv.discount_eur ?? 0).toFixed(2)} EUR</div>
          <div><b>ДДС ({Number(inv.vat_percent ?? 0).toFixed(2)}%):</b> {Number(inv.vat_amount_eur ?? 0).toFixed(2)} EUR</div>
          <div style={{ fontSize: 18 }}><b>Общо:</b> {Number(inv.total_eur ?? 0).toFixed(2)} EUR</div>
        </div>
      </div>
    </div>
  );
}
