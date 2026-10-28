// ==============================================================================
// ScrutiniX AICTE Scrutiny Engine — Application Dossier Endpoint
// Academic Year 2026–27 | Full DB-backed Scrutiny Dossier
// ==============================================================================

import { NextResponse } from "next/server";
import { fetchApplicationDossier } from "@/lib/officer/data";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dossier = await fetchApplicationDossier(id);

    if (!dossier.application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(dossier);
  } catch (err: any) {
    console.error("GET /api/applications/[id]/dossier error:", err);
    return NextResponse.json({ error: err?.message || "Unable to load application dossier" }, { status: 500 });
  }
}
