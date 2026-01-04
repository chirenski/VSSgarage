"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconAction } from "@/components/ui/icon-action";

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
  const [loading, setLoading] = useState(true);

  const accentOutline =
    "accent-ring border-orange-400/30 hover:border-orange-400/50 hover:bg-orange-500/10 hover:shadow-orange-500/25";

  async function load() {
    setError(null);
    setLoading(true);

    const { data, error } = await supabase
      .from("settings")
      .select(
        "id,company_name,company_address,company_eik,company_vat,company_mol,vat_percent,invoice_prefix,invoice_next_number"
      )
      .limit(1);

    if (error) {
      setLoading(false);
      return setError(error.message);
    }

    if (!data || data.length === 0) {
      // singleton row
      const { data: ins, error: insErr } = await supabase
        .from("settings")
        .insert({ id: "singleton", invoice_prefix: "INV-", invoice_next_number: 1, vat_percent: 0 })
        .select(
          "id,company_name,company_address,company_eik,company_vat,company_mol,vat_percent,invoice_prefix,invoice_next_number"
        )
        .single();

      setLoading(false);

      if (insErr) return setError(insErr.message);
      setRow(ins as any);
      return;
    }

    setRow(data[0] as any);
    setLoading(false);
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

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Настройки <span className="text-orange-300">•</span>
          </h1>
          <p className="mt-2 text-gray-300">
            Данни на сервиза и настройки за фактуриране.
          </p>
        </div>

        <IconAction
          onClick={load}
          size="icon"
          title="Обнови"
          aria-label="Обнови"
          tooltip="Обнови"
          hoverSpin
          spin={loading}
          disabled={loading}
        >
          ↻
        </IconAction>
      </div>

      {error && <div className="text-sm text-red-300">{error}</div>}
      {loading && !row && <div className="text-sm text-gray-400">Зареждане...</div>}

      {row && (
        <form onSubmit={save} className="space-y-6">
          {/* Company */}
          <Card>
            <CardHeader>
              <CardTitle>Данни на сервиза</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-200">Фирма</label>
                <Input
                  value={row.company_name ?? ""}
                  onChange={(e) => setRow({ ...row, company_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-200">Адрес</label>
                <Input
                  value={row.company_address ?? ""}
                  onChange={(e) => setRow({ ...row, company_address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-gray-200">ЕИК / БУЛСТАТ</label>
                  <Input
                    value={row.company_eik ?? ""}
                    onChange={(e) => setRow({ ...row, company_eik: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-200">ДДС № (на сервиза)</label>
                  <Input
                    value={row.company_vat ?? ""}
                    onChange={(e) => setRow({ ...row, company_vat: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-200">МОЛ</label>
                <Input
                  value={row.company_mol ?? ""}
                  onChange={(e) => setRow({ ...row, company_mol: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoicing */}
          <Card>
            <CardHeader>
              <CardTitle>Фактуриране</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-gray-200">ДДС %</label>
                  <Input
                    value={String(row.vat_percent ?? 0)}
                    onChange={(e) => setRow({ ...row, vat_percent: toNum(e.target.value) })}
                    inputMode="decimal"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-200">Prefix (пример INV-)</label>
                  <Input
                    value={row.invoice_prefix ?? "INV-"}
                    onChange={(e) => setRow({ ...row, invoice_prefix: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-200">
                  Следващ номер (invoice_next_number)
                </label>
                <Input
                  value={String(row.invoice_next_number ?? 1)}
                  onChange={(e) =>
                    setRow({
                      ...row,
                      invoice_next_number: Math.max(1, Math.floor(toNum(e.target.value))),
                    })
                  }
                  inputMode="numeric"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="submit" variant="outline" className={accentOutline} disabled={saving}>
                  {saving ? "Запис..." : "Запази"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
