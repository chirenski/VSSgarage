"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function PrintInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [inv, setInv] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);

    const { data: s, error: sErr } = await supabase
      .from("settings")
      .select("company_name,company_address,company_eik,company_vat,company_mol")
      .limit(1);

    if (sErr) return setError(sErr.message);
    setSettings(s?.[0] ?? null);

    const { data, error } = await supabase.from("invoices").select("*").eq("id", id).single();
    if (error) return setError(error.message);
    setInv(data);
  }

  useEffect(() => {
    load();
  }, [id]);

  const parts = useMemo(() => inv?.work_order_snapshot?.parts ?? [], [inv]);
  const labor = useMemo(() => inv?.work_order_snapshot?.labor ?? [], [inv]);

  useEffect(() => {
    if (inv) {
      setTimeout(() => window.print(), 300);
    }
  }, [inv]);

  if (error) return <div style={{ padding: 20, color: "crimson" }}>Грешка: {error}</div>;
  if (!inv) return <div style={{ padding: 20 }}>Зареждане...</div>;

  const buyer = inv.customer_snapshot ?? {};
  const seller = settings ?? {};

  return (
    <div style={{ padding: 32, fontFamily: "Arial, sans-serif", color: "#111" }}>
      <style>{`
        @media print {
          button, a { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        table { width: 100%; border-collapse: collapse; }
        th, td { border-bottom: 1px solid #ddd; padding: 8px; }
        th { text-align: left; }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
        <div>
          <h2 style={{ margin: 0 }}>{seller.company_name ?? "Сервиз"}</h2>
          <div>{seller.company_address ?? ""}</div>
          <div>ЕИК: {seller.company_eik ?? "—"}</div>
          <div>ДДС №: {seller.company_vat ?? "—"}</div>
          <div>МОЛ: {seller.company_mol ?? "—"}</div>
        </div>

        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: 0 }}>ФАКТУРА</h2>
          <div><b>№:</b> {inv.number}</div>
          <div><b>Дата:</b> {inv.issue_date}</div>
          <div><b>Статус:</b> {inv.status}</div>
        </div>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: "0 0 6px 0" }}>Клиент</h3>
          <div><b>Име:</b> {buyer.name ?? "—"}</div>
          <div><b>Фирма:</b> {buyer.company_name ?? "—"}</div>
          <div><b>Адрес:</b> {buyer.company_address ?? "—"}</div>
          <div><b>ЕИК:</b> {buyer.company_eik ?? "—"}</div>
          <div><b>ДДС №:</b> {buyer.vat_number ?? "—"}</div>
          <div><b>МОЛ:</b> {buyer.company_mol ?? "—"}</div>
        </div>

        <div style={{ flex: 1, textAlign: "right" }}>
          <h3 style={{ margin: "0 0 6px 0" }}>Работна карта</h3>
          <div><b>№:</b> {inv.work_order_snapshot?.number ?? inv.work_order_id}</div>
          <div><b>Автомобил:</b> {inv.work_order_snapshot?.vehicle_reg ?? "—"}</div>
        </div>
      </div>

      <h3 style={{ marginTop: 16 }}>Позиции</h3>
      <table>
        <thead>
          <tr>
            <th>Описание</th>
            <th style={{ textAlign: "right" }}>Кол./Час</th>
            <th style={{ textAlign: "right" }}>Ед. цена</th>
            <th style={{ textAlign: "right" }}>Сума</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((p: any, idx: number) => (
            <tr key={`p-${idx}`}>
              <td>Част: {p.name}</td>
              <td style={{ textAlign: "right" }}>{Number(p.qty ?? 0).toFixed(2)}</td>
              <td style={{ textAlign: "right" }}>{Number(p.unit_price_eur ?? 0).toFixed(2)}</td>
              <td style={{ textAlign: "right" }}>
                {(Number(p.qty ?? 0) * Number(p.unit_price_eur ?? 0)).toFixed(2)}
              </td>
            </tr>
          ))}
          {labor.map((l: any, idx: number) => (
            <tr key={`l-${idx}`}>
              <td>Труд: {l.operation}</td>
              <td style={{ textAlign: "right" }}>{l.hours ?? "—"}</td>
              <td style={{ textAlign: "right" }}>{Number(l.rate_eur ?? 0).toFixed(2)}</td>
              <td style={{ textAlign: "right" }}>{Number(l.amount_eur ?? 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 16, textAlign: "right" }}>
        <div><b>Междинна сума:</b> {Number(inv.subtotal_eur ?? 0).toFixed(2)} EUR</div>
        <div><b>Отстъпка:</b> {Number(inv.discount_eur ?? 0).toFixed(2)} EUR</div>
        <div><b>ДДС ({Number(inv.vat_percent ?? 0).toFixed(2)}%):</b> {Number(inv.vat_amount_eur ?? 0).toFixed(2)} EUR</div>
        <div style={{ fontSize: 18 }}><b>Общо:</b> {Number(inv.total_eur ?? 0).toFixed(2)} EUR</div>
      </div>

      <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between" }}>
        <div>Подпис (Доставчик): ____________________</div>
        <div>Подпис (Клиент): ____________________</div>
      </div>
    </div>
  );
}
