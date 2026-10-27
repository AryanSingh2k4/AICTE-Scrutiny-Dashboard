import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { evaluateRule } from "../lib/pipeline/rules-evaluator.ts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jowtilmwhyasyxuflwli.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvd3RpbG13aHlhc3l4dWZsd2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwOTM3NzQsImV4cCI6MjEwODY2OTc3NH0.5IwyT716WKc-xtgemDp294AgF1nbMk-jDDPpxigcK7A";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const seedPath = path.resolve(process.cwd(), "synthetic_data/seed_data.json");
const seedData = JSON.parse(fs.readFileSync(seedPath, "utf-8"));

console.log("Seeding institutions...");
await supabase.from("institutions").upsert(seedData.institutions, { onConflict: "id" });

console.log("Seeding AICTE records...");
await supabase.from("aicte_records").upsert(seedData.aicte_records, { onConflict: "institution_id" });

console.log("Seeding applications...");
await supabase.from("applications").upsert(seedData.applications, { onConflict: "id" });

console.log("Seeding documents...");
// Insert in chunks of 50
for (let i = 0; i < seedData.documents.length; i += 50) {
  const chunk = seedData.documents.slice(i, i + 50);
  await supabase.from("documents").upsert(chunk, { onConflict: "id" });
}

console.log("Seeding extracted fields...");
for (let i = 0; i < seedData.extracted_fields.length; i += 50) {
  const chunk = seedData.extracted_fields.slice(i, i + 50);
  await supabase.from("extracted_fields").insert(chunk);
}

console.log("Seeding verification results...");
if (seedData.verification_results?.length > 0) {
  await supabase.from("verification_results").insert(seedData.verification_results);
}

console.log("Seeding anomaly flags...");
if (seedData.anomaly_flags?.length > 0) {
  await supabase.from("anomaly_flags").insert(seedData.anomaly_flags);
}

// Fetch active rules to run pre-evaluation
const { data: rules } = await supabase.from("rules").select("*").eq("active", true);

console.log(`Running dynamic rules engine across ${seedData.applications.length} applications with ${rules?.length || 0} active rules...`);

const validationResultsToInsert = [];
const allHashes = seedData.documents.map((d) => ({
  sha256_hash: d.sha256_hash,
  application_id: d.application_id,
  institution_id: seedData.applications.find((a) => a.id === d.application_id)?.institution_id || "",
}));

for (const app of seedData.applications) {
  const inst = seedData.institutions.find((i) => i.id === app.institution_id);
  const aicte = seedData.aicte_records.find((r) => r.institution_id === app.institution_id);
  const docs = seedData.documents.filter((d) => d.application_id === app.id);
  const fields = seedData.extracted_fields.filter((f) => docs.some((d) => d.id === f.document_id));

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

console.log("Seeding demo profiles...");
const demoProfiles = [
  { email: "ananya.menon@aicte.gov.in", full_name: "Dr. Ananya Menon", role: "scrutiny_officer" },
  { email: "vikram.sharma@aicte.gov.in", full_name: "Dr. Vikram Sharma", role: "senior_officer" },
  { email: "principal@sardarpatel.edu.in", full_name: "Principal, Sardar Patel", role: "institution", institution_id: seedData.institutions[0].id },
  { email: "k.subramanian@cag.gov.in", full_name: "K. Subramanian", role: "auditor" }
];

await supabase.from("profiles").upsert(demoProfiles, { onConflict: "email" });

console.log("Database successfully seeded and evaluated!");
