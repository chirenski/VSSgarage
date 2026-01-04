"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export default function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("id,name,phone,email")
      .order("name", { ascending: true });

    if (!error && data) setItems(data as Customer[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((c) => {
      return (
        (c.name || "").toLowerCase().includes(s) ||
        (c.phone || "").toLowerCase().includes(s) ||
        (c.email || "").toLowerCase().includes(s)
      );
    });
  }, [items, q]);

  return (
    <div className="space-y-6 slide-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Клиенти <span className="text-orange-300">•</span>
          </h1>
          <p className="mt-2 text-gray-300">
            Списък с всички клиенти и бърз достъп до техните работни карти.
          </p>
        </div>

        <Button asChild>
          <Link href="/customers/new">+ Нов клиент</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Търсене</CardTitle>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={load} disabled={loading}>
              ↻ Refresh
            </Button>
            <div className="text-sm text-gray-300">
              <span className="text-orange-300 font-semibold">{filtered.length}</span> / {items.length}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="max-w-2xl">
            <Input
              placeholder="Търси: име / телефон / email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

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
                  <TableCell className="font-medium">
                    <Link className="text-white hover:text-orange-200 transition" href={`/customers/${c.id}`}>
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-200">{c.phone ?? ""}</TableCell>
                  <TableCell className="text-gray-200">{c.email ?? ""}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline">
                        <Link href={`/customers/${c.id}/work-orders`}>📄 Работни карти</Link>
                      </Button>
                      <Button asChild variant="ghost" className="px-3">
                        <Link href={`/customers/${c.id}/edit`}>✏️</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-gray-400">
                    Няма резултати.
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
