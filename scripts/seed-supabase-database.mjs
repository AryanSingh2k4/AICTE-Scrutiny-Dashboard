import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { evaluateRule } from "../lib/pipeline/rules-evaluator.ts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jowtilmwhyasyxuflwli.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvd3RpbG13aHlhc3l4dWZsd2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwOTM3NzQsImV4cCI6MjEwODY2OTc3NH0.5IwyT716WKc-xtgemDp294AgF1nbMk-jDDPpxigcK7A";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const seedPath = path.resolve(process.cwd(), "synthetic_data/seed_data.json");
const seedData = JSON.parse(fs.readFileSync(seedPath, "utf-8"));

// Add LTCE to datasets
const ltceInstitution = {
  id: "1-10358461",
  name: "Lokmanya Tilak College of Engineering (LTCE)",
  address: "Sector 4, Vikas Nagar, Koparkhairane",
  city: "Navi Mumbai",
  state: "Maharashtra",
  established_year: 1994,
  trust_society: "Lokmanya Tilak Jankalyan Shikshan Sanstha (Reg. F-2034)",
  principal_name: "Dr. Subhash K. Shinde",
  email: "principal@ltce.in",
  phone: "+91 22 2754 1005",
};

const ltceAicteRecord = {
  institution_id: "1-10358461",
  approved_programmes: [
    "Computer Engineering",
    "Mechanical Engineering",
    "Electronics & Telecommunication",
    "Artificial Intelligence & Data Science",
  ],
  total_approved_intake: 360,
  faculty_count: 24,
  deficiency_status: "Nil",
  ter_payment_status: "paid",
  last_eoa_year: "2025-26",
  last_scrutiny_status: "Approved",
};

const ltceApplication = {
  id: "APP-2026-9012",
  institution_id: "1-10358461",
  academic_year: "2026-27",
  application_category: "EoA Renewal",
  system_status: "ready_for_review",
  overall_risk_score: 0.10,
  flags_count: 0,
  submitted_at: "2026-10-27T14:30:49.399Z",
};

