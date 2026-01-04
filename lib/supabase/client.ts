import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // ❌ НЕ пазим сесия след refresh / рестарт
      persistSession: false,

      // ❌ НЕ refresh-ваме токена автоматично
      autoRefreshToken: false,

      // ✅ нужно за auth redirects
      detectSessionInUrl: true,

      // ключът може да остане, но реално няма да се ползва
      storageKey: "vss-garage-auth",
    },
  }
);
