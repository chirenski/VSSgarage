"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconAction } from "@/components/ui/icon-action";

type Mechanic = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  hourly_rate_eur: number | null;
  is_active: boolean | null;
  created_at: string;
};

type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function MechanicsPage() {
  const [rows, setRows] = useState<Mechanic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [active, setActive] = useState<ActiveFilter>("ACTIVE");
  const [busyId, setBusyId] = useState<string | null>(null);

  const accentOutline =
    "accent-ring border-orange-400/30 hover:border-orange-400/50 hover:bg-orange-500/10 hover:shadow-orange-500/25";

  async function load() {
    setError(null);
    setLoading(true);

    const { data, error } = await supabase
      .from("mechanics")
      .select("id,name,phone,email,hourly_rate_eur,is_active,created_at")
      .order("created_at", { ascending: false })
      .limit(2000);

    setLoading(false);

    if (error) return setError(error.message);
    setRows((data ?? []) as any);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return rows.filter((m) => {
      const isActive = !!m.is_active;

      if (active === "ACTIVE" && !isActive) return false;
      if (active === "INACTIVE" && isActive) return false;

      if (!needle) return true;
      const hay = `${m.name} ${m.phone ?? ""} ${m.email ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q, active]);

  async function toggleActive(m: Mechanic) {
    setError(null);
    setBusyId(m.id);

    const next = !m.is_active;

    const { error } = await supabase
      .from("mechanics")
      .update({ is_active: next })
      .eq("id", m.id);

    setBusyId(null);

    if (error) return setError(error.message);

    setRows((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_active: next } : x)));
  }

  const filterBtnBase =
    "border-white/10 hover:border-orange-400/35 hover:bg-orange-500/10 hover:shadow-orange-500/10";
  const filterBtnActive =
    "border-orange-400/40 bg-orange-500/10 text-orange-100 hover:border-orange-400/55";

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Механици <span className="text-orange-300">•</span>
          </h1>
          <p className="mt-2 text-gray-300">
            Управлявай механиците — търси по име/телефон/email, филтрирай по статус и редактирай бързо.
          </p>
        </div>

        <Button asChild variant="outline" className={accentOutline}>
          <Link href="/mechanics/new">+ Нов механик</Link>
        </Button>
      </div>

      {/* Search / Filter */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Търсене</CardTitle>

          <div className="flex items-center gap-3">
            {/* Refresh = icon-only + hover spin + spin while loading + tooltip */}
            <IconAction
              onClick={load}
              size="icon"
              title="Обнови"
              aria-label="Обнови списъка"
              tooltip="Обнови"
              hoverSpin
              spin={loading}
              disabled={loading}
            >
              ↻
            </IconAction>

            <span className="text-sm text-orange-200">
              {filtered.length} / {rows.length}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Търси: име / телефон / email"
              />
            </div>

            {/* ✅ Segmented filter вместо dropdown (100% надеждно) */}
            <div className="flex items-center gap-2">
              <IconAction
                size="text"
                onClick={() => setActive("ACTIVE")}
                title="Само активни"
                tooltip="Само активни"
                className={`${filterBtnBase} ${active === "ACTIVE" ? filterBtnActive : ""}`}
              >
                Активни
              </IconAction>

              <IconAction
                size="text"
                onClick={() => setActive("INACTIVE")}
                title="Само неактивни"
                tooltip="Само неактивни"
                className={`${filterBtnBase} ${active === "INACTIVE" ? filterBtnActive : ""}`}
              >
                Неактивни
              </IconAction>

              <IconAction
                size="text"
                onClick={() => setActive("ALL")}
                title="Всички"
                tooltip="Всички"
                className={`${filterBtnBase} ${active === "ALL" ? filterBtnActive : ""}`}
              >
                Всички
              </IconAction>
            </div>
          </div>

          {error && <div className="text-sm text-red-300">{error}</div>}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Име</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Ставка (EUR/ч)</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((m) => {
                const isBusy = busyId === m.id;
                const isActive = !!m.is_active;

                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/mechanics/${m.id}/edit`}
                        className="text-white hover:text-orange-200 transition"
                      >
                        {m.name}
                      </Link>
                    </TableCell>

                    <TableCell className="text-gray-200">{m.phone ?? "—"}</TableCell>
                    <TableCell className="text-gray-200">{m.email ?? "—"}</TableCell>

                    <TableCell className="text-right text-gray-200">
                      {Number(m.hourly_rate_eur ?? 0).toFixed(2)}
                    </TableCell>

                    <TableCell className="text-gray-200">
                      {isActive ? "Активен" : "Неактивен"}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <IconAction
                          href={`/mechanics/${m.id}/edit`}
                          size="icon"
                          title="Редакция"
                          tooltip="Редакция"
                          aria-label="Редакция на механик"
                        >
                          ✏️
                        </IconAction>

                        <IconAction
                          onClick={() => toggleActive(m)}
                          size="text"
                          title={isActive ? "Деактивирай" : "Активирай"}
                          tooltip={isBusy ? "Запис..." : isActive ? "Деактивирай" : "Активирай"}
                          disabled={isBusy}
                          spin={isBusy}
                          className={
                            isActive
                              ? "border-red-400/30 hover:border-red-400/50 hover:bg-red-500/10 hover:shadow-red-500/20 text-red-200 hover:text-red-100"
                              : "border-emerald-400/30 hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:shadow-emerald-500/20 text-emerald-200 hover:text-emerald-100"
                          }
                        >
                          {isActive ? "Деактивирай" : "Активирай"}
                        </IconAction>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-gray-400">
                    Няма резултати.
                  </TableCell>
                </TableRow>
              )}

              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-gray-400">
                    Зареждане...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