const ltceDocs = [
  {
    id: "DOC-APP-2026-9012-AFF",
    application_id: "APP-2026-9012",
    document_type: "affidavit",
    file_name: "APP-2026-9012_affidavit.pdf",
    file_size: 2404,
    storage_path: "documents/APP-2026-9012/APP-2026-9012_affidavit.pdf",
    sha256_hash: "20f2f9b5299cac642849476520e3e3c70c783cb7965b16d9b17072b458616dc2",
    phash: "0372ceaba132d0624257a92383548c83",
    qr_payload: null,
    is_scanned: false,
    page_count: 1,
    metadata: { producer: "ReportLab PDF Engine", creation_date: "2026-04-14T10:00:00Z", stated_issue_date: "2026-04-14T09:00:00Z" },
  },
  {
    id: "DOC-APP-2026-9012-NOC",
    application_id: "APP-2026-9012",
    document_type: "noc_university",
    file_name: "APP-2026-9012_noc_university.pdf",
    file_size: 4573,
    storage_path: "documents/APP-2026-9012/APP-2026-9012_noc_university.pdf",
    sha256_hash: "b9ae62789f7ce03a0da75620b259ca2827e430ffa0f1f94494722fddf1952b26",
    phash: "ba5043d691cd421361345dd05b147b02",
    qr_payload: "https://stateuniv.edu.in/verify?doc=NOC/MAH/2026/8102&inst=1-10358461",
    is_scanned: false,
    page_count: 1,
    metadata: { producer: "ReportLab PDF Engine", creation_date: "2026-04-14T10:00:00Z", stated_issue_date: "2026-04-14T09:00:00Z" },
  },
  {
    id: "DOC-APP-2026-9012-ACC",
    application_id: "APP-2026-9012",
    document_type: "accreditation_nba",
    file_name: "APP-2026-9012_accreditation_nba.pdf",
    file_size: 2258,
    storage_path: "documents/APP-2026-9012/APP-2026-9012_accreditation_nba.pdf",
    sha256_hash: "4e80e8d8233bc23bd737d6847513db2cc279ef82416378b97f82562f136d78fb",
    phash: "f961965c7c83e6b0f19a4f04d5b9ebf2",
    qr_payload: null,
    is_scanned: false,
    page_count: 1,
    metadata: { producer: "ReportLab PDF Engine", creation_date: "2026-04-14T10:00:00Z", stated_issue_date: "2026-04-14T09:00:00Z" },
  },
  {
    id: "DOC-APP-2026-9012-FIR",
    application_id: "APP-2026-9012",
    document_type: "fire_safety",
    file_name: "APP-2026-9012_fire_safety.pdf",
    file_size: 2414,
    storage_path: "documents/APP-2026-9012/APP-2026-9012_fire_safety.pdf",
    sha256_hash: "493c6e32d218e0e4f969787dd2965e40f7e271921b9231bc73dbdb6d01043833",
    phash: "5d9018c725e70f4ef505d9ac846e0f66",
    qr_payload: null,
    is_scanned: true,
    page_count: 1,
    metadata: { producer: "ReportLab PDF Engine", creation_date: "2026-04-14T10:00:00Z", stated_issue_date: "2026-04-14T09:00:00Z" },
  },
  {
    id: "DOC-APP-2026-9012-LAN",
    application_id: "APP-2026-9012",
    document_type: "land_ownership",
    file_name: "APP-2026-9012_land_ownership.pdf",
    file_size: 2425,
    storage_path: "documents/APP-2026-9012/APP-2026-9012_land_ownership.pdf",
    sha256_hash: "f157dda0a075a85669bc9451c84dc4418b982a1b668ecb2e378332e4223a8dd0",
    phash: "c718fba26770cd1c0361a4d77eecb794",
    qr_payload: null,
    is_scanned: false,
    page_count: 1,
    metadata: { producer: "ReportLab PDF Engine", creation_date: "2026-04-14T10:00:00Z", stated_issue_date: "2026-04-14T09:00:00Z" },
  },
];

const allInstitutions = [...seedData.institutions, ltceInstitution];
const allAicteRecords = [...seedData.aicte_records, ltceAicteRecord];
const allApplications = [...seedData.applications, ltceApplication];
const allDocuments = [...seedData.documents, ...ltceDocs];

console.log("Seeding institutions...");
await supabase.from("institutions").upsert(allInstitutions, { onConflict: "id" });

console.log("Seeding AICTE records...");
await supabase.from("aicte_records").upsert(allAicteRecords, { onConflict: "institution_id" });

console.log("Seeding applications...");
await supabase.from("applications").upsert(allApplications, { onConflict: "id" });

console.log("Seeding documents...");
for (let i = 0; i < allDocuments.length; i += 50) {
  const chunk = allDocuments.slice(i, i + 50);
  await supabase.from("documents").upsert(chunk, { onConflict: "id" });
}

console.log("Seeding extracted fields (clean)...");
await supabase.from("extracted_fields").delete().neq("document_id", "dummy");

const allFields = [...seedData.extracted_fields];
allFields.push(
  { document_id: "DOC-APP-2026-9012-NOC", field_name: "institution_name", raw_value: "Lokmanya Tilak College of Engineering (LTCE)", confidence: 0.98, page_number: 1, source: "unpdf_text_layer" },
  { document_id: "DOC-APP-2026-9012-NOC", field_name: "valid_to", raw_value: "2027-08-31", confidence: 0.96, page_number: 1, source: "regex_date_parser" },
  { document_id: "DOC-APP-2026-9012-ACC", field_name: "institution_name", raw_value: "Lokmanya Tilak College of Engineering (LTCE)", confidence: 0.98, page_number: 1, source: "unpdf_text_layer" },
  { document_id: "DOC-APP-2026-9012-ACC", field_name: "valid_to", raw_value: "2028-06-30", confidence: 0.96, page_number: 1, source: "regex_date_parser" },
  { document_id: "DOC-APP-2026-9012-FIR", field_name: "institution_name", raw_value: "Lokmanya Tilak College of Engineering (LTCE)", confidence: 0.98, page_number: 1, source: "unpdf_text_layer" },
  { document_id: "DOC-APP-2026-9012-FIR", field_name: "valid_to", raw_value: "2027-08-31", confidence: 0.96, page_number: 1, source: "regex_date_parser" },
  { document_id: "DOC-APP-2026-9012-LAN", field_name: "institution_name", raw_value: "Lokmanya Tilak College of Engineering (LTCE)", confidence: 0.98, page_number: 1, source: "unpdf_text_layer" },
  { document_id: "DOC-APP-2026-9012-AFF", field_name: "institution_name", raw_value: "Lokmanya Tilak College of Engineering (LTCE)", confidence: 0.98, page_number: 1, source: "unpdf_text_layer" }
);

