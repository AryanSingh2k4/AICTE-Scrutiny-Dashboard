// ==============================================================================
// ScrutiniX AICTE Scrutiny Engine — AI-Assisted Reasoning Test Suite
// Academic Year 2026–27 | Multi-Modal Evidence Synthesis Verification
// ==============================================================================

import {
  synthesizeForensicAnalysis,
  type ForensicEvidencePackage,
  type AiAnalysisReport,
} from "../lib/pipeline/ai-analyzer";
import { createClient } from "@supabase/supabase-js";
import { evaluateRule, type EvaluationInput } from "../lib/pipeline/rules-evaluator";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jowtilmwhyasyxuflwli.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvd3RpbG13aHlhc3l4dWZsd2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwOTM3NzQsImV4cCI6MjEwODY2OTc3NH0.5IwyT716WKc-xtgemDp294AgF1nbMk-jDDPpxigcK7A";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function testSpitBaseline() {
  console.log("\n=================================================================");
  console.log("TEST 1: SPIT (APP-2026-8941) Clean Benchmark Synthesis");
  console.log("=================================================================");

  const spitEvidence: ForensicEvidencePackage = {
    applicationId: "APP-2026-8941",
    institutionName: "Sardar Patel Institute of Technology",
    extractedFields: {
      institution_name: { value: "Sardar Patel Institute of Technology", confidence: 0.98 },
      valid_to: { value: "2028-06-30", confidence: 0.96 },
      approved_intake: { value: "300", confidence: 0.99 },
    },
    tamperResult: {
      isTampered: false,
      confidence: 0.95,
    },
    metadata: {
      creationDate: "2026-04-12T10:00:00Z",
      discrepancyHours: 1.0,
      producer: "ReportLab PDF Engine",
    },
    crossInstitutionCollision: {
      isDuplicate: false,
    },
    authorityVerifications: [
      {
        issuer: "State Technical Board / University (QR)",
        status: "verified",
        reference: "NOC/MAH/2026/9935",
        detail: "Approved Intake: 300",
      },
      {
        issuer: "National Board of Accreditation (NBA Registry)",
        status: "verified",
        reference: "NBA/2026/MAH-ENG-3686",
        detail: "Accreditation Tier-1 active through 2028-06-30",
      },
      {
        issuer: "Municipal Fire Services Adapter",
        status: "verified",
        reference: "MFB/CFO/NOC/2026/8812",
        detail: "Active Form B Renewal through 2028-06-30",
      },
    ],
    ruleEvaluations: [
      { ruleId: "EOA-DOC-01", title: "Mandatory Dossier Checklist", status: "PASS", severity: "critical", reason: "All documents present" },
      { ruleId: "EOA-EXP-01", title: "Affidavit Validity", status: "PASS", severity: "high", reason: "Valid" },
      { ruleId: "EOA-DUP-01", title: "Cryptographic Uniqueness", status: "PASS", severity: "critical", reason: "Unique SHA-256" },
      { ruleId: "EOA-ALT-01", title: "Error Level Analysis Baseline", status: "PASS", severity: "high", reason: "Clean baseline" },
      { ruleId: "EOA-META-01", title: "PDF Timestamp Alignment", status: "PASS", severity: "high", reason: "Aligned" },
      { ruleId: "EOA-FEE-01", title: "TER Fee Paid", status: "PASS", severity: "high", reason: "Paid" },
    ],
  };

  const report = await synthesizeForensicAnalysis(spitEvidence);

  console.log("SPIT Report Summary:");
  console.log("  - Overall Risk Score:", report.overallRiskScore);
  console.log("  - Risk Level:", report.riskLevel);
  console.log("  - Recommended Action:", report.statutoryRecommendation.action);
  console.log("  - Key Findings Count:", report.keyFindings.length);
  console.log("  - Executive Summary Preview:", report.executiveSummary.slice(0, 150) + "...");

  assert(report.overallRiskScore === 0.00, "SPIT overallRiskScore must be exactly 0.00");
  assert(report.riskLevel === "low", "SPIT riskLevel must be 'low'");
  assert(report.statutoryRecommendation.action === "accept", "SPIT recommended action must be 'accept'");
  assert(report.keyFindings.length === 0, "SPIT clean baseline must have 0 key findings");
  assert(report.executiveSummary.includes("Sardar Patel"), "Executive summary must cite Sardar Patel");
  assert(report.executiveSummary.includes("unconditional"), "Executive summary must recommend unconditional approval");
}

