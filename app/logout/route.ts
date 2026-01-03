
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient(); // 👈 await
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
