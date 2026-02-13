"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const accentOutline =
    "accent-ring border-orange-400/30 hover:border-orange-400/50 hover:bg-orange-500/10 hover:shadow-orange-500/25";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    // ✅ важно: replace + refresh (за да видят server/middleware cookie-тата веднага)
    router.replace("/customers");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6 slide-up">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative h-[70px] w-[240px]">
            <Image
              src="/logo.png"
              alt="VSS Garage"
              fill
              priority
              className="object-contain"
              sizes="240px"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Вход <span className="text-orange-300">•</span>
            </h1>
            <p className="mt-2 text-gray-300">
              Въведи имейл и парола, за да продължиш.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Данни за достъп</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {err && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {err}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-200">Имейл</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="example@mail.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-200">Парола</label>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="outline"
                  className={`w-full ${accentOutline}`}
                  disabled={loading}
                >
                  {loading ? "Влизане..." : "Вход"}
                </Button>
              </div>
            </form>

            <div className="text-xs text-white/45 text-center pt-2">
              © {new Date().getFullYear()} VSS Garage
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