async function testLtceHighRisk() {
  console.log("\n=================================================================");
  console.log("TEST 2: LTCE (APP-2026-9012) High-Risk Multi-Modal Synthesis");
  console.log("=================================================================");

  const ltceEvidence: ForensicEvidencePackage = {
    applicationId: "APP-2026-9012",
    institutionName: "Lokmanya Tilak College of Engineering (LTCE)",
    extractedFields: {
      institution_name: { value: "Lokmanya Tilak College of Engineering (LTCE)", confidence: 0.98 },
      nba_score: { value: "382 / 400", confidence: 0.92 },
      valid_to: { value: "2028-06-30", confidence: 0.96 },
    },
    tamperResult: {
      isTampered: true,
      confidence: 0.92,
      reason: "Digital text splicing detected: white fill mask rectangle at coordinates [x: 380, y: 240, w: 80, h: 30]",
      boundingBox: { x: 380, y: 240, w: 80, h: 30 },
    },
    metadata: {
      creationDate: "2026-04-14T10:00:00Z",
      discrepancyHours: 25920.0, // Stated 2023 execution vs 2026 creation (>48h)
      producer: "ReportLab PDF Engine",
    },
    crossInstitutionCollision: {
      isDuplicate: true,
      collidingInstitution: "Sardar Patel Institute of Technology (APP-2026-8941)",
      collidingDocId: "DOC-APP-2026-8941-LAN",
    },
    authorityVerifications: [
      {
        issuer: "State Technical Board / University (QR Registry)",
        status: "verified",
        reference: "NOC/MAH/2026/8102",
        detail: "Approved Intake: 360",
      },
      {
        issuer: "National Board of Accreditation (NBA Registry)",
        status: "verified",
        reference: "NBA/2026/MAH-ENG-1035",
        detail: "Central Registry Score: 342 / 400 (Provisional Tier-II)",
      },
      {
        issuer: "Municipal Fire Services Adapter",
        status: "source_unavailable",
        reference: "https://municipalfire.maha.gov.in/api/v2/noc/verify",
        detail: "Endpoint timed out (503 Service Unavailable) after 5000ms. Routed to manual review queue.",
      },
    ],
    ruleEvaluations: [
      { ruleId: "EOA-DUP-01", title: "Exact Duplicate Land Title Deed", status: "FAIL", severity: "critical", reason: "Identical SHA-256 hash matched with APP-2026-8941 of Sardar Patel Institute of Technology" },
      { ruleId: "EOA-ALT-01", title: "Error Level Analysis Alteration", status: "FAIL", severity: "high", reason: "Possible digital alteration detected via ELA bounding box on score region" },
      { ruleId: "EOA-META-01", title: "PDF Metadata Discrepancy", status: "REVIEW", severity: "high", reason: "PDF creation metadata postdates stated stamp execution date by >48h" },
    ],
  };

  const report = await synthesizeForensicAnalysis(ltceEvidence);

  console.log("LTCE Report Summary:");
  console.log("  - Overall Risk Score:", report.overallRiskScore);
  console.log("  - Risk Level:", report.riskLevel);
  console.log("  - Recommended Action:", report.statutoryRecommendation.action);
  console.log("  - Key Findings Count:", report.keyFindings.length);
  for (const f of report.keyFindings) {
    console.log(`    * [${f.category.toUpperCase()}] (${f.severity}) ${f.title}`);
  }

  assert(report.overallRiskScore >= 0.70, `LTCE overallRiskScore (${report.overallRiskScore}) must be >= 0.70`);
  assert(report.riskLevel === "high", "LTCE riskLevel must be 'high'");
  assert(
    report.statutoryRecommendation.action === "recommend_physical_inspection" ||
    report.statutoryRecommendation.action === "request_clarification",
    "LTCE action must be 'recommend_physical_inspection' or 'request_clarification'"
  );

  // Check correlation of NBA score (342 vs 382)
  const nbaFinding = report.keyFindings.find((f) =>
    f.title.toLowerCase().includes("accreditation") || f.title.toLowerCase().includes("score")
  );
  assert(!!nbaFinding, "Must have an accreditation score finding");
  assert(nbaFinding!.evidenceText.includes("342") && nbaFinding!.evidenceText.includes("382"), "Must correlate official score 342 vs presented score 382");
  assert(Boolean(nbaFinding!.aphReference?.includes("Clause 1.3") || nbaFinding!.aphReference?.includes("Annexure 1")), "Must cite APH accreditation clause");

  // Check Fire NOC timeout explanation
  const fireFinding = report.keyFindings.find((f) =>
    f.title.toLowerCase().includes("fire") || f.category === "verification"
  );
  assert(!!fireFinding, "Must have a Fire NOC verification finding");
  assert(fireFinding!.evidenceText.includes("503") || fireFinding!.evidenceText.includes("timeout"), "Must explain HTTP 503 gateway timeout");
  assert(fireFinding!.evidenceText.includes("Manual Verification Queue"), "Must explain routing to manual review queue rather than automatic rejection");

  // Check metadata discrepancy >48h explanation
  const metaFinding = report.keyFindings.find((f) => f.category === "metadata");
  assert(!!metaFinding, "Must have a metadata discrepancy finding");
  assert(metaFinding!.evidenceText.includes("48"), "Must explain >48h threshold");
  assert(metaFinding!.evidenceText.includes("chronological inversion") || metaFinding!.evidenceText.includes("digital authoring"), "Must explain digital authoring anomaly");

  // Check duplicate land collision
  const dupFinding = report.keyFindings.find((f) => f.title.toLowerCase().includes("duplicate") || f.title.toLowerCase().includes("collision"));
  assert(!!dupFinding, "Must have a duplicate collision finding");
  assert(dupFinding!.evidenceText.includes("Sardar Patel"), "Must mention collision with Sardar Patel");
}

