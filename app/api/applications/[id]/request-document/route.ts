// ==============================================================================
// ScrutiniX AICTE Scrutiny Engine — Missing Document Request Endpoint
// Academic Year 2026–27 | Writes an institution-facing alert + audit entry
// ==============================================================================

import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { CURRENT_OFFICER } from "@/lib/officer/identity";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const body = await request.json().catch(() => ({}));
    const documentType =
      typeof body?.documentType === "string" && body.documentType.trim()
        ? body.documentType.trim()
        : null;
    const officerName =
      typeof body?.officerName === "string" && body.officerName.trim()
        ? body.officerName.trim()
        : CURRENT_OFFICER.name;

    const supabase = getServerSupabase();

    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, institution_id")
      .eq("id", applicationId)
      .maybeSingle();

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const label = documentType ? documentType.replaceAll("_", " ") : "required document";
    const message = `Scrutiny desk requested the missing ${label} for application ${applicationId}.`;

    const { error: alertError } = await supabase.from("alerts").insert({
      application_id: applicationId,
      alert_type: "document_request",
      severity: "warning",
      title: "Missing document requested",
      message,
      is_resolved: false,
    });

    if (alertError) {
      return NextResponse.json(
        { error: `Could not record document request: ${alertError.message}` },
        { status: 500 }
      );
    }

    const { error: auditError } = await supabase.rpc("append_audit", {
      p_actor: officerName,
      p_actor_role: CURRENT_OFFICER.role,
      p_action: "REQUEST_MISSING_DOCUMENT",
      p_entity: "applications",
      p_entity_id: applicationId,
      p_payload: { document_type: documentType },
    });
    if (auditError) {
      console.warn("Could not append REQUEST_MISSING_DOCUMENT audit entry:", auditError.message);
    }

    return NextResponse.json({ success: true, message });
  } catch (err: any) {
    console.error("POST /api/applications/[id]/request-document error:", err);
    return NextResponse.json({ error: err?.message || "Unable to record document request" }, { status: 500 });
  }
}
