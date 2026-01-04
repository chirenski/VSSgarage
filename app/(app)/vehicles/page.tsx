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

type Vehicle = {
  id: string;
  reg_number: string;
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  customer_id: string;
};

type Customer = { id: string; name: string };

export default function VehiclesPage() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const accentOutline =
    "accent-ring border-orange-400/30 hover:border-orange-400/50 hover:bg-orange-500/10 hover:shadow-orange-500/25";

  async function load() {
    setLoading(true);
    setError(null);

    const { data: cust, error: e1 } = await supabase
      .from("customers")
      .select("id,name")
      .order("name", { ascending: true });

    if (e1) {
      setError(e1.message);
      setLoading(false);
      return;
    }

    const map: Record<string, Customer> = {};
    (cust ?? []).forEach((c: any) => (map[c.id] = c));
    setCustomers(map);

    const { data: veh, error: e2 } = await supabase
      .from("vehicles")
      .select("id,reg_number,vin,make,model,year,customer_id")
      .order("reg_number", { ascending: true });

    if (e2) {
      setError(e2.message);
      setLoading(false);
      return;
    }

    setRows((veh ?? []) as Vehicle[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((v) => {
      const customerName = customers[v.customer_id]?.name ?? "";
      const blob = [
        v.reg_number,
        v.vin ?? "",
        v.make ?? "",
        v.model ?? "",
        v.year ? String(v.year) : "",
        customerName,
      ]
        .join(" ")
        .toLowerCase();

      return blob.includes(s);
    });
  }, [rows, q, customers]);

  return (
    <div className="space-y-6 slide-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Автомобили <span className="text-orange-300">•</span>
          </h1>
          <p className="mt-2 text-gray-300">
            Списък с всички автомобили. Търси по рег. номер, марка/модел, VIN или
            клиент.
          </p>
        </div>

        <Button asChild variant="outline" className={accentOutline}>
          <Link href="/vehicles/new">+ Нов автомобил</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Търсене</CardTitle>
          <div className="flex items-center gap-3">
            {/* ✅ Refresh = icon-only + hover spin + spin while loading + tooltip */}
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
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Търси: рег. № / марка / модел / VIN / клиент"
          />
          {error && <div className="text-sm text-red-300">{error}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Рег. №</TableHead>
                <TableHead>Марка / Модел</TableHead>
                <TableHead>Год.</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/vehicles/${v.id}`}
                      className="text-white hover:text-orange-200 transition"
                    >
                      {v.reg_number}
                    </Link>
                  </TableCell>

                  <TableCell className="text-gray-200">
                    {[v.make, v.model].filter(Boolean).join(" ") || "—"}
                  </TableCell>

                  <TableCell className="text-gray-200">{v.year ?? "—"}</TableCell>

                  <TableCell className="text-gray-200">
                    {customers[v.customer_id]?.name ?? "—"}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <IconAction
                        href={`/vehicles/${v.id}`}
                        aria-label="Редакция на автомобил"
                        title="Редакция"
                        tooltip="Редакция"
                        size="icon"
                      >
                        ✏️
                      </IconAction>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-gray-400">
                    Няма автомобили.
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
