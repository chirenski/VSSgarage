"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconAction } from "@/components/ui/icon-action";

type InvoiceRow = {
  id: string;
  number: string;
  issue_date: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "CANCELED" | string;
  total_eur: number;
  customer_snapshot: any;
};

type WorkOrderPick = {
  id: string;
  number: string;
  customer_id: string | null;
  customer_name: string | null;
  vehicle_reg: string | null;
  status: string | null;
};

type StatusFilter = "ALL" | "DRAFT" | "ISSUED" | "PAID" | "CANCELED";

type SettingsRow = {
  id: string;
  invoice_prefix: string | null;
  invoice_next_number: number | null;
  vat_percent: number | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function InvoicesPage() {
  const router = useRouter();

  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // inline create UI
  const [createOpen, setCreateOpen] = useState(false);
  const [woLoading, setWoLoading] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrderPick[]>([]);
  const [woOpen, setWoOpen] = useState(false);
  const [woSearch, setWoSearch] = useState("");
  const [selectedWoId, setSelectedWoId] = useState("");
  const woBoxRef = useRef<HTMLDivElement | null>(null);

  const accentOutline =
    "accent-ring border-orange-400/30 hover:border-orange-400/50 hover:bg-orange-500/10 hover:shadow-orange-500/25";

  const filterBtnBase =
    "border-white/10 hover:border-orange-400/35 hover:bg-orange-500/10 hover:shadow-orange-500/10";
  const filterBtnActive =
    "border-orange-400/40 bg-orange-500/10 text-orange-100 hover:border-orange-400/55";

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!woBoxRef.current) return;
      if (!woBoxRef.current.contains(e.target as Node)) setWoOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  async function load() {
    setError(null);
    setLoading(true);

    const { data, error } = await supabase
      .from("invoices")
      .select("id,number,issue_date,status,total_eur,customer_snapshot")
      .order("issue_date", { ascending: false });

    setLoading(false);

    if (error) return setError(error.message);
    setRows((data ?? []) as any);
  }

  async function loadWorkOrders() {
    setWoLoading(true);

    const { data, error } = await supabase
      .from("work_orders")
      .select("id,number,customer_id,customer_name,vehicle_reg,status")
      .order("received_at", { ascending: false })
      .limit(500);

    setWoLoading(false);

    if (error) {
      setError(error.message);
      setWorkOrders([]);
      return;
    }

    setWorkOrders((data ?? []) as any);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return rows.filter((r) => {
      if (status !== "ALL" && r.status !== status) return false;

      if (!needle) return true;
      const buyer = `${r.number} ${r.customer_snapshot?.name ?? ""} ${
        r.customer_snapshot?.company_name ?? ""
      }`.toLowerCase();

      return buyer.includes(needle);
    });
  }, [rows, q, status]);

  const filteredWorkOrders = useMemo(() => {
    const s = woSearch.trim().toLowerCase();
    if (!s) return workOrders;

    return workOrders.filter((w) => {
      const blob = `${w.number} ${w.customer_name ?? ""} ${w.vehicle_reg ?? ""} ${
        w.status ?? ""
      }`.toLowerCase();
      return blob.includes(s);
    });
  }, [workOrders, woSearch]);

  const selectedWO = useMemo(
    () => workOrders.find((w) => w.id === selectedWoId) ?? null,
    [workOrders, selectedWoId]
  );

  const selectedWOLabel = selectedWO
    ? `№${selectedWO.number}${selectedWO.vehicle_reg ? ` • ${selectedWO.vehicle_reg}` : ""}${
        selectedWO.customer_name ? ` • ${selectedWO.customer_name}` : ""
      }`
    : "— Избери поръчка —";

  function fmtMoney(x: any) {
    return `${Number(x ?? 0).toFixed(2)} EUR`;
  }

  function fmtDate(s: string) {
    return s ?? "—";
  }

  async function onClickNewInvoice() {
    setError(null);
    setCreateOpen((v) => !v);

    if (workOrders.length === 0) await loadWorkOrders();
  }

  async function createDraftInvoice() {
    setError(null);

    if (!selectedWoId) {
      setError("Избери поръчка (Work Order), за да създадеш фактура.");
      return;
    }

    setCreating(true);

    const { data: s, error: sErr } = await supabase
      .from("settings")
      .select("id,invoice_prefix,invoice_next_number,vat_percent")
      .limit(1);

    if (sErr) {
      setCreating(false);
      setError(sErr.message);
      return;
    }

    let settings: SettingsRow | null = (s && s.length > 0 ? (s[0] as any) : null);

    if (!settings) {
      const { data: ins, error: insErr } = await supabase
        .from("settings")
        .insert({ id: "singleton", invoice_prefix: "INV-", invoice_next_number: 1, vat_percent: 0 })
        .select("id,invoice_prefix,invoice_next_number,vat_percent")
        .single();

      if (insErr) {
        setCreating(false);
        setError(insErr.message);
        return;
      }
      settings = ins as any;
    }

    const prefix = settings.invoice_prefix ?? "INV-";
    const nextNo = Number(settings.invoice_next_number ?? 1);
    const number = `${prefix}${String(nextNo).padStart(6, "0")}`;

    const customer_snapshot = {
      name: selectedWO?.customer_name ?? null,
    };

    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .insert({
        number,
        issue_date: todayISO(),
        status: "DRAFT",
        total_eur: 0,
        work_order_id: selectedWoId,
        customer_id: selectedWO?.customer_id ?? null,
        customer_snapshot,
        vat_percent: settings.vat_percent ?? 0,
      })
      .select("id")
      .single();

    if (invErr) {
      setCreating(false);
      setError(invErr.message);
      return;
    }

    const { error: bumpErr } = await supabase
      .from("settings")
      .update({ invoice_next_number: nextNo + 1 })
      .eq("id", settings.id);

    setCreating(false);

    if (bumpErr) {
      setError(
        `Фактурата е създадена (${number}), но не успях да обновя следващия номер: ${bumpErr.message}`
      );
    }

    setCreateOpen(false);
    setWoOpen(false);
    setSelectedWoId("");
    setWoSearch("");

    if (inv?.id) router.push(`/invoices/${inv.id}`);
    else await load();
  }

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Фактури <span className="text-orange-300">•</span>
          </h1>
          <p className="mt-2 text-gray-300">
            Търси по номер/клиент/фирма и филтрирай по статус.
          </p>
        </div>

        <Button type="button" variant="outline" className={accentOutline} onClick={onClickNewInvoice}>
          + Нова фактура
        </Button>
      </div>

      {error && <div className="text-sm text-red-300">{error}</div>}

      {/* Inline Create */}
      {createOpen && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Създай Draft фактура</CardTitle>

            <div className="flex items-center gap-2">
              <IconAction
                onClick={loadWorkOrders}
                size="icon"
                title="Обнови поръчките"
                tooltip="Обнови поръчките"
                hoverSpin
                spin={woLoading}
                disabled={woLoading}
              >
                ↻
              </IconAction>

              <Button type="button" variant="outline" className={accentOutline} onClick={() => setCreateOpen(false)}>
                Затвори
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* ✅ Work order dropdown (IN-FLOW, no overlay) */}
            <div className="space-y-2" ref={woBoxRef}>
              <label className="text-sm text-gray-200">Поръчка (Work Order) *</label>

              <button
                type="button"
                onClick={() => setWoOpen((v) => !v)}
                className={[
                  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white",
                  "outline-none transition focus:ring-4 focus:ring-orange-500/15 hover:bg-white/10",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={selectedWO ? "text-white" : "text-white/60"}>
                    {selectedWOLabel}
                  </span>
                  <span className="text-white/60">▾</span>
                </div>
              </button>

              {woOpen && (
                <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#0b0f14]/70 shadow-2xl backdrop-blur">
                  <div className="p-3 border-b border-white/10">
                    <Input
                      value={woSearch}
                      onChange={(e) => setWoSearch(e.target.value)}
                      placeholder="Търси: № / клиент / рег. № / статус"
                    />
                  </div>

                  <div className="max-h-64 overflow-auto p-1">
                    {woLoading && (
                      <div className="px-3 py-3 text-sm text-white/60">Зареждане...</div>
                    )}

                    {!woLoading && filteredWorkOrders.length === 0 && (
                      <div className="px-3 py-3 text-sm text-white/60">Няма резултати.</div>
                    )}

                    {!woLoading &&
                      filteredWorkOrders.map((w) => {
                        const isActive = w.id === selectedWoId;
                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => {
                              setSelectedWoId(w.id);
                              setWoOpen(false);
                              setWoSearch("");
                            }}
                            className={[
                              "w-full rounded-lg px-3 py-2 text-left text-sm transition",
                              isActive
                                ? "bg-orange-500/10 text-orange-100"
                                : "text-white/90 hover:bg-white/5",
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium">
                                №{w.number}
                                {w.vehicle_reg ? (
                                  <span className="text-xs text-white/50"> • {w.vehicle_reg}</span>
                                ) : null}
                                {w.customer_name ? (
                                  <span className="text-xs text-white/50"> • {w.customer_name}</span>
                                ) : null}
                              </span>
                              <span className="text-xs text-white/50">{w.status ?? ""}</span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className={accentOutline}
                onClick={createDraftInvoice}
                disabled={creating}
              >
                {creating ? "Създаване..." : "Създай Draft фактура"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search / Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Търсене</CardTitle>

          <div className="flex items-center gap-3">
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
          <div className="flex flex-col gap-3">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Търси: № / клиент / фирма"
            />

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { key: "ALL", label: "Всички" },
                  { key: "DRAFT", label: "Draft" },
                  { key: "ISSUED", label: "Issued" },
                  { key: "PAID", label: "Paid" },
                  { key: "CANCELED", label: "Canceled" },
                ] as const
              ).map((opt) => (
                <IconAction
                  key={opt.key}
                  size="text"
                  onClick={() => setStatus(opt.key)}
                  title={opt.label}
                  tooltip={opt.label}
                  className={`${filterBtnBase} ${status === opt.key ? filterBtnActive : ""}`}
                >
                  {opt.label}
                </IconAction>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Сума</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/invoices/${r.id}`}
                      className="text-white hover:text-orange-200 transition"
                    >
                      {r.number}
                    </Link>
                  </TableCell>

                  <TableCell className="text-gray-200">
                    <div className="font-medium text-white/90">
                      {r.customer_snapshot?.name ?? "—"}
                    </div>
                    {r.customer_snapshot?.company_name && (
                      <div className="text-xs text-white/50">
                        {r.customer_snapshot.company_name}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="text-gray-200">{fmtDate(r.issue_date)}</TableCell>
                  <TableCell className="text-gray-200">{r.status}</TableCell>

                  <TableCell className="text-right text-gray-200">
                    {fmtMoney(r.total_eur)}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <IconAction href={`/invoices/${r.id}`} size="text" title="Отвори" tooltip="Отвори">
                        Отвори
                      </IconAction>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-gray-400">
                    Няма фактури.
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
