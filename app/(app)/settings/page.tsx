"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type SettingsRow = {
  id: string;
  company_name: string | null;
  company_address: string | null;
  company_eik: string | null;
  company_vat: string | null;
  company_mol: string | null;
  vat_percent: number | null;
  invoice_prefix: string | null;
  invoice_next_number: number | null;
};

function toNum(s: string) {
  const x = Number(String(s ?? "").replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

export default function SettingsPage() {
  const [row, setRow] = useState<SettingsRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setError(null);
    const { data, error } = await supabase
      .from("settings")
      .select("id,company_name,company_address,company_eik,company_vat,company_mol,vat_percent,invoice_prefix,invoice_next_number")
      .limit(1);

    if (error) return setError(error.message);

    if (!data || data.length === 0) {
      // ако нямаш ред — създаваме singleton
      const { data: ins, error: insErr } = await supabase
        .from("settings")
        .insert({ id: "singleton", invoice_prefix: "INV-", invoice_next_number: 1, vat_percent: 0 })
        .select("id,company_name,company_address,company_eik,company_vat,company_mol,vat_percent,invoice_prefix,invoice_next_number")
        .single();

      if (insErr) return setError(insErr.message);
      setRow(ins as any);
      return;
    }

    setRow(data[0] as any);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!row) return;

    setError(null);
    setSaving(true);

    const { error } = await supabase
      .from("settings")
      .update({
        company_name: row.company_name?.trim() || null,
        company_address: row.company_address?.trim() || null,
        company_eik: row.company_eik?.trim() || null,
        company_vat: row.company_vat?.trim() || null,
        company_mol: row.company_mol?.trim() || null,
        vat_percent: Number(row.vat_percent ?? 0),
        invoice_prefix: row.invoice_prefix?.trim() || "INV-",
        invoice_next_number: Number(row.invoice_next_number ?? 1),
      })
      .eq("id", row.id);

    setSaving(false);

    if (error) return setError(error.message);
    load();
  }

  if (!row) return <div style={{ padding: 20 }}>Зареждане...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 720 }}>
      <h1 style={{ marginTop: 0 }}>Настройки</h1>

      {error && <div style={{ color: "crimson", marginBottom: 10 }}>Грешка: {error}</div>}

      <form onSubmit={save} style={{ display: "grid", gap: 12 }}>
        <h3 style={{ margin: "10px 0 0 0" }}>Данни на сервиза</h3>

        <label>
          Фирма
          <input
            value={row.company_name ?? ""}
            onChange={(e) => setRow({ ...row, company_name: e.target.value })}
            style={{ width: "100%", padding: 10 }}
          />
        </label>

        <label>
          Адрес
          <input
            value={row.company_address ?? ""}
            onChange={(e) => setRow({ ...row, company_address: e.target.value })}
            style={{ width: "100%", padding: 10 }}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            ЕИК / БУЛСТАТ
            <input
              value={row.company_eik ?? ""}
              onChange={(e) => setRow({ ...row, company_eik: e.target.value })}
              style={{ width: "100%", padding: 10 }}
            />
          </label>

          <label>
            ДДС № (на сервиза)
            <input
              value={row.company_vat ?? ""}
              onChange={(e) => setRow({ ...row, company_vat: e.target.value })}
              style={{ width: "100%", padding: 10 }}
            />
          </label>
        </div>

        <label>
          МОЛ
          <input
            value={row.company_mol ?? ""}
            onChange={(e) => setRow({ ...row, company_mol: e.target.value })}
            style={{ width: "100%", padding: 10 }}
          />
        </label>

        <h3 style={{ margin: "10px 0 0 0" }}>Фактуриране</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            ДДС %
            <input
              value={String(row.vat_percent ?? 0)}
              onChange={(e) => setRow({ ...row, vat_percent: toNum(e.target.value) })}
              style={{ width: "100%", padding: 10 }}
            />
          </label>

          <label>
            Prefix (пример INV-)
            <input
              value={row.invoice_prefix ?? "INV-"}
              onChange={(e) => setRow({ ...row, invoice_prefix: e.target.value })}
              style={{ width: "100%", padding: 10 }}
            />
          </label>
        </div>

        <label>
          Следващ номер (invoice_next_number)
          <input
            value={String(row.invoice_next_number ?? 1)}
            onChange={(e) => setRow({ ...row, invoice_next_number: Math.max(1, Math.floor(toNum(e.target.value))) })}
            style={{ width: "100%", padding: 10 }}
          />
        </label>

        <button disabled={saving} style={{ padding: 12 }}>
          {saving ? "Запис..." : "Запази"}
        </button>
      </form>
    </div>
  );
}
