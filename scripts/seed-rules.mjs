import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jowtilmwhyasyxuflwli.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvd3RpbG13aHlhc3l4dWZsd2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwOTM3NzQsImV4cCI6MjEwODY2OTc3NH0.5IwyT716WKc-xtgemDp294AgF1nbMk-jDDPpxigcK7A";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const rulesDir = path.resolve(process.cwd(), "rules/2026-27");
const yamlFiles = fs.readdirSync(rulesDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));

console.log(`Found ${yamlFiles.length} YAML rulebooks in ${rulesDir}`);

const allRules = [];

for (const file of yamlFiles) {
  const filePath = path.join(rulesDir, file);
  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = yaml.parse(content);

  const academicYear = parsed.academic_year || "2026-27";
  const version = parsed.version || "1.4";

  if (Array.isArray(parsed.rules)) {
    for (const r of parsed.rules) {
      allRules.push({
        id: r.id,
        academic_year: academicYear,
        version: version,
        group: r.group,
        type: r.type,
        title: r.title,
        severity: r.severity || "medium",
        active: r.active !== false,
        rule_spec: r.rule_spec || {},
        evaluations: 0,
        failures: 0,
        updated_at: new Date().toISOString(),
      });
    }
  }
}

console.log(`Parsed ${allRules.length} rules. Upserting into Supabase 'rules' table...`);

const { data, error } = await supabase.from("rules").upsert(allRules, { onConflict: "id" }).select("id, title");

if (error) {
  console.error("Error seeding rules:", error);
  process.exit(1);
}

console.log(`Successfully seeded ${data.length} rules into Supabase:`);
for (const r of data) {
  console.log(`  - [${r.id}] ${r.title}`);
}
