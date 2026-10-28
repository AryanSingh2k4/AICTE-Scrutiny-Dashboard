import { POST as anomalyHandler } from "../app/api/anomaly/[documentId]/route";
import { POST as validateHandler } from "../app/api/validate/[applicationId]/route";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function run() {
  console.log("\n=================================================================");
  console.log("       TESTING API ROUTES WITH AI_ANALYSIS PAYLOADS              ");
  console.log("=================================================================");

  // 1. Test POST /api/validate/APP-2026-8941 (SPIT)
  console.log("\n[1] Testing POST /api/validate/APP-2026-8941 (SPIT)...");
  const spitValidateRes = await validateHandler(
    new Request("http://localhost:3000/api/validate/APP-2026-8941", { method: "POST" }),
    { params: Promise.resolve({ applicationId: "APP-2026-8941" }) }
  );
  const spitValidateData = await spitValidateRes.json();
  console.log("SPIT Validate Status:", spitValidateRes.status);
  console.log("SPIT Validate overallRiskScore:", spitValidateData.overallRiskScore);
  console.log("SPIT ai_analysis recommendation:", spitValidateData.ai_analysis?.statutoryRecommendation?.action);
  console.log("SPIT ai_analysis riskLevel:", spitValidateData.ai_analysis?.riskLevel);
  assert(spitValidateRes.status === 200, "SPIT validate must return 200");
  assert(spitValidateData.overallRiskScore === 0.00, "SPIT risk score must be 0.00");
  assert(spitValidateData.ai_analysis !== undefined, "ai_analysis payload must be present in validate response");
  assert(spitValidateData.ai_analysis.statutoryRecommendation.action === "accept", "SPIT must recommend 'accept'");
  assert(spitValidateData.ai_analysis.riskLevel === "low", "SPIT risk level must be 'low'");

  // 2. Test POST /api/validate/APP-2026-9012 (LTCE)
  console.log("\n[2] Testing POST /api/validate/APP-2026-9012 (LTCE)...");
  const ltceValidateRes = await validateHandler(
    new Request("http://localhost:3000/api/validate/APP-2026-9012", { method: "POST" }),
    { params: Promise.resolve({ applicationId: "APP-2026-9012" }) }
  );
  const ltceValidateData = await ltceValidateRes.json();
  console.log("LTCE Validate Status:", ltceValidateRes.status);
  console.log("LTCE Validate overallRiskScore:", ltceValidateData.overallRiskScore);
  console.log("LTCE ai_analysis recommendation:", ltceValidateData.ai_analysis?.statutoryRecommendation?.action);
  console.log("LTCE ai_analysis riskLevel:", ltceValidateData.ai_analysis?.riskLevel);
  console.log("LTCE ai_analysis findings count:", ltceValidateData.ai_analysis?.keyFindings?.length);
  assert(ltceValidateRes.status === 200, "LTCE validate must return 200");
  assert(ltceValidateData.overallRiskScore >= 0.70, "LTCE risk score must be >= 0.70");
  assert(ltceValidateData.ai_analysis !== undefined, "ai_analysis payload must be present in validate response");
  assert(
    ltceValidateData.ai_analysis.statutoryRecommendation.action === "recommend_physical_inspection" ||
    ltceValidateData.ai_analysis.statutoryRecommendation.action === "request_clarification",
    "LTCE must recommend physical inspection or clarification"
  );
  assert(ltceValidateData.ai_analysis.riskLevel === "high", "LTCE risk level must be 'high'");

  // 3. Test POST /api/anomaly/DOC-APP-2026-9012-ACC (NBA Accreditation with alteration)
  console.log("\n[3] Testing POST /api/anomaly/DOC-APP-2026-9012-ACC...");
  const ltceAccRes = await anomalyHandler(
    new Request("http://localhost:3000/api/anomaly/DOC-APP-2026-9012-ACC", { method: "POST" }),
    { params: Promise.resolve({ documentId: "DOC-APP-2026-9012-ACC" }) }
  );
  const ltceAccData = await ltceAccRes.json();
  console.log("LTCE ACC Anomaly Status:", ltceAccRes.status);
  console.log("LTCE ACC Anomalies count:", ltceAccData.anomalies?.length);
  console.log("LTCE ACC ai_analysis present:", !!ltceAccData.ai_analysis);
  console.log("LTCE ACC ai_analysis summary:", ltceAccData.ai_analysis?.executiveSummary?.slice(0, 120));
  assert(ltceAccRes.status === 200, "Anomaly route must return 200");
  assert(ltceAccData.ai_analysis !== undefined, "ai_analysis must be present in anomaly response");

  // 4. Test POST /api/anomaly/DOC-APP-2026-8941-AFF (SPIT Affidavit clean)
  console.log("\n[4] Testing POST /api/anomaly/DOC-APP-2026-8941-AFF...");
  const spitAffRes = await anomalyHandler(
    new Request("http://localhost:3000/api/anomaly/DOC-APP-2026-8941-AFF", { method: "POST" }),
    { params: Promise.resolve({ documentId: "DOC-APP-2026-8941-AFF" }) }
  );
  const spitAffData = await spitAffRes.json();
  console.log("SPIT AFF Anomaly Status:", spitAffRes.status);
  console.log("SPIT AFF Anomalies count:", spitAffData.anomalies?.length);
  console.log("SPIT AFF ai_analysis risk:", spitAffData.ai_analysis?.overallRiskScore);
  assert(spitAffRes.status === 200, "Anomaly route must return 200");
  assert(spitAffData.ai_analysis !== undefined, "ai_analysis must be present in anomaly response");

  console.log("\n=================================================================");
  console.log("       ALL API ROUTE INTEGRATION TESTS PASSED 100%!              ");
  console.log("=================================================================");
}

run().catch((err) => {
  console.error("API test failed:", err);
  process.exit(1);
});
