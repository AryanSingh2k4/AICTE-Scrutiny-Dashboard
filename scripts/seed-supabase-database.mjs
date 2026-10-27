import { createClient } from "@supabase/supabase-js";
import { evaluateRule } from "../lib/pipeline/rules-evaluator.ts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jowtilmwhyasyxuflwli.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvd3RpbG13aHlhc3l4dWZsd2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwOTM3NzQsImV4cCI6MjEwODY2OTc3NH0.5IwyT716WKc-xtgemDp294AgF1nbMk-jDDPpxigcK7A";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("=== SEEDING REAL 2 COLLEGES (SPIT & LTCE) ===");

  const institutions = [
    {
      id: "1-3686579303",
      name: "Sardar Patel Institute of Technology",
      address: "Bhavan's Campus, Munshi Nagar, Andheri (West)",
      city: "Mumbai",
      state: "Maharashtra",
      established_year: 1962,
      trust_society: "Bharatiya Vidya Bhavan (Reg. F-142(M))",
      principal_name: "Principal, Sardar Patel",
      email: "principal@sardarpatel.edu.in",
      phone: "+91 22 2670 7440",
    },
    {
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
    },
  ];
  await supabase.from("institutions").upsert(institutions, { onConflict: "id" });

  const aicteRecords = [
    {
      institution_id: "1-3686579303",
      approved_programmes: ["Computer Engineering", "Information Technology", "Electronics & Telecommunication", "Artificial Intelligence & Data Science"],
      total_approved_intake: 300,
      faculty_count: 20,
      deficiency_status: "Nil",
      ter_payment_status: "paid",
      last_eoa_year: "2025-26",
      last_scrutiny_status: "Approved",
    },
    {
      institution_id: "1-10358461",
      approved_programmes: ["Computer Engineering", "Mechanical Engineering", "Electronics & Telecommunication", "Electrical Engineering"],
      total_approved_intake: 360,
      faculty_count: 24,
      deficiency_status: "Nil",
      ter_payment_status: "paid",
      last_eoa_year: "2025-26",
      last_scrutiny_status: "Approved",
    },
  ];
  await supabase.from("aicte_records").upsert(aicteRecords, { onConflict: "institution_id" });

  const applications = [
    {
      id: "APP-2026-8941",
      institution_id: "1-3686579303",
      academic_year: "2026-27",
      application_category: "EoA Renewal",
      system_status: "ready_for_review",
      overall_risk_score: 0.05,
      flags_count: 0,
      submitted_at: "2026-10-27T09:14:00.000Z",
    },
    {
      id: "APP-2026-9012",
      institution_id: "1-10358461",
      academic_year: "2026-27",
      application_category: "EoA Renewal",
      system_status: "ready_for_review",
      overall_risk_score: 0.05,
      flags_count: 0,
      submitted_at: "2026-10-27T11:10:00.000Z",
    },
  ];
  await supabase.from("applications").upsert(applications, { onConflict: "id" });

  const documents = [
    {
      id: "DOC-APP-2026-8941-AFF",
      application_id: "APP-2026-8941",
      document_type: "affidavit",
      file_name: "APP-2026-8941_affidavit.pdf",
      file_size: 2455,
      storage_path: "documents/APP-2026-8941/APP-2026-8941_affidavit.pdf",
      sha256_hash: "fcd4f55e75cebcbf53a2a9d88e37ca684dcfa1d8ea93b2a59d75d517cdc33d11",
      phash: "33c96ae3877be953b79eb606dc074398",
      qr_payload: null,
      is_scanned: false,
      page_count: 1,
      metadata: { producer: "ReportLab PDF Engine", creation_date: "2026-04-12T10:00:00Z", stated_issue_date: "2026-04-12T09:00:00Z" },
    },
    {
      id: "DOC-APP-2026-8941-NOC",
      application_id: "APP-2026-8941",
      document_type: "noc_university",
      file_name: "APP-2026-8941_noc_university.pdf",
      file_size: 4358,
      storage_path: "documents/APP-2026-8941/APP-2026-8941_noc_university.pdf",
      sha256_hash: "f34e4744f06f48e4cee2af7bfa2d5ede4f91ddd6bb5ad448b8ba274c62fcd682",
      phash: "70b1217e9a1f15ef8b59a4e79ab1f7fa",
      qr_payload: "https://stateuniv.edu.in/verify?doc=NOC/MAH/2026/9935&inst=1-3686579303",
      is_scanned: false,
      page_count: 1,
      metadata: { producer: "ReportLab PDF Engine", creation_date: "2026-04-12T10:00:00Z", stated_issue_date: "2026-04-12T09:00:00Z" },
    },
    {
      id: "DOC-APP-2026-8941-ACC",
      application_id: "APP-2026-8941",
      document_type: "accreditation_nba",
      file_name: "APP-2026-8941_accreditation_nba.pdf",
      file_size: 2260,
      storage_path: "documents/APP-2026-8941/APP-2026-8941_accreditation_nba.pdf",
      sha256_hash: "9c577bbdea7a7abff78e56632c4a93a13fa12442825965f27450d37ebcc00026",
      phash: "02f506d4682a3a91f4811c717b5d6076",
      qr_payload: null,
      is_scanned: false,
      page_count: 1,
      metadata: { producer: "ReportLab PDF Engine", creation_date: "2026-04-12T10:00:00Z", stated_issue_date: "2026-04-12T09:00:00Z" },
    },
    {
      id: "DOC-APP-2026-8941-FIR",
      application_id: "APP-2026-8941",
      document_type: "fire_safety",
      file_name: "APP-2026-8941_fire_safety.pdf",
      file_size: 2292,
      storage_path: "documents/APP-2026-8941/APP-2026-8941_fire_safety.pdf",
      sha256_hash: "4c0141553200a1956b09543dd97751ccda055c56c6f3d12731ac66c0567c306f",
      phash: "91513a726d21a3245f7f576234956cac",
      qr_payload: null,
      is_scanned: true,
      page_count: 1,
      metadata: { producer: "ReportLab PDF Engine", creation_date: "2026-04-12T10:00:00Z", stated_issue_date: "2026-04-12T09:00:00Z" },
    },
    {
      id: "DOC-APP-2026-8941-LAN",
      application_id: "APP-2026-8941",
      document_type: "land_ownership",
      file_name: "APP-2026-8941_land_ownership.pdf",
      file_size: 2292,
      storage_path: "documents/APP-2026-8941/APP-2026-8941_land_ownership.pdf",
      sha256_hash: "9535f7a9f70927e7f6ebc2c831b2a662e198ef29140af09feaec2e1272993634",
      phash: "c8a0d4483d4d700ef90a724ee748ce9d",
      qr_payload: null,
      is_scanned: false,
      page_count: 1,
      metadata: { producer: "ReportLab PDF Engine", creation_date: "2026-04-12T10:00:00Z", stated_issue_date: "2026-04-12T09:00:00Z" },
    },
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
  await supabase.from("documents").upsert(documents, { onConflict: "id" });

  const extractedFields = [
    { document_id: "DOC-APP-2026-8941-AFF", field_name: "institution_name", raw_value: "Sardar Patel Institute of Technology", confidence: 0.98, page_number: 1, source: "unpdf_text_layer" },
    { document_id: "DOC-APP-2026-8941-NOC", field_name: "institution_name", raw_value: "Sardar Patel Institute of Technology", confidence: 0.98, page_number: 1, source: "unpdf_text_layer" },
    { document_id: "DOC-APP-2026-8941-NOC", field_name: "valid_to", raw_value: "2028-06-30", confidence: 0.96, page_number: 1, source: "regex_date_parser" },
    { document_id: "DOC-APP-2026-8941-ACC", field_name: "institution_name", raw_value: "Sardar Patel Institute of Technology", confidence: 0.98, page_number: 1, source: "unpdf_text_layer" },
    { document_id: "DOC-APP-2026-8941-ACC", field_name: "valid_to", raw_value: "2028-06-30", confidence: 0.96, page_number: 1, source: "regex_date_parser" },
    { document_id: "DOC-APP-2026-8941-FIR", field_name: "institution_name", raw_value: "Sardar Patel Institute of Technology", confidence: 0.98, page_number: 1, source: "unpdf_text_layer" },
    { document_id: "DOC-APP-2026-8941-FIR", field_name: "valid_to", raw_value: "2028-06-30", confidence: 0.96, page_number: 1, source: "regex_date_parser" },
    { document_id: "DOC-APP-2026-8941-LAN", field_name: "institution_name", raw_value: "Sardar Patel Institute of Technology", confidence: 0.98, page_number: 1, source: "unpdf_text_layer" },
    { document_id: "DOC-APP-2026-9012-AFF", field_name: "institution_name", raw_value: "Lokmanya Tilak College of Engineering (LTCE)", confidence: 0.98, page_number: 1, source: "unpdf_text_layer" },
    { document_id: "DOC-APP-2026-9012-NOC", field_name: "institution_name", raw_value: "Lokmanya Tilak College of Engineering (LTCE)", confidence: 0.98, page_number: 1, source: "unpdf_text_layer" },
    { document_id: "DOC-APP-2026-9012-NOC", field_name: "valid_to", raw_value: "2027-08-31", confidence: 0.96, page_number: 1, source: "regex_date_parser" },
    { document_id: "DOC-APP-2026-9012-ACC", field_name: "institution_name", raw_value: "Lokmanya Tilak College of Engineering (LTCE)", confidence: 0.98, page_number: 1, source: "unpdf_text_layer" },
    { document_id: "DOC-APP-2026-9012-ACC", field_name: "valid_to", raw_value: "2028-06-30", confidence: 0.96, page_number: 1, source: "regex_date_parser" },
    { document_id: "DOC-APP-2026-9012-FIR", field_name: "institution_name", raw_value: "Lokmanya Tilak College of Engineering (LTCE)", confidence: 0.98, page_number: 1, source: "unpdf_text_layer" },
    { document_id: "DOC-APP-2026-9012-FIR", field_name: "valid_to", raw_value: "2027-08-31", confidence: 0.96, page_number: 1, source: "regex_date_parser" },
    { document_id: "DOC-APP-2026-9012-LAN", field_name: "institution_name", raw_value: "Lokmanya Tilak College of Engineering (LTCE)", confidence: 0.98, page_number: 1, source: "unpdf_text_layer" },
  ];
  await supabase.from("extracted_fields").upsert(extractedFields);

  const verificationResults = [
    {
      document_id: "DOC-APP-2026-8941-NOC",
      issuer_name: "State Technical Board / University (QR)",
      method: "qr_payload",
      status: "verified",
      request_payload: { qr_url: "https://stateuniv.edu.in/verify?doc=NOC/MAH/2026/9935&inst=1-3686579303" },
      response_payload: { match: true, intake: 300, issued_to: "Sardar Patel Institute of Technology" },
      verified_at: new Date().toISOString(),
    },
    {
      document_id: "DOC-APP-2026-9012-NOC",
      issuer_name: "State Technical Board / University (QR)",
      method: "qr_payload",
      status: "verified",
      request_payload: { qr_url: "https://stateuniv.edu.in/verify?doc=NOC/MAH/2026/8102&inst=1-10358461" },
      response_payload: { match: true, intake: 360, issued_to: "Lokmanya Tilak College of Engineering (LTCE)" },
      verified_at: new Date().toISOString(),
    },
  ];
  await supabase.from("verification_results").upsert(verificationResults);

  const demoProfiles = [
    { email: "officer@aicte.gov.in", full_name: "Dr. Ananya Menon", role: "scrutiny_officer" },
    { email: "principal@sardarpatel.edu.in", full_name: "Principal, Sardar Patel", role: "institution", institution_id: "1-3686579303" },
    { email: "principal@ltce.in", full_name: "Dr. Subhash K. Shinde (Principal, LTCE)", role: "institution", institution_id: "1-10358461" },
  ];
  await supabase.from("profiles").upsert(demoProfiles, { onConflict: "email" });

  console.log("Database reset cleanly to Sardar Patel and LTCE!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
