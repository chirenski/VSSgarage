import { NextRequest, NextResponse } from "next/server";
import { getMiddlewareUserAndResponse } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Публични пътища (без auth)
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/logout") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    pathname.startsWith("/logo.png") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons");

  // Обновяваме supabase cookies (refresh) и взимаме user
  const { response, user } = await getMiddlewareUserAndResponse(request);

  // Ако е public — пускаме
  if (isPublic) return response;

  // Ако е логнат — пускаме
  if (user) return response;

  // Ако НЕ е логнат — redirect към login
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

// Пази всичко, освен статични файлове с разширение (png, jpg, css, js и т.н.)
export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
