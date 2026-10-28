import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Application } from "@/lib/types";

export const dynamic = "force-dynamic";

const COLLEGE_META: Record<string, { name: string; shortName: string; city: string; state: string; address: string; establishedYear: number; principal: string; email: string; phone: string; programme: string; intake: number; trust: string; pid: string }> = {
  "APP-2026-8941": {
    name: "Sardar Patel Institute of Technology",
    shortName: "SPIT",
    city: "Mumbai",
    state: "Maharashtra",
    address: "Bhavan's Campus, Munshi Nagar, Andheri (West), Mumbai 400058",
    establishedYear: 1962,
    principal: "Dr. B. K. Murthy",
    email: "principal@sardarpatel.edu.in",
    phone: "+91 22 2670 7440",
    programme: "Computer Engineering & Technology",
    intake: 300,
    trust: "Bharatiya Vidya Bhavan (Reg. F-142(M))",
    pid: "1-3686579303",
  },
  "APP-2026-9012": {
    name: "Lokmanya Tilak College of Engineering (LTCE)",
    shortName: "LTCE",
    city: "Navi Mumbai",
    state: "Maharashtra",
    address: "Sector 4, Vikas Nagar, Koparkhairane, Navi Mumbai 400709",
    establishedYear: 1994,
    principal: "Dr. Subhash K. Shinde",
    email: "principal@ltce.in",
    phone: "+91 22 2754 1005",
    programme: "Computer Engineering & Technology",
    intake: 360,
    trust: "Lokmanya Tilak Jankalyan Shikshan Sanstha (Reg. F-2034)",
    pid: "1-10358461",
  },
  "APP-2026-9045": {
    name: "Datta Meghe College of Engineering (DMCE)",
    shortName: "DMCE",
    city: "Navi Mumbai",
    state: "Maharashtra",
    address: "Plot No. 98, Sector 3, Airoli, Navi Mumbai 400708",
    establishedYear: 1983,
    principal: "Dr. Sudhirkumar D. Sawarkar",
    email: "principal@dmce.ac.in",
    phone: "+91 22 2779 2020",
    programme: "Civil & Computer Engineering",
    intake: 420,
    trust: "Nagar Yuwak Shikshan Sanstha, Airoli (Reg. E-1456)",
    pid: "1-4589211021",
  },
};

export async function GET() {
  try {
    const supabase = getServerSupabase();
    const { data: dbApps, error } = await supabase
      .from("applications")
      .select("id, system_status, overall_risk_score, flags_count, submitted_at, institution_id, institutions(name, city, state, trust_society)")
      .order("submitted_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch applications notice:", error.message);
      return NextResponse.json({ applications: [] });
    }

    if (!dbApps || dbApps.length === 0) {
      return NextResponse.json({ applications: [] });
    }

    // Count uploaded documents and anomaly flags directly per application
    const [{ data: dbDocs }, { data: dbFlags }] = await Promise.all([
      supabase.from("documents").select("application_id"),
      supabase.from("anomaly_flags").select("application_id, severity"),
    ]);

    const docCounts: Record<string, number> = {};
    if (dbDocs) {
      for (const d of dbDocs) {
        docCounts[d.application_id] = (docCounts[d.application_id] || 0) + 1;
      }
    }

    const flagCounts: Record<string, number> = {};
    const highFlagCounts: Record<string, number> = {};
    if (dbFlags) {
      for (const f of dbFlags) {
        flagCounts[f.application_id] = (flagCounts[f.application_id] || 0) + 1;
        if (f.severity === "high" || f.severity === "critical") {
          highFlagCounts[f.application_id] = (highFlagCounts[f.application_id] || 0) + 1;
        }
      }
    }

    const applications: Application[] = dbApps.map((app: any) => {
      const meta = COLLEGE_META[app.id] || {
        name: app.institutions?.name || app.id,
        shortName: app.id.replace("APP-2026-", ""),
        city: app.institutions?.city || "Maharashtra",
        state: app.institutions?.state || "Maharashtra",
        programme: "Technical Engineering",
        intake: 300,
        trust: app.institutions?.trust_society || "Educational Trust",
        pid: app.institution_id,
      };

      const docCount = docCounts[app.id] || 0;
      const flags = flagCounts[app.id] ?? (app.flags_count || 0);
      const highFlags = highFlagCounts[app.id] ?? (flags > 0 ? 1 : 0);
      const risk: "high" | "medium" | "low" = flags > 0 ? "high" : "low";

      const submittedDate = app.submitted_at ? new Date(app.submitted_at) : new Date();

      return {
        id: app.id,
        institution: meta.name,
        shortName: meta.shortName,
        city: meta.city,
        state: meta.state,
        programme: meta.programme,
        intake: meta.intake,
        trust: meta.trust,
        submittedAt: submittedDate.toISOString(),
        submittedLabel: `Today · ${submittedDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST`,
        documentsTotal: 5,
        documentsReceived: docCount,
        findings: flags,
        highFindings: highFlags,
        status: flags > 0 ? "findings_available" : ((app.system_status as any) || "ready_for_review"),
        risk,
        officer: "Dr. Ananya Menon",
        lastAction: flags > 0 ? `${flags} potential issues detected` : "All regulatory pre-checks passed",
      };
    });

    return NextResponse.json({ applications });
  } catch (err: any) {
    console.error("GET /api/applications error:", err);
    return NextResponse.json({ applications: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicationId, collegeId } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
    }

    const meta = COLLEGE_META[applicationId] || COLLEGE_META["APP-2026-8941"];
    const supabase = getServerSupabase();

    // 1. Ensure institution exists
    const { error: institutionError } = await supabase.from("institutions").upsert({
      id: meta.pid,
      name: meta.name,
      address: meta.address,
      city: meta.city,
      state: meta.state,
      established_year: meta.establishedYear,
      trust_society: meta.trust,
      principal_name: meta.principal,
      email: meta.email,
      phone: meta.phone,
    }, { onConflict: "id" });

    if (institutionError) {
      return NextResponse.json({ error: `Could not persist institution: ${institutionError.message}` }, { status: 500 });
    }

    // 2. Count documents and anomalies already uploaded
    const { data: docs } = await supabase
      .from("documents")
      .select("id")
      .eq("application_id", applicationId);

    const docCount = docs ? docs.length : 0;

    const { data: anomalies } = await supabase
      .from("anomaly_flags")
      .select("id")
      .eq("application_id", applicationId);

    const flagCount = anomalies ? anomalies.length : 0;

    // 3. Upsert submitted application
    const { data, error } = await supabase
      .from("applications")
      .upsert({
        id: applicationId,
        institution_id: meta.pid,
        academic_year: "2026-27",
        application_category: "EoA Renewal",
        system_status: flagCount > 0 ? "findings_available" : "ready_for_review",
        overall_risk_score: flagCount > 0 ? 0.75 : 0.05,
        flags_count: flagCount,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, application: data });
  } catch (err: any) {
    console.error("POST /api/applications error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
