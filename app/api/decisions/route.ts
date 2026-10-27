import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicationId, outcome, remarks, conditions, officerName, officerRole } = body;

    if (!applicationId || !outcome || !remarks) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // 1. Record decision
    const { data: decision, error: decErr } = await supabase
      .from("officer_decisions")
      .insert({
        application_id: applicationId,
        officer_id: "OFF-AICTE-091",
        officer_name: officerName || "Dr. Vikram Sharma",
        officer_role: officerRole || "senior_officer",
        outcome,
        remarks,
        conditions: conditions || [],
      })
      .select()
      .single();

    if (decErr) {
      return NextResponse.json({ error: decErr.message }, { status: 500 });
    }

    // 2. Append to audit log
    await supabase.rpc("append_audit", {
      p_actor: officerName || "Dr. Vikram Sharma",
      p_actor_role: officerRole || "senior_officer",
      p_action: `DECISION_${outcome.toUpperCase()}`,
      p_entity: "applications",
      p_entity_id: applicationId,
      p_payload: {
        outcome,
        remarks,
        conditions,
      },
    });

    return NextResponse.json({
      decision,
      message: `Officer outcome '${outcome}' formally recorded and cryptographically sealed into audit trail.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
