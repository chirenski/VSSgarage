"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function HomeGate() {
  const router = useRouter();

  useEffect(() => {
    const go = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) router.replace("/customers");
      else router.replace("/login");
    };

    go();
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center text-white/60">
      Зареждане...
    </div>
  );
}
