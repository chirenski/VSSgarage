import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function getMiddlewareUserAndResponse(request: NextRequest) {
  // Важно: правим response, върху който Supabase ще сетва cookies при refresh
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // getUser() в middleware контекст refresh-ва сесията, ако трябва
  const { data } = await supabase.auth.getUser();

  return { response, user: data.user ?? null };
}
