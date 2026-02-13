import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // ✅ пазим сесия след refresh / рестарт
      persistSession: true,

      // ✅ refresh-ваме токена автоматично
      autoRefreshToken: true,

      // ✅ нужно за auth redirects (magic links, oauth callback и т.н.)
      detectSessionInUrl: true,

      storageKey: "vss-garage-auth",
    },
  }
);
