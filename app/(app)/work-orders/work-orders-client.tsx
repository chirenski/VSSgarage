"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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

type WorkOrderRow = {
  id: string;
  number: string;
  status: string;
  received_at: string | null;
  customer_id: string;
  customer_name: string;
  vehicle_reg: string;
};

export default function WorkOrdersClient() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");

  const [items, setItems] = useState<WorkOrderRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const accentOutline =
    "accent-ring border-orange-400/30 hover:border-orange-400/50 hover:bg-orange-500/10 hover:shadow-orange-500/25";

  const newOrderHref = customerId
    ? `/work-orders/new?customerId=${encodeURIComponent(customerId)}`
    : "/work-orders/new";

  async function load() {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("work_orders")
      .select("id,number,status,received_at,customer_id,customer_name,vehicle_reg")
      .order("received_at", { ascending: false });

    if (customerId) query = query.eq("customer_id", customerId);

    const { data, error } = await query;

    if (error) {
      setError(error.message);
      setItems([]);
    } else {
      setItems((data ?? []) as WorkOrderRow[]);
    }

    setLoading(false);
  }

  async function deleteOrder(id: string, number: string) {
    const ok = confirm(`Сигурен ли си, че искаш да изтриеш поръчка №${number}?`);
    if (!ok) return;

    setDeletingId(id);

    const { error } = await supabase.from("work_orders").delete().eq("id", id);

    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;

    return items.filter((w) => {
      return (
        (w.number || "").toLowerCase().includes(s) ||
        (w.customer_name || "").toLowerCase().includes(s) ||
        (w.vehicle_reg || "").toLowerCase().includes(s) ||
        (w.status || "").toLowerCase().includes(s)
      );
    });
  }, [items, q]);

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString("bg-BG", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-6 slide-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Поръчки <span className="text-orange-300">•</span>
          </h1>
          <p className="mt-2 text-gray-300">
            {customerId
              ? "Показани са поръчките само за избрания клиент."
              : "Всички поръчки, търсене по номер, клиент, рег. номер или статус."}
          </p>
        </div>

        <Button asChild variant="outline" className={accentOutline}>
          <Link href={newOrderHref}>+ Нова поръчка</Link>
        </Button>
      </div>

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
              {filtered.length} / {items.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Търси: № поръчка / клиент / рег. номер / статус"
          />
          {error && <div className="text-sm text-red-300">{error}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Автомобил</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Приета</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((w) => {
                const isDeleting = deletingId === w.id;

                return (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/work-orders/${w.id}`}
                        className="text-white hover:text-orange-200 transition"
                      >
                        {w.number}
                      </Link>
                    </TableCell>

                    <TableCell className="text-gray-200">{w.customer_name}</TableCell>
                    <TableCell className="text-gray-200">{w.vehicle_reg}</TableCell>
                    <TableCell className="text-gray-200">{w.status}</TableCell>
                    <TableCell className="text-gray-200">
                      {formatDate(w.received_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <IconAction
                          href={`/work-orders/${w.id}`}
                          size="text"
                          title="Отвори"
                          tooltip="Отвори"
                        >
                          Отвори
                        </IconAction>

                        <IconAction
                          onClick={() => deleteOrder(w.id, w.number)}
                          size="icon"
                          title="Изтрий"
                          tooltip={isDeleting ? "Изтриване..." : "Изтрий"}
                          className="border-red-400/30 hover:border-red-400/50 hover:bg-red-500/10 hover:shadow-red-500/20 text-red-300 hover:text-red-200"
                          disabled={isDeleting}
                          spin={isDeleting}
                        >
                          🗑
                        </IconAction>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-gray-400">
                    Няма поръчки.
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