async function testLabCarpetAreaShortfall() {
  console.log("\n=================================================================");
  console.log("TEST 3: Lab Carpet Area Shortfall Synthesis");
  console.log("=================================================================");

  const labEvidence: ForensicEvidencePackage = {
    applicationId: "APP-2026-9015",
    institutionName: "ABC Institute of Technology",
    extractedFields: {
      laboratory_carpet_area_sqm: { value: "320", confidence: 0.95 }, // 320 / 300 = 1.07 sq.m/student (< 1.5 norm)
    },
    ruleEvaluations: [
      {
        ruleId: "EOA-INF-02",
        title: "Laboratory carpet area per student",
        status: "REVIEW",
        severity: "medium",
        reason: "Reported lab area (1.07 sq.m/student) is below advisory norm (1.50 sq.m/student).",
      },
    ],
  };

  const report = await synthesizeForensicAnalysis(labEvidence);
  console.log("Lab Shortfall Report Summary:");
  console.log("  - Action:", report.statutoryRecommendation.action);
  console.log("  - Key Findings:", report.keyFindings.map((f) => f.title));

  const labFinding = report.keyFindings.find((f) => f.title.toLowerCase().includes("laboratory"));
  assert(!!labFinding, "Must identify laboratory carpet area shortfall");
  assert(labFinding!.evidenceText.includes("1.5 sq.m"), "Must cite APH Chapter II 1.5 sq.m per student norm");
  assert(report.statutoryRecommendation.action === "recommend_physical_inspection", "Must recommend physical inspection committee");
}

