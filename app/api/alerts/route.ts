// ==============================================================================
// ScrutiniX AICTE Scrutiny Engine — Alerts Endpoint
// Academic Year 2026–27 | Officer-facing alert feed
// ==============================================================================

import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("alerts")
      .select(
        "id, application_id, alert_type, severity, title, message, is_resolved, created_at, applications(id, institution_id, institutions(name))"
      )
      .eq("is_resolved", false)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      return NextResponse.json({ alerts: [], error: error.message }, { status: 500 });
    }

    const alerts = (data || []).map((row: any) => {
      const application = Array.isArray(row.applications) ? row.applications[0] : row.applications;
      const institution = Array.isArray(application?.institutions)
        ? application.institutions[0]
        : application?.institutions;
      return {
        id: row.id,
        applicationId: row.application_id,
        alertType: row.alert_type,
        severity: row.severity,
        title: row.title,
        message: row.message,
        createdAt: row.created_at,
        institution: institution?.name || row.application_id,
      };
    });

    return NextResponse.json({ alerts });
  } catch (err: any) {
    console.error("GET /api/alerts error:", err);
    return NextResponse.json({ alerts: [], error: err?.message || "Unable to load alerts" }, { status: 500 });
  }
}
