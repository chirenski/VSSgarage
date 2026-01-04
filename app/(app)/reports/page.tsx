"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

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

type InvoiceRow = {
  id: string;
  number: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "CANCELED";
  issue_date: string;
  total_eur: number;
  paid_at: string | null;
};

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function firstDayOfThisMonthISO() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [from, setFrom] = useState(firstDayOfThisMonthISO());
  const [to, setTo] = useState(todayISO());
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setError(null);
    setLoading(true);

    const { data, error } = await supabase
      .from("invoices")
      .select("id,number,status,issue_date,total_eur,paid_at")
      .gte("issue_date", from)
      .lte("issue_date", to)
      .order("issue_date", { ascending: false });

    setLoading(false);

    if (error) return setError(error.message);
    setRows((data ?? []) as any);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const issued = rows.filter((r) => r.status === "ISSUED" || r.status === "PAID");
    const paid = rows.filter((r) => r.status === "PAID");
    const draft = rows.filter((r) => r.status === "DRAFT");
    const canceled = rows.filter((r) => r.status === "CANCELED");

    const sum = (arr: InvoiceRow[]) => arr.reduce((s, r) => s + Number(r.total_eur ?? 0), 0);

    return {
      countAll: rows.length,
      sumAll: sum(rows),

      countIssued: issued.length,
      sumIssued: sum(issued),

      countPaid: paid.length,
      sumPaid: sum(paid),

      countDraft: draft.length,
      sumDraft: sum(draft),

      countCanceled: canceled.length,
      sumCanceled: sum(canceled),
    };
  }, [rows]);

  function fmtMoney(x: any) {
    return `${Number(x ?? 0).toFixed(2)} EUR`;
  }

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Отчети <span className="text-orange-300">•</span>
          </h1>
          <p className="mt-2 text-gray-300">
            Обобщение по период на база фактури.
          </p>
        </div>

        <IconAction
          onClick={load}
          size="icon"
          title="Обнови"
          aria-label="Обнови отчета"
          tooltip="Обнови"
          hoverSpin
          spin={loading}
          disabled={loading}
        >
          ↻
        </IconAction>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Период</CardTitle>
          <IconAction
            onClick={load}
            size="text"
            title="Покажи"
            tooltip="Покажи"
            disabled={loading}
            className={loading ? "opacity-60 pointer-events-none" : ""}
          >
            Покажи
          </IconAction>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-gray-200">От</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-200">До</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          {error && <div className="text-sm text-red-300">{error}</div>}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Оборот</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-gray-200">
            <div>
              <span className="text-white/80 font-medium">ISSUED + PAID:</span>{" "}
              {fmtMoney(totals.sumIssued)}{" "}
              <span className="text-white/50">({totals.countIssued} фактури)</span>
            </div>
            <div>
              <span className="text-white/80 font-medium">PAID:</span>{" "}
              {fmtMoney(totals.sumPaid)}{" "}
              <span className="text-white/50">({totals.countPaid} фактури)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Състояние</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-gray-200">
            <div>
              <span className="text-white/80 font-medium">DRAFT:</span>{" "}
              {fmtMoney(totals.sumDraft)}{" "}
              <span className="text-white/50">({totals.countDraft})</span>
            </div>
            <div>
              <span className="text-white/80 font-medium">CANCELED:</span>{" "}
              {fmtMoney(totals.sumCanceled)}{" "}
              <span className="text-white/50">({totals.countCanceled})</span>
            </div>
            <div>
              <span className="text-white/80 font-medium">Всички:</span>{" "}
              {fmtMoney(totals.sumAll)}{" "}
              <span className="text-white/50">({totals.countAll})</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Фактури (по период)</CardTitle>
        </CardHeader>

        <CardContent className="pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Платена</TableHead>
                <TableHead className="text-right">Сума</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-white">{r.number}</TableCell>
                  <TableCell className="text-gray-200">{r.issue_date}</TableCell>
                  <TableCell className="text-gray-200">{r.status}</TableCell>
                  <TableCell className="text-gray-200">
                    {r.paid_at ? new Date(r.paid_at).toLocaleString("bg-BG") : "—"}
                  </TableCell>
                  <TableCell className="text-right text-gray-200">
                    {fmtMoney(r.total_eur)}
                  </TableCell>
                </TableRow>
              ))}

              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-gray-400">
                    Няма данни за периода.
                  </TableCell>
                </TableRow>
              )}

              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-gray-400">
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
