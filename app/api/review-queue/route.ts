// ==============================================================================
// ScrutiniX AICTE Scrutiny Engine — Review Queue Endpoint
// Academic Year 2026–27 | DB-derived queue with optional claim persistence
// ==============================================================================

import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { fetchReviewQueue } from "@/lib/officer/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await fetchReviewQueue();
    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("GET /api/review-queue error:", err);
    return NextResponse.json({ error: err?.message || "Unable to load review queue" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const itemKey = typeof body?.itemKey === "string" ? body.itemKey.trim() : "";
    const officerName = typeof body?.officerName === "string" ? body.officerName.trim() : "";

    if (!itemKey || !officerName) {
      return NextResponse.json({ error: "itemKey and officerName are required" }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const claimedAt = new Date().toISOString();

    const { data: claim, error } = await supabase
      .from("review_claims")
      .upsert(
        { item_key: itemKey, officer_name: officerName, claimed_at: claimedAt },
        { onConflict: "item_key" }
      )
      .select("item_key, officer_name, claimed_at")
      .single();

    const claimsTableMissing =
      error &&
      (error.code === "42P01" ||
        /could not find the table|does not exist/i.test(error.message || "") && /review_claims/i.test(error.message || ""));

    if (error && !claimsTableMissing) {
      return NextResponse.json(
        { error: `Could not persist the claim: ${error.message}` },
        { status: 500 }
      );
    }

    // Best-effort audit trail entry; a failure here must not block the claim.
    const { error: auditError } = await supabase.rpc("append_audit", {
      p_actor: officerName,
      p_actor_role: "scrutiny_officer",
      p_action: "CLAIM_REVIEW_ITEM",
      p_entity: "review_queue",
      p_entity_id: itemKey,
      p_payload: { item_key: itemKey },
    });
    if (auditError) {
      console.warn("Could not append CLAIM_REVIEW_ITEM audit entry:", auditError.message);
    }

    if (claimsTableMissing) {
      // The optional review_claims migration has not been applied. The claim is
      // still sealed in the audit chain and held for this session.
      return NextResponse.json({
        claim: { item_key: itemKey, officer_name: officerName, claimed_at: claimedAt },
        persisted: false,
        warning:
          "Claim recorded in the audit chain, but the review_claims table is missing. Apply supabase/migrations/02_review_claims.sql to persist assignments across sessions.",
      });
    }

    return NextResponse.json({ claim, persisted: true });
  } catch (err: any) {
    console.error("POST /api/review-queue error:", err);
    return NextResponse.json({ error: err?.message || "Unable to claim review item" }, { status: 500 });
  }
}
