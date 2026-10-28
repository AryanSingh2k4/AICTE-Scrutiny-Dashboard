// ==============================================================================
// ScrutiniX AICTE Scrutiny Engine — Officer Desk Overview Endpoint
// Academic Year 2026–27 | Live Database Aggregation
// ==============================================================================

import { NextResponse } from "next/server";
import { fetchOfficerOverview } from "@/lib/officer/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const overview = await fetchOfficerOverview();
    return NextResponse.json(overview);
  } catch (err: any) {
    console.error("GET /api/officer/overview error:", err);
    return NextResponse.json({ error: err?.message || "Unable to load officer overview" }, { status: 500 });
  }
}
