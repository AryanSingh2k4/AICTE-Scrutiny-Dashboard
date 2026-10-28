// ==============================================================================
// ScrutiniX AICTE Scrutiny Engine — Process Document Route
// Academic Year 2026–27 | Decision Support Only
// ==============================================================================

import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  computeSha256,
  computePHash,
  extractPdfTextAndStreams,
  extractDocumentFields,
  extractPdfMetadataAndDates,
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

    // 2. Fetch file content from Supabase Storage bucket 'documents' or local fallback
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
        // Fall through to local filesystem
      }
    }

    let localFilePath: string | undefined;
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
          localFilePath = p;
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

    // 3. Compute SHA-256 and 64-bit perceptual hash (pHash)
    const sha256 = computeSha256(buffer);
    const phash = await computePHash(buffer);

    // 4. Deterministic text and metadata extraction
    const { text: extractedText } = extractPdfTextAndStreams(buffer);
    const extractedFieldItems = extractDocumentFields(extractedText, doc.document_type);

    // Use extracted issue date to evaluate metadata timestamp discrepancy
    const statedDate =
      extractedFieldItems.issue_date?.normalized ||
      extractedFieldItems.issue_date?.raw;
    const metaResult = extractPdfMetadataAndDates(buffer, statedDate, localFilePath);

    // 5. Insert / Update extracted fields in extracted_fields table
    const fieldsToInsert = Object.entries(extractedFieldItems).map(([fieldName, item]) => ({
      document_id: documentId,
      field_name: fieldName,
      raw_value: item.raw,
      normalized_value: item.normalized || item.raw,
      confidence: item.confidence,
      page_number: 1,
      source: "unpdf_text_layer",
    }));

    // Clear prior extracted fields for clean update
    await supabase.from("extracted_fields").delete().eq("document_id", documentId);

    if (fieldsToInsert.length > 0) {
      const { error: insErr } = await supabase.from("extracted_fields").insert(fieldsToInsert);
      if (insErr) {
        console.error("Warning inserting extracted fields:", insErr.message);
      }
    }

    // 6. Update documents row (sha256_hash, phash, page_count, metadata, ocr_text)
    const pageMatches = buffer.toString("latin1").match(/\/Type\s*\/Page\b/g);
    const pageCount = pageMatches ? pageMatches.length : doc.page_count || 1;

    const updatedMetadata = {
      ...(doc.metadata || {}),
      ...metaResult.metadata,
      file_size: buffer.length,
      processed_at: new Date().toISOString(),
    };

    const { error: updErr } = await supabase
      .from("documents")
      .update({
        sha256_hash: sha256,
        phash,
        page_count: pageCount,
        ocr_text: extractedText,
        metadata: updatedMetadata,
      })
      .eq("id", documentId);

    if (updErr) {
      console.error("Warning updating document record:", updErr.message);
    }

    // 7. Append audit log entry: DOCUMENT_PROCESSED
    await supabase.rpc("append_audit", {
      p_actor: "SYSTEM",
      p_actor_role: "pipeline",
      p_action: "DOCUMENT_PROCESSED",
      p_entity: "documents",
      p_entity_id: documentId,
      p_payload: {
        sha256_hash: sha256,
        phash,
        extracted_fields_count: fieldsToInsert.length,
        field_keys: Object.keys(extractedFieldItems),
        document_type: doc.document_type,
        file_name: doc.file_name,
        application_id: doc.application_id,
      },
    });

    return NextResponse.json({
      success: true,
      documentId,
      extractedCount: fieldsToInsert.length,
      fields: fieldsToInsert,
    });
  } catch (err: any) {
    console.error("Error processing document:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
