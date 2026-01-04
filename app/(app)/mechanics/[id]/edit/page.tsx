"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IconAction } from "@/components/ui/icon-action";

type Mechanic = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  hourly_rate_eur: number | null;
  is_active: boolean | null;
};

export default function EditMechanicPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
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
    const v = Number(t.replace(",", "."));
    return Number.isFinite(v) ? v : NaN;
  }, [hourlyRate]);

  useEffect(() => {
    (async () => {
      setError(null);

      if (!id || typeof id !== "string") {
        setError("Грешка: липсва ID на механика.");
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("mechanics")
        .select("id,name,phone,email,hourly_rate_eur,is_active")
        .eq("id", id)
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const m = data as Mechanic;

      setName(m.name ?? "");
      setPhone(m.phone ?? "");
      setEmail(m.email ?? "");
      setHourlyRate(m.hourly_rate_eur != null ? String(m.hourly_rate_eur) : "");
      setActive(!!m.is_active);

      setLoading(false);
    })();
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!id || typeof id !== "string") return setError("Липсва ID на механика.");
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

    const { error } = await supabase.from("mechanics").update(payload).eq("id", id);

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
            Редакция на механик <span className="text-orange-300">•</span>
          </h1>
          <p className="mt-2 text-gray-300">Промени данните и запази.</p>
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
          {loading && <div className="text-sm text-gray-400">Зареждане...</div>}

          {!loading && (
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-gray-200">Име *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-200">Телефон</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-200">Email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-200">Ставка (EUR/ч)</label>
                  <Input
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    inputMode="decimal"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
