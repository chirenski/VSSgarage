"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Invoice = any;

function money(x: any) {
  return `${Number(x ?? 0).toFixed(2)} EUR`;
}

export default function PrintInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [inv, setInv] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setError(null);

      const { data: s, error: sErr } = await supabase
        .from("settings")
        .select("company_name,company_address,company_eik,company_vat,company_mol,vat_percent")
        .limit(1);

      if (sErr) return setError(sErr.message);
      setSettings(s?.[0] ?? null);

      const { data, error } = await supabase.from("invoices").select("*").eq("id", id).single();
      if (error) return setError(error.message);
      setInv(data as any);

      // auto open print dialog (optional)
      setTimeout(() => window.print(), 150);
    })();
  }, [id]);

  const parts = useMemo(() => inv?.work_order_snapshot?.parts ?? [], [inv]);
  const labor = useMemo(() => inv?.work_order_snapshot?.labor ?? [], [inv]);

  if (error) return <div className="print-root p-6">Error: {error}</div>;
  if (!inv) return <div className="print-root p-6">Loading...</div>;

  const buyer = inv.customer_snapshot ?? {};
  const seller = settings ?? {};

  return (
    <div className="print-root">
      <div className="a4">
        {/* Header */}
        <div className="row between">
          <div>
            <div className="h1">ФАКТУРА</div>
            <div className="muted">№ {inv.number}</div>
            <div className="muted">Дата: {inv.issue_date ?? "—"}</div>
          </div>
          <div className="right">
            <div className="muted">Статус: {inv.status}</div>
            {inv.work_order_snapshot?.number ? (
              <div className="muted">WO: {inv.work_order_snapshot.number}</div>
            ) : null}
            {inv.work_order_snapshot?.vehicle_reg ? (
              <div className="muted">Авто: {inv.work_order_snapshot.vehicle_reg}</div>
            ) : null}
          </div>
        </div>

        <hr className="hr" />

        {/* Parties */}
        <div className="grid2">
          <div>
            <div className="h2">Доставчик</div>
            <div className="b">{seller.company_name ?? "—"}</div>
            <div>{seller.company_address ?? "—"}</div>
            <div className="muted">ЕИК: {seller.company_eik ?? "—"}</div>
            <div className="muted">ДДС №: {seller.company_vat ?? "—"}</div>
            <div className="muted">МОЛ: {seller.company_mol ?? "—"}</div>
          </div>

          <div>
            <div className="h2">Клиент</div>
            <div className="b">{buyer.name ?? "—"}</div>
            <div>{buyer.company_name ?? ""}</div>
            <div>{buyer.company_address ?? ""}</div>
            <div className="muted">ЕИК: {buyer.company_eik ?? "—"}</div>
            <div className="muted">ДДС №: {buyer.vat_number ?? "—"}</div>
            <div className="muted">Тел: {buyer.phone ?? "—"}</div>
            <div className="muted">Email: {buyer.email ?? "—"}</div>
          </div>
        </div>

        <hr className="hr" />

        {/* Items table */}
        <div className="h2">Позиции</div>
        <table className="t">
          <thead>
            <tr>
              <th>Описание</th>
              <th className="r">Кол./Час</th>
              <th className="r">Ед. цена</th>
              <th className="r">Сума</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p: any, i: number) => {
              const qty = Number(p.qty ?? 0);
              const unit = Number(p.unit_price_eur ?? 0);
              const amount = qty * unit;
              return (
                <tr key={`p-${i}`}>
                  <td>Част: {p.name ?? "—"}</td>
                  <td className="r">{qty.toFixed(2)}</td>
                  <td className="r">{unit.toFixed(2)}</td>
                  <td className="r">{amount.toFixed(2)}</td>
                </tr>
              );
            })}

            {labor.map((l: any, i: number) => {
              const hours = Number(l.hours ?? 0);
              const rate = Number(l.rate_eur ?? 0);
              const amount = Number(l.amount_eur ?? hours * rate);
              return (
                <tr key={`l-${i}`}>
                  <td>Труд: {l.operation ?? "—"}</td>
                  <td className="r">{hours.toFixed(2)}</td>
                  <td className="r">{rate.toFixed(2)}</td>
                  <td className="r">{amount.toFixed(2)}</td>
                </tr>
              );
            })}

            {parts.length === 0 && labor.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Няма позиции.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="totals">
          <div className="row between">
            <div className="muted">Междинна сума</div>
            <div>{money(inv.subtotal_eur)}</div>
          </div>
          <div className="row between">
            <div className="muted">Отстъпка</div>
            <div>{money(inv.discount_eur)}</div>
          </div>
          <div className="row between">
            <div className="muted">ДДС ({Number(inv.vat_percent ?? 0).toFixed(2)}%)</div>
            <div>{money(inv.vat_amount_eur)}</div>
          </div>
          <div className="row between big">
            <div className="b">Общо</div>
            <div className="b">{money(inv.total_eur)}</div>
          </div>
        </div>

        <div className="footer muted">
          Документът е генериран от VSS Garage.
        </div>
      </div>
    </div>
  );
}

