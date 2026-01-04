"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export default function CustomersPage() {
  const router = useRouter();

  const [rows, setRows] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const accentOutline =
    "accent-ring border-orange-400/30 hover:border-orange-400/50 hover:bg-orange-500/10 hover:shadow-orange-500/25";

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("customers")
      .select("id,name,phone,email")
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as Customer[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((c) =>
      [c.name, c.phone ?? "", c.email ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [rows, q]);

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Клиенти <span className="text-orange-300">•</span>
          </h1>
          <p className="mt-2 text-gray-300">
            Управлявай клиентите си бързо — търси по име/телефон/email и отваряй
            поръчките им с един клик.
          </p>
        </div>

        <Button asChild variant="outline" className={accentOutline}>
          <Link href="/customers/new">+ Нов клиент</Link>
        </Button>
      </div>

      {/* Search */}
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
            placeholder="Търси: име / телефон / email"
          />
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
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-white">
                    {c.name}
                  </TableCell>

                  <TableCell className="text-gray-200">{c.phone ?? "—"}</TableCell>
                  <TableCell className="text-gray-200">{c.email ?? "—"}</TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <IconAction
                        size="text"
                        onClick={() => router.push(`/work-orders?customerId=${c.id}`)}
                        title="Поръчки"
                        tooltip="Поръчки"
                      >
                        📄 Поръчки
                      </IconAction>

                      <IconAction
                        href={`/customers/${c.id}`}
                        size="icon"
                        aria-label="Редакция на клиент"
                        title="Редакция"
                        tooltip="Редакция"
                      >
                        ✏️
                      </IconAction>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-gray-400">
                    Няма клиенти.
                  </TableCell>
                </TableRow>
              )}

              {loading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-gray-400">
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