for (let i = 0; i < allFields.length; i += 50) {
  const chunk = allFields.slice(i, i + 50);
  await supabase.from("extracted_fields").insert(chunk);
}

console.log("Seeding verification results (clean)...");
await supabase.from("verification_results").delete().neq("issuer_name", "dummy");
const allVerifications = [...seedData.verification_results];
allVerifications.push({
  document_id: "DOC-APP-2026-9012-NOC",
  issuer_name: "State Technical University, Maharashtra",
  method: "qr_payload",
  status: "verified",
  request_payload: { qr_url: "https://stateuniv.edu.in/verify?doc=NOC/MAH/2026/8102&inst=1-10358461" },
  response_payload: { match: true, intake: 360, issued_to: "Lokmanya Tilak College of Engineering (LTCE)" },
  verified_at: new Date().toISOString()
});

for (let i = 0; i < allVerifications.length; i += 50) {
  const chunk = allVerifications.slice(i, i + 50);
  await supabase.from("verification_results").insert(chunk);
}

console.log("Seeding anomaly flags (clean ground truth)...");
await supabase.from("anomaly_flags").delete().neq("severity", "dummy");
const groundTruthAnomalies = [
  {
    application_id: "APP-2026-8949",
    document_id: "DOC-APP-2026-8949-ACC",
    anomaly_type: "image_tamper_ela",
    severity: "high",
    confidence: 0.84,
    reason: "Possible digital alteration detected on accreditation score via Error Level Analysis (confidence 0.84)",
    evidence: { variance_score: 0.84, baseline: 0.35, bbox: { x: 380, y: 240, width: 80, height: 30 } },
    page_number: 1,
  },
  {
    application_id: "APP-2026-8947",
    document_id: "DOC-APP-2026-8947-LAN",
    anomaly_type: "duplicate_document",
    severity: "high",
    confidence: 1.0,
    reason: "Exact duplicate land deed file hash submitted across distinct institutions (matches Sardar Patel APP-2026-8941)",
    evidence: { duplicate_application_id: "APP-2026-8941", matching_hash: "9535f7a9f70927e7f6ebc2c831b2a662e198ef29140af09feaec2e1272993634" },
    page_number: 1,
  },
  {
    application_id: "APP-2026-8948",
    document_id: "DOC-APP-2026-8948-AFF",
    anomaly_type: "metadata_inconsistency",
    severity: "medium",
    confidence: 0.95,
    reason: "PDF metadata creation date (October 2026) postdates stated legal stamp date (May 2024)",
    evidence: { creation_date: "2026-10-12T10:00:00Z", stated_date: "2024-05-10T00:00:00Z", divergence_days: 886 },
    page_number: 1,
  },
  {
    application_id: "APP-2026-8943",
    document_id: "DOC-APP-2026-8943-FIR",
    anomaly_type: "cross_document_inconsistency",
    severity: "medium",
    confidence: 0.92,
    reason: "Institution name on Fire NOC lists polytechnic subsidiary rather than degree institute",
    evidence: { noc_name: "Vishwakarma Polytechnic", application_name: "Vishwakarma Institute of Technology", similarity: 0.72 },
    page_number: 1,
  },
  {
    application_id: "APP-2026-8942",
    document_id: "DOC-APP-2026-8942-ACC",
    anomaly_type: "expired_evidence",
    severity: "high",
    confidence: 1.0,
    reason: "Accreditation expired on 30 June 2025 prior to commencement of AY 2026-27",
    evidence: { expiry_date: "2025-06-30", academic_year_start: "2026-07-01" },
    page_number: 1,
  },
  {
    application_id: "APP-2026-8950",
    document_id: null,
    anomaly_type: "missing_evidence",
    severity: "high",
    confidence: 1.0,
    reason: "Mandatory municipal fire safety NOC omitted from application dossier",
    evidence: { missing_document_type: "fire_safety", rule_ref: "EOA-DOC-04" },
    page_number: 1,
  },
  {
    application_id: "APP-2026-8951",
    document_id: "DOC-APP-2026-8951-NOC",
    anomaly_type: "issuer_timeout",
    severity: "medium",
    confidence: 0.90,
    reason: "State Technical University verification portal timed out (503); routed to manual review",
    evidence: { issuer: "State Technical University", endpoint: "https://stateuniv.edu.in/verify", http_status: 503 },
    page_number: 1,
  },
];
await supabase.from("anomaly_flags").insert(groundTruthAnomalies);

