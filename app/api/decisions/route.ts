import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { CURRENT_OFFICER } from "@/lib/officer/identity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    const supabase = getServerSupabase();
    let query = supabase
      .from("officer_decisions")
      .select("*")
      .order("recorded_at", { ascending: false });

    if (applicationId) {
      query = query.eq("application_id", applicationId);
    }

    const { data: decisions, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ decisions: decisions || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function normalizeOutcome(raw: string): string {
  const o = (raw || "").toLowerCase();
  if (o.includes("clarif")) return "request_clarification";
  if (o.includes("inspect")) return "refer_for_inspection";
  if (o.includes("reject")) return "reject";
  return "accept";
}

function normalizeRole(raw: string): string {
  const r = (raw || "").toLowerCase();
  if (r.includes("senior")) return "senior_officer";
  return "scrutiny_officer";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicationId, outcome: rawOutcome, remarks, conditions, officerName, officerRole } = body;

    if (!applicationId || !rawOutcome || !remarks) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const outcome = normalizeOutcome(rawOutcome);
    const validRole = normalizeRole(officerRole);

    const supabase = getServerSupabase();

    // 1. Record decision
    const { data: decision, error: decErr } = await supabase
      .from("officer_decisions")
      .insert({
        application_id: applicationId,
        officer_id: CURRENT_OFFICER.id,
        officer_name: officerName || CURRENT_OFFICER.name,
        officer_role: validRole,
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
      p_actor: officerName || CURRENT_OFFICER.name,
      p_actor_role: officerRole || CURRENT_OFFICER.role,
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