async function testDatabaseValidationIntegration() {
  console.log("\n=================================================================");
  console.log("TEST 4: End-to-End Database Validation Route Simulation");
  console.log("=================================================================");

  for (const appId of ["APP-2026-8941", "APP-2026-9012"]) {
    console.log(`\nTesting Application: ${appId}`);
    const { data: application } = await supabase.from("applications").select("*").eq("id", appId).single();
    const { data: institution } = await supabase.from("institutions").select("*").eq("id", application?.institution_id).single();
    const { data: aicteRecord } = await supabase.from("aicte_records").select("*").eq("institution_id", application?.institution_id).single();
    const { data: documents } = await supabase.from("documents").select("*").eq("application_id", appId);
    const { data: extractedFields } = await supabase.from("extracted_fields").select("*");
    const { data: rules } = await supabase.from("rules").select("*").eq("active", true);
    const { data: allDocs } = await supabase.from("documents").select("id, file_name, sha256_hash, application_id");
    const { data: allApps } = await supabase.from("applications").select("id, institution_id, institutions(name)");
    const { data: existingAnomalies } = await supabase.from("anomaly_flags").select("*").eq("application_id", appId);

    const appMap = new Map<string, { institutionId: string; institutionName: string }>();
    for (const app of allApps || []) {
      const instName = Array.isArray(app.institutions)
        ? app.institutions[0]?.name || ""
        : (app.institutions as any)?.name || "";
      appMap.set(app.id, { institutionId: app.institution_id, institutionName: instName });
    }

    const allSystemDocumentHashes = (allDocs || []).map((d) => {
      const appInfo = appMap.get(d.application_id);
      return {
        sha256_hash: d.sha256_hash,
        application_id: d.application_id,
        institution_id: appInfo?.institutionId || "",
        institution_name: appInfo?.institutionName || "",
      };
    });

    const appDocs = documents || [];
    const appExtracted = (extractedFields || []).filter((f) => appDocs.some((d) => d.id === f.document_id));

    const evalInput: EvaluationInput = {
      application: application!,
      institution: institution!,
      aicteRecord: aicteRecord!,
      documents: appDocs,
      extractedFields: appExtracted,
      allSystemDocumentHashes,
      anomalyFlags: existingAnomalies || [],
    };

    const findings = (rules || []).map((r) => evaluateRule(r, evalInput));
    console.log(`  Non-pass findings for ${appId}:`, findings.filter((f) => f.status !== "PASS"));

    const verificationsToInsert: Array<{
      document_id: string;
      issuer_name: string;
      status: string;
      request_payload: Record<string, any>;
      response_payload: Record<string, any>;
    }> = [];

    for (const doc of appDocs) {
      if (doc.document_type === "noc_university") {
        verificationsToInsert.push({
          document_id: doc.id,
          issuer_name: "State Technical Board / University (QR Registry)",
          status: "verified",
          request_payload: { qr_url: doc.qr_payload },
          response_payload: { match: true, approved_intake: 300, issued_to: institution?.name },
        });
      }
      if (doc.document_type === "accreditation_nba") {
        const isLtce = appId === "APP-2026-9012";
        verificationsToInsert.push({
          document_id: doc.id,
          issuer_name: "National Board of Accreditation (NBA Registry)",
          status: "verified",
          request_payload: { registry: "NBA Central Registry", institution_id: application?.institution_id },
          response_payload: {
            match: true,
            score: isLtce ? "342 / 400" : "382 / 400",
            status: "Active",
          },
        });
      }
      if (doc.document_type === "fire_safety") {
        const isTimeout = appId === "APP-2026-9012";
        verificationsToInsert.push({
          document_id: doc.id,
          issuer_name: "Municipal Fire Services Adapter",
          status: isTimeout ? "source_unavailable" : "verified",
          request_payload: { endpoint: "https://municipalfire.maha.gov.in/api/v2/noc/verify" },
          response_payload: isTimeout
            ? { error: "Endpoint timed out (503 Service Unavailable) after 5000ms. Routed to manual review queue.", http_status: 503 }
            : { match: true, noc_status: "Active" },
        });
      }
    }

    const dupFinding = findings.find((f) => f.ruleId === "EOA-DUP-01" && (f.status === "REVIEW" || f.status === "FAIL"));
    const metaFinding = findings.find((f) => f.ruleId === "EOA-META-01" && (f.status === "REVIEW" || f.status === "FAIL"));
    const elaFinding = findings.find((f) => f.ruleId === "EOA-ALT-01" && (f.status === "REVIEW" || f.status === "FAIL"));

    const extractedFieldsMap: Record<string, { value: string; confidence: number }> = {};
    for (const f of appExtracted) {
      extractedFieldsMap[f.field_name] = { value: f.raw_value, confidence: f.confidence };
    }

    const authorityVerifs = verificationsToInsert.map((v) => ({
      issuer: v.issuer_name,
      status: v.status,
      reference: v.request_payload?.reference || v.request_payload?.qr_url || v.document_id,
      detail:
        v.response_payload?.error ||
        (v.status === "verified"
          ? `Verified active (${v.response_payload?.valid_until || v.response_payload?.score || "OK"})`
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
      applicationId: appId,
      institutionName: institution?.name || appId,
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
            collidingInstitution: (dupFinding.evidence as any)?.matching_institution_name || (dupFinding.evidence as any)?.matching_institution,
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

    const aiReport = await synthesizeForensicAnalysis(evidencePackage);

    console.log(`  Application: ${appId} (${institution?.name})`);
    console.log(`  - Overall Risk Score: ${aiReport.overallRiskScore}`);
    console.log(`  - Risk Level: ${aiReport.riskLevel}`);
    console.log(`  - Statutory Recommendation: ${aiReport.statutoryRecommendation.action}`);
    console.log(`  - Rationale: ${aiReport.statutoryRecommendation.rationale.slice(0, 120)}...`);

    if (appId === "APP-2026-8941") {
      assert(aiReport.overallRiskScore === 0.00, "SPIT must be 0.00 risk score");
      assert(aiReport.riskLevel === "low", "SPIT must be 'low' risk level");
      assert(aiReport.statutoryRecommendation.action === "accept", "SPIT must be recommended for 'accept'");
    } else if (appId === "APP-2026-9012") {
      assert(aiReport.overallRiskScore >= 0.70, "LTCE must be >= 0.70 risk score");
      assert(aiReport.riskLevel === "high", "LTCE must be 'high' risk level");
      assert(
        aiReport.statutoryRecommendation.action === "recommend_physical_inspection" ||
        aiReport.statutoryRecommendation.action === "request_clarification",
        "LTCE must be 'recommend_physical_inspection' or 'request_clarification'"
      );
    }
  }
}

async function main() {
  console.log("=================================================================");
  console.log("       AICTE SCRUTINIX AI REASONING & DECISION SUPPORT SUITE     ");
  console.log("=================================================================");

  await testSpitBaseline();
  await testLtceHighRisk();
  await testLabCarpetAreaShortfall();
  await testDatabaseValidationIntegration();

  console.log("\n=================================================================");
  console.log("       ALL AI REASONING TESTS COMPLETED WITH 100% SUCCESS!       ");
  console.log("=================================================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
