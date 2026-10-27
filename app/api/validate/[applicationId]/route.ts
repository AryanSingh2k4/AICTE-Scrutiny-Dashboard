import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { evaluateRule } from "@/lib/pipeline/rules-evaluator";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const supabase = getServerSupabase();

    // 1. Fetch application and related entities
    const { data: application, error: appErr } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appErr || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const [
      { data: institution },
      { data: aicteRecord },
      { data: documents },
      { data: extractedFields },
      { data: rules },
      { data: allHashes },
    ] = await Promise.all([
      supabase.from("institutions").select("*").eq("id", application.institution_id).single(),
      supabase.from("aicte_records").select("*").eq("institution_id", application.institution_id).single(),
      supabase.from("documents").select("*").eq("application_id", applicationId),
      supabase.from("extracted_fields").select("*"),
      supabase.from("rules").select("*").eq("active", true),
      supabase.from("documents").select("sha256_hash, application_id"),
    ]);

    const evalInput = {
      application,
      institution: institution || { id: application.institution_id, name: "Unknown", city: "Unknown", state: "Unknown" },
      aicteRecord: aicteRecord || { total_approved_intake: 300, faculty_count: 20, deficiency_status: "Nil", ter_payment_status: "paid" },
      documents: documents || [],
      extractedFields: (extractedFields || []).filter((f) => (documents || []).some((d) => d.id === f.document_id)),
      allSystemDocumentHashes: (allHashes || []).map((h) => ({
        sha256_hash: h.sha256_hash,
        application_id: h.application_id,
        institution_id: "",
      })),
    };

    // 2. Evaluate all rules
    const findings = (rules || []).map((r) => evaluateRule(r, evalInput));

    // 3. Clear old results and persist fresh results
    await supabase.from("validation_results").delete().eq("application_id", applicationId);

    const resultsToInsert = findings.map((f) => ({
      application_id: applicationId,
      document_id: f.documentId || null,
      rule_id: f.ruleId,
      rule_version: f.ruleVersion,
      status: f.status,
      severity: f.severity,
      message: f.message,
      evidence: f.evidence,
      confidence: f.confidence,
    }));

    if (resultsToInsert.length > 0) {
      await supabase.from("validation_results").insert(resultsToInsert);
    }

    // 4. Update application risk score and flags count
    const failCount = findings.filter((f) => f.status === "FAIL").length;
    const reviewCount = findings.filter((f) => f.status === "REVIEW").length;
    const flagsCount = failCount + reviewCount;
    const overallRisk = Math.min(1.0, Number((failCount * 0.4 + reviewCount * 0.2).toFixed(2)));

    await supabase
      .from("applications")
      .update({
        flags_count: flagsCount,
        overall_risk_score: overallRisk,
        system_status: flagsCount > 0 ? "findings_available" : "ready_for_review",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    // 5. Append to append-only audit trail
    await supabase.rpc("append_audit", {
      p_actor: "Officer Ananya Menon",
      p_actor_role: "scrutiny_officer",
      p_action: "REVALIDATE_APPLICATION",
      p_entity: "applications",
      p_entity_id: applicationId,
      p_payload: {
        rules_evaluated: rules?.length || 0,
        pass_count: findings.filter((f) => f.status === "PASS").length,
        fail_count: failCount,
        review_count: reviewCount,
        overall_risk_score: overallRisk,
      },
    });

    return NextResponse.json({
      applicationId,
      rulesEvaluated: rules?.length || 0,
      findingsCount: findings.length,
      flagsCount,
      overallRiskScore: overallRisk,
      findings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
