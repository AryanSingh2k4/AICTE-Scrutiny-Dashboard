import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from("rules").select("*").order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rules: data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, rule_spec, active, severity } = body;

    if (!id) {
      return NextResponse.json({ error: "Rule ID required" }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (rule_spec !== undefined) updatePayload.rule_spec = rule_spec;
    if (active !== undefined) updatePayload.active = active;
    if (severity !== undefined) updatePayload.severity = severity;

    const { data, error } = await supabase
      .from("rules")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Append to audit log
    await supabase.rpc("append_audit", {
      p_actor: "Officer S. Bose",
      p_actor_role: "senior_officer",
      p_action: "UPDATE_RULE",
      p_entity: "rules",
      p_entity_id: id,
      p_payload: updatePayload,
    });

    return NextResponse.json({ rule: data, message: `Rule ${id} updated and audit logged.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
