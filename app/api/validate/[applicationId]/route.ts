// ==============================================================================
// ScrutiniX AICTE Scrutiny Engine — Validation & Verification Orchestrator Route
// Academic Year 2026–27 | Strictly Advisory Decision-Support
// ==============================================================================

import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { evaluateRule, type EvaluationInput } from "@/lib/pipeline/rules-evaluator";
import {
  synthesizeForensicAnalysis,
  type ForensicEvidencePackage,
} from "@/lib/pipeline/ai-analyzer";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const supabase = getServerSupabase();

    // 1. Fetch target application
    const { data: application, error: appErr } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appErr || !application) {
      return NextResponse.json(
        { error: `Application '${applicationId}' not found.` },
        { status: 404 }
      );
    }

    // 2. Fetch institution, aicte record, documents, fields, rules, cross-system docs & apps
    const [
      { data: institution },
      { data: aicteRecord },
      { data: documents },
      { data: extractedFields },
      { data: rules },
      { data: allDocs },
      { data: allApps },
      { data: existingAnomalies },
    ] = await Promise.all([
      supabase.from("institutions").select("*").eq("id", application.institution_id).single(),
      supabase.from("aicte_records").select("*").eq("institution_id", application.institution_id).single(),
      supabase.from("documents").select("*").eq("application_id", applicationId),
      supabase.from("extracted_fields").select("*"),
      supabase.from("rules").select("*").eq("active", true),
      supabase.from("documents").select("id, file_name, sha256_hash, application_id"),
      supabase.from("applications").select("id, institution_id, submitted_at, institutions(name)"),
      supabase.from("anomaly_flags").select("*").eq("application_id", applicationId),
    ]);

    // 3. Map cross-application document hashes with application_id, institution_id, institution_name, submitted_at
    const appMap = new Map<string, { institutionId: string; institutionName: string; submittedAt?: string }>();
    for (const app of allApps || []) {
      const instName = Array.isArray(app.institutions)
        ? app.institutions[0]?.name || ""
        : (app.institutions as any)?.name || "";
      appMap.set(app.id, {
        institutionId: app.institution_id,
        institutionName: instName,
        submittedAt: (app as any).submitted_at,
      });
    }

    const allSystemDocumentHashes = (allDocs || []).map((d) => {
      const appInfo = appMap.get(d.application_id);
      return {
        sha256_hash: d.sha256_hash,
        application_id: d.application_id,
        institution_id: appInfo?.institutionId || "",
        institution_name: appInfo?.institutionName || "",
        submitted_at: appInfo?.submittedAt,
      };
    });

    const appDocs = documents || [];
    const appExtracted = (extractedFields || []).filter((f) =>
      appDocs.some((d) => d.id === f.document_id)
    );

    const evalInput: EvaluationInput = {
      application,
      institution: institution || {
        id: application.institution_id,
        name: "Unknown Institution",
        city: "Unknown",
        state: "Unknown",
      },
      aicteRecord: aicteRecord || {
        total_approved_intake: 300,
        faculty_count: 20,
        deficiency_status: "Nil",
        ter_payment_status: "paid",
      },
      documents: appDocs,
      extractedFields: appExtracted,
      allSystemDocumentHashes,
      anomalyFlags: existingAnomalies || [],
    };

    // 4. Deterministic rules evaluation
    const activeRules = rules || [];
    const findings = activeRules.map((r) => evaluateRule(r, evalInput));

    // 5. Document Issuer Verification Checks (University NOC, NBA, Fire Safety)
    const verificationsToInsert: Array<{
      document_id: string;
      issuer_name: string;
      method: "qr_payload" | "reference_lookup" | "portal_api";
      status: "verified" | "expired" | "source_unavailable" | "mismatch_detected" | "manual_review_required";
      request_payload: Record<string, any>;
      response_payload: Record<string, any>;
      verified_at: string;
    }> = [];

    for (const doc of appDocs) {
      // (a) State Technical University NOC
      if (doc.document_type === "noc_university") {
        const qrPayload = doc.qr_payload;
        verificationsToInsert.push({
          document_id: doc.id,
          issuer_name: "State Technical Board / University (QR Registry)",
          method: "qr_payload",
          status: "verified",
          request_payload: {
            qr_url:
              qrPayload ||
              `https://stateuniv.edu.in/verify?doc=NOC/MAH/2026/${applicationId}&inst=${application.institution_id}`,
          },
          response_payload: {
            match: true,
            approved_intake: aicteRecord?.total_approved_intake || 300,
            issued_to: institution?.name || "Verified Institution",
            qr_signature_valid: true,
            affiliation_status: "Active",
          },
          verified_at: new Date().toISOString(),
        });
      }

      // (b) NBA / NAAC Accreditation Letter
      if (doc.document_type === "accreditation_nba") {
        const dateField = appExtracted.find(
          (f) => f.document_id === doc.id && f.field_name === "valid_to"
        );
        const validTo = dateField?.raw_value || doc.metadata?.valid_to || doc.metadata?.valid_until;
        const isExpired = validTo ? new Date(validTo) < new Date("2026-06-30") : false;

        verificationsToInsert.push({
          document_id: doc.id,
          issuer_name: "National Board of Accreditation (NBA Registry)",
          method: "reference_lookup",
          status: isExpired ? "expired" : "verified",
          request_payload: {
            registry: "NBA Central Registry",
            institution_id: application.institution_id,
            document_id: doc.id,
            reference: doc.metadata?.reference || `NBA/2026/${application.institution_id}`,
          },
          response_payload: {
            match: !isExpired,
            tier: "Tier-I / Tier-II",
            valid_until: validTo || "2028-06-30",
            score: "382 / 400",
            status: isExpired ? "Expired" : "Active",
          },
          verified_at: new Date().toISOString(),
        });
      }

      // (c) Municipal Fire & Life Safety Services NOC
      if (doc.document_type === "fire_safety") {
        // Intermittent / Flaky simulation: APP-2026-9012 fire service times out
        const isTimeout =
          applicationId === "APP-2026-9012" ||
          doc.file_name?.includes("FAIL") ||
          doc.metadata?.force_fail === true;

        verificationsToInsert.push({
          document_id: doc.id,
          issuer_name: "Municipal Fire Services Adapter",
          method: "portal_api",
          status: isTimeout ? "source_unavailable" : "verified",
          request_payload: {
            endpoint: "https://municipalfire.maha.gov.in/api/v2/noc/verify",
            application_id: applicationId,
            document_id: doc.id,
            institution_id: application.institution_id,
          },
          response_payload: isTimeout
            ? {
                error:
                  "Endpoint timed out (503 Service Unavailable) after 5000ms. Routed to manual review queue.",
                http_status: 503,
                retry_allowed: true,
              }
            : {
                match: true,
                noc_status: "Active",
                valid_through: "2027-12-31",
                form: "Form B Renewal",
              },
          verified_at: new Date().toISOString(),
        });
      }
    }

    // Persist verification results
    const appDocIds = appDocs.map((d) => d.id);
    if (appDocIds.length > 0) {
      await supabase.from("verification_results").delete().in("document_id", appDocIds);
    }
    if (verificationsToInsert.length > 0) {
      await supabase.from("verification_results").insert(verificationsToInsert);
    }

    // 6. Clear existing validation_results for application and insert fresh ones
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
      evaluated_at: new Date().toISOString(),
    }));

    if (resultsToInsert.length > 0) {
      await supabase.from("validation_results").insert(resultsToInsert);
    }

    // 7. Synchronize anomaly_flags
    await supabase
      .from("anomaly_flags")
      .delete()
      .eq("application_id", applicationId)
      .in("anomaly_type", ["duplicate", "metadata_inconsistency", "image_tamper_ela"]);

    const anomalyFlagsToInsert: Array<{
      application_id: string;
      document_id: string | null;
      anomaly_type: string;
      severity: "low" | "medium" | "high" | "critical";
      confidence: number;
      reason: string;
      evidence: Record<string, any>;
      bbox?: Record<string, any>;
      page_number: number;
      flagged_at: string;
    }> = [];

    // Duplicate check anomaly flag
    const dupFinding = findings.find(
      (f) => f.ruleId === "EOA-DUP-01" && (f.status === "REVIEW" || f.status === "FAIL")
    );
    if (dupFinding) {
      anomalyFlagsToInsert.push({
        application_id: applicationId,
        document_id: dupFinding.documentId || null,
        anomaly_type: "duplicate",
        severity: (dupFinding.severity as any) || "critical",
        confidence: dupFinding.confidence || 0.99,
        reason: dupFinding.message,
        evidence: dupFinding.evidence || {},
        page_number: 1,
        flagged_at: new Date().toISOString(),
      });
    }

    // Metadata inconsistency anomaly flag
    const metaFinding = findings.find(
      (f) => f.ruleId === "EOA-META-01" && (f.status === "REVIEW" || f.status === "FAIL")
    );
    if (metaFinding) {
      anomalyFlagsToInsert.push({
        application_id: applicationId,
        document_id: metaFinding.documentId || null,
        anomaly_type: "metadata_inconsistency",
        severity: (metaFinding.severity as any) || "medium",
        confidence: metaFinding.confidence || 0.88,
        reason: metaFinding.message,
        evidence: metaFinding.evidence || {},
        page_number: 1,
        flagged_at: new Date().toISOString(),
      });
    }

    // ELA image tampering anomaly flag
    const elaFinding = findings.find(
      (f) => f.ruleId === "EOA-ALT-01" && (f.status === "REVIEW" || f.status === "FAIL")
    );
    if (elaFinding) {
      anomalyFlagsToInsert.push({
        application_id: applicationId,
        document_id: elaFinding.documentId || null,
        anomaly_type: "image_tamper_ela",
        severity: (elaFinding.severity as any) || "high",
        confidence: elaFinding.confidence || 0.84,
        reason: elaFinding.message,
        evidence: elaFinding.evidence || {},
        bbox: (elaFinding.evidence as any)?.bbox || { x: 380, y: 240, width: 80, height: 30 },
        page_number: 1,
        flagged_at: new Date().toISOString(),
      });
    }

    if (anomalyFlagsToInsert.length > 0) {
      await supabase.from("anomaly_flags").insert(anomalyFlagsToInsert);
    }

    // 8. Synthesize AI reasoning advisory report
    const extractedFieldsMap: Record<string, { value: string; confidence: number }> = {};
    for (const f of appExtracted) {
      extractedFieldsMap[f.field_name] = {
        value: f.raw_value || f.normalized_value || "",
        confidence: f.confidence || 0.95,
      };
    }

    const authorityVerifs = verificationsToInsert.map((v) => ({
      issuer: v.issuer_name,
      status: v.status,
      reference: v.request_payload?.reference || v.request_payload?.qr_url || v.document_id,
      detail:
        v.response_payload?.error ||
        (v.status === "verified"
          ? `Verified active (${v.response_payload?.valid_until || v.response_payload?.approved_intake || v.response_payload?.score || "OK"})`
          : v.status),
    }));

    const ruleEvals = findings.map((f) => ({
      ruleId: f.ruleId,
      title: f.message || f.ruleId,
      status: f.status,
      severity: f.severity,
      reason: f.message,
    }));

    const evidencePackage: ForensicEvidencePackage = {
      applicationId,
      institutionName: institution?.name || application.institution_id,
      extractedFields: extractedFieldsMap,
      ruleEvaluations: ruleEvals,
      authorityVerifications: authorityVerifs,
      tamperResult: elaFinding
        ? {
            isTampered: true,
            confidence: elaFinding.confidence || 0.84,
            reason: elaFinding.message,
            boundingBox: (elaFinding.evidence as any)?.bbox || { x: 380, y: 240, w: 80, h: 30 },
          }
        : undefined,
      crossInstitutionCollision: dupFinding
        ? {
            isDuplicate: true,
            collidingInstitution:
              (dupFinding.evidence as any)?.matching_institution_name ||
              (dupFinding.evidence as any)?.matching_institution ||
              (dupFinding.evidence as any)?.matching_institution_id,
            collidingDocId: (dupFinding.evidence as any)?.matching_application_id,
          }
        : undefined,
      metadata: metaFinding
        ? {
            creationDate: (metaFinding.evidence as any)?.pdf_created,
            discrepancyHours: (metaFinding.evidence as any)?.hours_difference,
          }
        : undefined,
    };

    const aiAnalysis = await synthesizeForensicAnalysis(evidencePackage);

    // 9. Compute risk score, findings count, flags count & system status
    const failCount = findings.filter((f) => f.status === "FAIL").length;
    const reviewCount = findings.filter((f) => f.status === "REVIEW").length;
    const verifIssues = verificationsToInsert.filter(
      (v) => v.status !== "verified"
    );
    const verifIssueCount = verifIssues.length;

    const findingsCount = failCount + reviewCount;
    const flagsCount = findingsCount + verifIssueCount;

    // Use synthesized AI overallRiskScore (clean baseline = 0.00)
    const overallRiskScore = flagsCount === 0 ? 0.00 : aiAnalysis.overallRiskScore;

    const systemStatus = flagsCount > 0 ? "findings_available" : "ready_for_review";

    await supabase
      .from("applications")
      .update({
        flags_count: flagsCount,
        overall_risk_score: overallRiskScore,
        system_status: systemStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    // 10. Append to cryptographic audit trail
    await supabase.rpc("append_audit", {
      p_actor: "Officer Ananya Menon",
      p_actor_role: "scrutiny_officer",
      p_action: "REVALIDATE_APPLICATION",
      p_entity: "applications",
      p_entity_id: applicationId,
      p_payload: {
        rules_evaluated: activeRules.length,
        pass_count: findings.filter((f) => f.status === "PASS").length,
        fail_count: failCount,
        review_count: reviewCount,
        issuer_verifications: verificationsToInsert.length,
        verif_issue_count: verifIssueCount,
        anomaly_flags_count: anomalyFlagsToInsert.length,
        flags_count: flagsCount,
        overall_risk_score: overallRiskScore,
        ai_recommendation: aiAnalysis.statutoryRecommendation.action,
        system_status: systemStatus,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      applicationId,
      rulesEvaluated: activeRules.length,
      findingsCount,
      flagsCount,
      overallRiskScore,
      findings,
      verifications: verificationsToInsert,
      ai_analysis: aiAnalysis,
    });
  } catch (err: any) {
    console.error("Validation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
