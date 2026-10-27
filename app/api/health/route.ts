import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from("rules").select("id").limit(1);

  if (error) {
    return NextResponse.json(
      { status: "degraded", database: "error", error: error.message },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: "healthy",
    platform: "ScrutiniX AICTE Scrutiny Suite",
    academic_year: "2026-27",
    mode: "advisory_decision_support",
    database: "connected",
    timestamp: new Date().toISOString(),
  });
}
