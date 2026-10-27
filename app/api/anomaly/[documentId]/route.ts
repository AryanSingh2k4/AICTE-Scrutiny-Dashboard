// ==============================================================================
// ScrutiniX AICTE Scrutiny Engine — Document Anomaly Detection Route
// Academic Year 2026–27 | Decision Support Only
// ==============================================================================

import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  checkCrossInstitutionDuplicate,
  extractPdfMetadataAndDates,
  detectDocumentTampering,
  extractDocumentFields,
  extractPdfTextAndStreams,
} from "@/lib/pipeline/forensics";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // 1. Fetch document row
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docErr || !doc) {
      return NextResponse.json({ error: `Document not found: ${documentId}` }, { status: 404 });
    }

    // 2. Fetch associated application to retrieve institution_id
    const { data: application, error: appErr } = await supabase
      .from("applications")
      .select("id, institution_id")
      .eq("id", doc.application_id)
      .single();

    if (appErr || !application) {
      return NextResponse.json(
        { error: `Application not found for document: ${doc.application_id}` },
        { status: 404 }
      );
    }

    // 3. Load document buffer (from storage or local filesystem fallback)
    let buffer: Buffer | null = null;

    if (doc.storage_path) {
      try {
        const pathInBucket = doc.storage_path.startsWith("documents/")
          ? doc.storage_path.replace(/^documents\//, "")
          : doc.storage_path;
        const { data: blob, error: sErr } = await supabase.storage
          .from("documents")
          .download(pathInBucket);
        if (!sErr && blob) {
          buffer = Buffer.from(await blob.arrayBuffer());
        }
      } catch {
        // Fall back to local file
      }
    }

    if (!buffer) {
      const candidates = [
        path.resolve(process.cwd(), doc.storage_path || ""),
        path.resolve(process.cwd(), "synthetic_data", "output_docs", doc.file_name),
        path.resolve(process.cwd(), "public", "documents", doc.file_name),
        path.resolve(process.cwd(), "synthetic_data", doc.file_name),
      ];

      for (const p of candidates) {
        if (fs.existsSync(p)) {
          buffer = fs.readFileSync(p);
          break;
        }
      }
    }

    if (!buffer) {
      return NextResponse.json(
        { error: `File content for document ${documentId} could not be located in storage or local repository` },
        { status: 404 }
      );
    }

    const detectedAnomalies: Array<{
      application_id: string;
      document_id: string;
      anomaly_type: "duplicate" | "metadata_inconsistency" | "ela_alteration";
      severity: "low" | "medium" | "high" | "critical";
      confidence: number;
      reason: string;
      evidence: Record<string, any>;
      bbox: { x: number; y: number; w: number; h: number } | null;
      page_number: number;
    }> = [];

    // --- Check 1: Cross-Institution Duplicate Detection ---
    const dupCheck = await checkCrossInstitutionDuplicate(
      doc.sha256_hash,
      doc.application_id,
      application.institution_id
    );

    if (dupCheck.isDuplicate && dupCheck.matchedDoc) {
      const matched = dupCheck.matchedDoc;
      detectedAnomalies.push({
        application_id: doc.application_id,
        document_id: documentId,
        anomaly_type: "duplicate",
        severity: "critical",
        confidence: 1.0,
        reason: `Cross-institution duplicate submission detected. Exact SHA-256 match (${doc.sha256_hash.slice(
          0,
          16
        )}...) was previously submitted by Application ${matched.application_id} (${
          matched.institution_name || matched.institution_id
        }) with file '${matched.file_name}'.`,
        evidence: {
          matched_document_id: matched.id,
          matched_application_id: matched.application_id,
          matched_institution_id: matched.institution_id,
          matched_institution_name: matched.institution_name,
          matched_file_name: matched.file_name,
          matched_submitted_at: matched.submitted_at,
          sha256_hash: doc.sha256_hash,
        },
        bbox: null,
        page_number: 1,
      });
    }

    // --- Check 2: Metadata vs Stated Date Consistency ---
    // Fetch stated issue date from extracted_fields or parse directly from text
    const { data: existingFields } = await supabase
      .from("extracted_fields")
      .select("field_name, raw_value, normalized_value")
      .eq("document_id", documentId);

    const issueDateField = (existingFields || []).find((f) => f.field_name === "issue_date");
    let statedDate = issueDateField?.normalized_value || issueDateField?.raw_value;

    if (!statedDate) {
      const { text: extractedText } = extractPdfTextAndStreams(buffer);
      const fields = extractDocumentFields(extractedText, doc.document_type);
      statedDate = fields.issue_date?.normalized || fields.issue_date?.raw;
    }

    const metaResult = extractPdfMetadataAndDates(buffer, statedDate);

    if (metaResult.hasInconsistency) {
      detectedAnomalies.push({
        application_id: doc.application_id,
        document_id: documentId,
        anomaly_type: "metadata_inconsistency",
        severity: "high",
        confidence: 0.88,
        reason:
          metaResult.inconsistencyReason ||
          `PDF metadata creation timestamp discrepancy exceeds the 48-hour scrutiny threshold.`,
        evidence: {
          creation_date: metaResult.creationDate,
          mod_date: metaResult.modDate,
          stated_issue_date: metaResult.statedIssueDate,
          diff_hours: metaResult.diffHours,
          producer: metaResult.producer,
          title: metaResult.title,
        },
        bbox: null,
        page_number: 1,
      });
    }

    // --- Check 3: Digital Splicing & Tamper Detection ---
    const tamperResult = detectDocumentTampering(buffer, "application/pdf");

    if (tamperResult.isTampered) {
      detectedAnomalies.push({
        application_id: doc.application_id,
        document_id: documentId,
        anomaly_type: "ela_alteration",
        severity: "high",
        confidence: tamperResult.confidence,
        reason:
          tamperResult.reason ||
          "Digital document splicing or alteration detected in stream structure.",
        evidence: tamperResult.details || {},
        bbox: tamperResult.boundingBox || null,
        page_number: 1,
      });
    }

    // Persist anomaly flags to database
    // Clear prior anomaly flags for this document to ensure idempotency
    await supabase.from("anomaly_flags").delete().eq("document_id", documentId);

    if (detectedAnomalies.length > 0) {
      const { error: insErr } = await supabase.from("anomaly_flags").insert(detectedAnomalies);
      if (insErr) {
        console.error("Warning persisting anomaly flags:", insErr.message);
      }
    }

    // Append audit log if cross-institution duplicate detected
    if (dupCheck.isDuplicate) {
      await supabase.rpc("append_audit", {
        p_actor: "SYSTEM",
        p_actor_role: "forensics_engine",
        p_action: "ANOMALY_FLAGGED",
        p_entity: "anomaly_flags",
        p_entity_id: documentId,
        p_payload: {
          anomaly_type: "duplicate",
          application_id: doc.application_id,
          document_id: documentId,
          matched_application: dupCheck.matchedDoc?.application_id,
          matched_institution:
            dupCheck.matchedDoc?.institution_name || dupCheck.matchedDoc?.institution_id,
          sha256_hash: doc.sha256_hash,
        },
      });
    }

    return NextResponse.json({
      documentId,
      anomalies: detectedAnomalies,
    });
  } catch (err: any) {
    console.error("Error running anomaly detection:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
