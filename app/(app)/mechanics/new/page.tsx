"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IconAction } from "@/components/ui/icon-action";

export default function NewMechanicPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [active, setActive] = useState(true);

  const accentOutline =
    "accent-ring border-orange-400/30 hover:border-orange-400/50 hover:bg-orange-500/10 hover:shadow-orange-500/25";

  const filterBtnBase =
    "border-white/10 hover:border-orange-400/35 hover:bg-orange-500/10 hover:shadow-orange-500/10";
  const filterBtnActive =
    "border-orange-400/40 bg-orange-500/10 text-orange-100 hover:border-orange-400/55";

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/mechanics");
  }

  const normalizedHourlyRate = useMemo(() => {
    const t = hourlyRate.trim();
    if (!t) return null;
    // allow comma
    const v = Number(t.replace(",", "."));
    return Number.isFinite(v) ? v : NaN;
  }, [hourlyRate]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Името е задължително.");

    if (normalizedHourlyRate !== null && Number.isNaN(normalizedHourlyRate)) {
      return setError("Невалидна ставка. Пример: 25 или 25.50");
    }

    setSaving(true);

    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      hourly_rate_eur: normalizedHourlyRate === null ? null : normalizedHourlyRate,
      is_active: active,
    };

    const { error } = await supabase.from("mechanics").insert(payload);

    setSaving(false);

    if (error) setError(error.message);
    else router.push("/mechanics");
  }

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Нов механик <span className="text-orange-300">•</span>
          </h1>
          <p className="mt-2 text-gray-300">Създай механик и запази.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className={accentOutline} onClick={goBack}>
            ← Назад
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Данни</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && <div className="text-sm text-red-300">{error}</div>}

          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-gray-200">Име *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Име и фамилия" />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-200">Телефон</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08..." />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-200">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@mail.com" />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-200">Ставка (EUR/ч)</label>
                <Input
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  inputMode="decimal"
                  placeholder="напр. 25 или 25.50"
                />
              </div>
            </div>

            {/* Active segmented */}
            <div className="space-y-2">
              <label className="text-sm text-gray-200">Статус</label>
              <div className="flex items-center gap-2">
                <IconAction
                  size="text"
                  onClick={() => setActive(true)}
                  title="Активен"
                  tooltip="Активен"
                  className={`${filterBtnBase} ${active ? filterBtnActive : ""}`}
                >
                  Активен
                </IconAction>

                <IconAction
                  size="text"
                  onClick={() => setActive(false)}
                  title="Неактивен"
                  tooltip="Неактивен"
                  className={`${filterBtnBase} ${!active ? filterBtnActive : ""}`}
                >
                  Неактивен
                </IconAction>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="submit" variant="outline" className={accentOutline} disabled={saving}>
                {saving ? "Запис..." : "Запази"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
