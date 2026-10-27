import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ issuer: string }> }
) {
  const { issuer } = await params;
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref") || searchParams.get("doc") || "REF-DEFAULT";

  // Simulate State Board University verification
  if (issuer === "state-university" || issuer === "sppu") {
    return NextResponse.json({
      issuer: "State Technical Board / University (QR Registry)",
      reference: ref,
      status: "verified",
      timestamp: new Date().toISOString(),
      details: {
        affiliation_granted: true,
        academic_year: "2026-27",
        approved_programmes: ["Computer Engineering", "Mechanical", "E&TC", "IT"],
        qr_signature_valid: true,
      },
    });
  }

  // Simulate NBA Accreditation Registry
  if (issuer === "nba-registry" || issuer === "nba") {
    const isExpired = ref.includes("EXP") || ref.includes("2022");
    return NextResponse.json({
      issuer: "National Board of Accreditation (NBA Registry)",
      reference: ref,
      status: isExpired ? "expired" : "verified",
      timestamp: new Date().toISOString(),
      details: {
        tier: "Tier-I",
        valid_until: isExpired ? "2025-06-30" : "2028-06-30",
        score: "382 / 400",
      },
    });
  }

  // Simulate Municipal Fire Services (Intermittent / Flaky demo)
  if (issuer === "fire-services" || issuer === "municipal") {
    // 50% simulated timeout / 503 degradation
    const shouldFail = searchParams.get("force_fail") === "true" || ref.includes("FAIL");
    if (shouldFail) {
      return NextResponse.json(
        {
          issuer: "Municipal Fire Services Adapter",
          reference: ref,
          status: "source_unavailable",
          error: "Endpoint timed out (503 Service Unavailable). Routed to manual review queue.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      issuer: "Municipal Fire Services Adapter",
      reference: ref,
      status: "verified",
      timestamp: new Date().toISOString(),
      details: {
        noc_status: "Active",
        valid_through: "2027-12-31",
        form: "Form B Renewal",
      },
    });
  }

  return NextResponse.json(
    { error: `Unknown mock issuer: ${issuer}` },
    { status: 404 }
  );
}
