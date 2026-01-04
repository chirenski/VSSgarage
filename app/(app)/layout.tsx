"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/customers", label: "Клиенти" },
  { href: "/vehicles", label: "Автомобили" },
  { href: "/work-orders", label: "Поръчки" },
  { href: "/mechanics", label: "Механици" },
  { href: "/invoices", label: "Фактури" },
  { href: "/reports", label: "Отчети" },
  { href: "/settings", label: "Настройки" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={[
        "group relative whitespace-nowrap rounded-md px-3 py-2",
        "text-[15px] font-medium tracking-wide transition-colors",
        active
          ? "text-white"
          : "text-gray-300 hover:text-white hover:bg-white/5",
      ].join(" ")}
    >
      {label}
      <span
        className={[
          "pointer-events-none absolute left-3 right-3 -bottom-[3px] h-[2px] rounded-full transition",
          active
            ? "bg-orange-400"
            : "bg-transparent group-hover:bg-orange-400/35",
        ].join(" ")}
      />
    </Link>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);

  // 🔸 същият accent hover като другите CTA бутони
  const accentOutline =
    "accent-ring border-orange-400/30 hover:border-orange-400/50 hover:bg-orange-500/10 hover:shadow-orange-500/25";

  const onLogout = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);

    try {
      const res = await fetch("/logout", { method: "POST" });

      if (!res.ok) {
        // ако има проблем, поне да не “замръзва”
        console.error("Logout failed:", await res.text());
      }

      // ✅ след logout → към login и refresh (важно за server auth)
      router.replace("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0f14]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-4">
          {/* LEFT: logo + nav */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {/* LOGO */}
            <Link href="/" className="flex-shrink-0">
              <div className="relative h-[64px] w-[220px]">
                <Image
                  src="/logo.png"
                  alt="VSS Garage"
                  fill
                  priority
                  className="object-contain"
                  sizes="220px"
                />
              </div>
            </Link>

            {/* NAV */}
            <nav className="hidden lg:flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto whitespace-nowrap pr-2 [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden">
                {links.map((l) => (
                  <NavLink key={l.href} href={l.href} label={l.label} />
                ))}
              </div>
            </nav>
          </div>

          {/* RIGHT: logout — ✅ POST + redirect */}
          <Button
            type="button"
            variant="outline"
            className={`flex-shrink-0 ${accentOutline}`}
            onClick={onLogout}
            disabled={logoutLoading}
          >
            {logoutLoading ? "..." : "Изход"}
          </Button>
        </div>

        {/* MOBILE */}
        <div className="lg:hidden mx-auto max-w-7xl px-6 pb-3">
          <div className="flex flex-wrap gap-1">
            {links.map((l) => (
              <NavLink key={l.href} href={l.href} label={l.label} />
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
