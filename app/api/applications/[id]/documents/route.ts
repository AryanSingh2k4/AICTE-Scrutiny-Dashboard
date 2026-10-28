// ==============================================================================
// ScrutiniX AICTE Scrutiny Engine — Application Documents & Anomalies Endpoint
// Academic Year 2026–27 | Dynamic Scrutiny Dossier
// ==============================================================================

import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const supabase = getServerSupabase();

    const [
      { data: documents, error: docErr },
      { data: anomalies, error: anomErr },
    ] = await Promise.all([
      supabase
        .from("documents")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("anomaly_flags")
        .select("*")
        .eq("application_id", applicationId)
        .order("flagged_at", { ascending: false }),
    ]);

    if (docErr) throw docErr;
    if (anomErr) throw anomErr;

    return NextResponse.json({
      applicationId,
      documents: documents || [],
      anomalies: anomalies || [],
    });
  } catch (err: any) {
    console.error("Error fetching application documents:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
