import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.signOut();

  const url = new URL(req.url);
  url.pathname = "/login";
  return NextResponse.redirect(url);
}
