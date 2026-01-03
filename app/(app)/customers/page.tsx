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

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at?: string;
};

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setError(null);
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .select("id,name,phone,email,created_at")
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
    if (!needle) return rows;

    return rows.filter((c) => {
      const hay = `${c.name} ${c.phone ?? ""} ${c.email ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q]);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Клиенти</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Списък с всички клиенти и бърз достъп до техните работни карти.
          </p>
        </div>

        <Button asChild>
          <Link href="/customers/new">+ Нов клиент</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Търсене</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Търси: име / телефон / email"
            className="w-full sm:max-w-md"
          />

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={load}>
              ↻ Refresh
            </Button>
            <div className="text-sm text-muted-foreground">
              {filtered.length} / {rows.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* States */}
      {error && (
        <Card className="border-destructive/40">
          <CardContent className="py-4 text-sm text-destructive">
            Грешка: {error}
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">
            Зареждане...
          </CardContent>
        </Card>
      )}

      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">
            Няма резултати.
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <Card>
          <CardContent className="p-0">
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
                  <TableRow key={c.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link
                        href={`/customers/${c.id}`}
                        className="hover:underline"
                      >
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell>{c.phone ?? "—"}</TableCell>
                    <TableCell>{c.email ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2 justify-end">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/customers/${c.id}`}>
                            📄 Работни карти
                          </Link>
                        </Button>
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/customers/${c.id}/edit`}>
                            ✏️ Редактирай
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
