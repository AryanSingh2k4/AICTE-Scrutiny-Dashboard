import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.rpc("verify_audit_chain");

  if (error) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }

  const result = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    status: result?.status || "ok",
    total_entries: result?.total_entries || 0,
    first_broken_id: result?.first_broken_id || null,
    verified_at: new Date().toISOString(),
    algorithm: "SHA-256 Hash Chain",
  });
}
