import { NextRequest, NextResponse } from "next/server";
import { getMiddlewareUserAndResponse } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths (без auth)
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

  // refresh cookies + user
  const { response, user } = await getMiddlewareUserAndResponse(request);

  if (isPublic) return response;
  if (user) return response;

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // match everything except files with extension (png, jpg, css, js, ...)
  matcher: ["/((?!.*\\..*).*)"],
};