// Fetch active rules to run pre-evaluation
const { data: rules } = await supabase.from("rules").select("*").eq("active", true);

console.log(`Running dynamic rules engine across ${allApplications.length} applications with ${rules?.length || 0} active rules...`);

const validationResultsToInsert = [];
const allHashes = allDocuments.map((d) => ({
  sha256_hash: d.sha256_hash,
  application_id: d.application_id,
  institution_id: allApplications.find((a) => a.id === d.application_id)?.institution_id || "",
}));

for (const app of allApplications) {
  const inst = allInstitutions.find((i) => i.id === app.institution_id);
  const aicte = allAicteRecords.find((r) => r.institution_id === app.institution_id);
  const docs = allDocuments.filter((d) => d.application_id === app.id);
  const fields = allFields.filter((f) => docs.some((d) => d.id === f.document_id));

  const evalInput = {
    application: app,
    institution: inst,
    aicteRecord: aicte,
    documents: docs,
    extractedFields: fields,
    allSystemDocumentHashes: allHashes,
  };

  for (const rule of rules || []) {
    const res = evaluateRule(rule, evalInput);
    validationResultsToInsert.push({
      application_id: app.id,
      document_id: res.documentId || null,
      rule_id: res.ruleId,
      rule_version: res.ruleVersion,
      status: res.status,
      severity: res.severity,
      message: res.message,
      evidence: res.evidence,
      confidence: res.confidence,
    });
  }
}

console.log("Clearing previous evaluation findings...");
await supabase.from("validation_results").delete().neq("rule_version", "none");

console.log(`Inserting ${validationResultsToInsert.length} evaluation findings into validation_results...`);
for (let i = 0; i < validationResultsToInsert.length; i += 50) {
  const chunk = validationResultsToInsert.slice(i, i + 50);
  await supabase.from("validation_results").insert(chunk);
}

console.log("Seeding demo profiles (maintaining auth IDs)...");
const demoProfiles = [
  { email: "officer@aicte.gov.in", full_name: "Dr. Ananya Menon", role: "scrutiny_officer" },
  { email: "vikram.sharma@aicte.gov.in", full_name: "Dr. Vikram Sharma", role: "senior_officer" },
  { email: "principal@sardarpatel.edu.in", full_name: "Principal, Sardar Patel", role: "institution", institution_id: "1-3686579303" },
  { email: "principal@ltce.in", full_name: "Dr. Subhash K. Shinde (Principal, LTCE)", role: "institution", institution_id: "1-10358461" },
  { email: "k.subramanian@cag.gov.in", full_name: "K. Subramanian", role: "auditor" }
];

await supabase.from("profiles").upsert(demoProfiles, { onConflict: "email" });

console.log("Database successfully seeded and evaluated!");
