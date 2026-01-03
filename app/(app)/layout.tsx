"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let sub: any;

    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
      setReady(true);
    });

    sub = data.subscription;
    return () => sub?.unsubscribe?.();
  }, []);

  useEffect(() => {
    if (ready && !authed) router.replace("/login");
  }, [ready, authed, router]);

  if (!ready) return <div style={{ padding: 20 }}>Зареждане...</div>;

  return (
    <div style={{ fontFamily: "Arial" }}>
      <header style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <b>VSS Garage</b>
          <Link href="/">Начало</Link>
          <Link href="/customers">Клиенти</Link>
          <Link href="/vehicles">Автомобили</Link>
          <Link href="/work-orders">Работни карти</Link>
          <Link href="/work-orders/new">+ Нова РК</Link>
		   <Link href="/mechanics">Механици</Link>
        <Link href="/invoices">Фактури</Link>
        <Link href="/reports">Отчети</Link>
        <Link href="/settings">Настройки</Link>
        </div>

     <button
  type="button"
  onClick={async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("signOut error:", error);
    } finally {
      // твърд редирект, гарантирано
      window.location.href = "/login";
    }
  }}
>
  Изход
</button>
		
		
		
		
      </header>

      <main style={{ padding: 20 }}>{children}</main>
    </div>
  );
}
