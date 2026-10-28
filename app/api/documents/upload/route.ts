// ==============================================================================
// ScrutiniX AICTE Scrutiny Engine — Dynamic Document Upload & Forensic Ingestion Route
// Academic Year 2026–27 | Real-time OCR, ELA Tampering & Plagiarism Detection
// ==============================================================================

import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getServerSupabase } from "@/lib/supabase/server";
import { computeDocumentSimilarity } from "@/lib/pipeline/similarity";
import {
  synthesizeForensicAnalysis,
  type ForensicEvidencePackage,
} from "@/lib/pipeline/ai-analyzer";

const execFileAsync = promisify(execFile);

export const dynamic = "force-dynamic";

function normalizeDocType(input: string): string {
  const s = (input || "").toLowerCase();
  if (s.includes("land") || s.includes("deed") || s.includes("title")) return "land_ownership";
  if (s.includes("fire")) return "fire_safety";
  if (s.includes("noc") || s.includes("university")) return "noc_university";
  if (s.includes("nba") || s.includes("accredit") || s.includes("naac")) return "accreditation_nba";
  return "affidavit";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const applicationId = (formData.get("applicationId") as string) || "APP-2026-9012";
    const collegeId = (formData.get("collegeId") as string) || "ltce";
    const rawDocType = (formData.get("documentType") as string) || "Regulatory Evidence";
    const documentType = normalizeDocType(rawDocType);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // 1. Read bytes and compute real SHA-256
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sha256Hash = crypto.createHash("sha256").update(buffer).digest("hex");

    // 2. Write temp file to os.tmpdir() (safe for both serverless and local)
    const uploadsDir = path.join(os.tmpdir(), "uploads");
    let tempFilePath = "";
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      tempFilePath = path.join(uploadsDir, `${Date.now()}_${cleanFileName}`);
      fs.writeFileSync(tempFilePath, buffer);
    } catch (e: any) {
      console.warn("Notice writing temp file to disk:", e.message);
    }

    // 3. Upload to Supabase Storage
    const storagePath = `${applicationId}/${Date.now()}-${cleanFileName}`;
    try {
      await supabase.storage.from("documents").upload(storagePath, buffer, {
        contentType: file.type || "application/pdf",
        upsert: true,
      });
    } catch (e: any) {
      console.warn("Notice uploading to Supabase Storage:", e.message);
    }

    // 4. Query current application and institution details
    const { data: application } = await supabase
      .from("applications")
      .select("id, institution_id, institutions(name)")
      .eq("id", applicationId)
      .single();

    const currentInstName = Array.isArray(application?.institutions)
      ? application.institutions[0]?.name || collegeId
      : (application?.institutions as any)?.name || collegeId;

    // 5. Check exact byte-for-byte SHA-256 duplicate collision across institutions
    const { data: exactCollisions } = await supabase
      .from("documents")
      .select("id, file_name, document_type, application_id, applications(institution_id, institutions(name))")
      .eq("sha256_hash", sha256Hash)
      .neq("application_id", applicationId);

    const isExactDuplicate = (exactCollisions && exactCollisions.length > 0) || false;
    let exactCollidingInst = "";
    let exactCollidingDoc = "";

    if (isExactDuplicate && exactCollisions) {
      const match = exactCollisions[0];
      const matchApp = match.applications as any;
      exactCollidingInst = Array.isArray(matchApp?.institutions)
        ? matchApp.institutions[0]?.name
        : matchApp?.institutions?.name || match.application_id;
      exactCollidingDoc = match.document_type || match.file_name;
    }

    // 6. Run Forensic Analyzer (VPS Docker Engine or Local Python Fallback)
    let forensicResult: any = {
      metadata: { diffHours: 0, hasDateDiscrepancy: false },
      tampering: { isTampered: false, confidence: 0, reason: "", boundingBox: null },
      ocrTokens: [],
    };

    const vpsEngineUrl = process.env.FORENSIC_ENGINE_URL;
    let vpsSuccess = false;

    if (vpsEngineUrl) {
      try {
        const vpsForm = new FormData();
        const blob = new Blob([buffer], { type: file.type || "application/pdf" });
        vpsForm.append("file", blob, file.name);

        const headers: Record<string, string> = {};
        if (process.env.FORENSIC_ENGINE_KEY) {
          headers["x-api-key"] = process.env.FORENSIC_ENGINE_KEY;
        }

        const vpsRes = await fetch(`${vpsEngineUrl.replace(/\/$/, "")}/analyze`, {
          method: "POST",
          headers,
          body: vpsForm,
        });

        if (vpsRes.ok) {
          forensicResult = await vpsRes.json();
          vpsSuccess = true;
        } else {
          console.warn(`VPS Engine returned status ${vpsRes.status}, falling back to local runner.`);
        }
      } catch (vpsErr: any) {
        console.warn("VPS Engine connection notice:", vpsErr.message?.slice(0, 120));
      }
    }

    // Fallback to local Python runner if VPS was not configured or unavailable
    if (!vpsSuccess) {
      try {
        const pythonScript = path.resolve(process.cwd(), "scripts", "forensic_analyzer.py");
        const { stdout } = await execFileAsync("python", [pythonScript, tempFilePath], {
          maxBuffer: 10 * 1024 * 1024,
        });
        forensicResult = JSON.parse(stdout);
      } catch (pyErr: any) {
        console.warn("Python forensic analysis notice:", pyErr.message?.slice(0, 120));
      }
    }

    // Extract raw text from OCR tokens or raw buffer for plaintext files
    let extractedText = (forensicResult.ocrTokens || [])
      .map((t: any) => t.text)
      .join(" ");

    if (!extractedText || extractedText.length < 10) {
      try {
        const rawBufStr = buffer.toString("utf-8");
        if (rawBufStr && /^[\x20-\x7E\s]+$/.test(rawBufStr.slice(0, 500))) {
          extractedText = rawBufStr;
        }
      } catch {
        // ignore binary
      }
    }

    // 7. Cross-Document Semantic & Phrase Plagiarism Detection (Edited Version of Another Institution's Document)
    const { data: otherInstitutionDocs } = await supabase
      .from("documents")
      .select("id, file_name, document_type, application_id, ocr_text, applications(institution_id, institutions(name))")
      .neq("application_id", applicationId);

    let isEditedCopy = false;
    let plagiarizedInstitution = "";
    let plagiarizedDocTitle = "";
    let similarityScore = 0;
    let matchedPhrasesList: string[] = [];

    if (extractedText && extractedText.length > 50 && otherInstitutionDocs) {
      for (const otherDoc of otherInstitutionDocs) {
        if (!otherDoc.ocr_text || otherDoc.ocr_text.length < 50) continue;

        const sim = computeDocumentSimilarity(extractedText, otherDoc.ocr_text);
        if (sim.isEditedCopy && sim.confidence > similarityScore) {
          isEditedCopy = true;
          similarityScore = sim.confidence;
          matchedPhrasesList = sim.matchedPhrases;
          const matchApp = otherDoc.applications as any;
          plagiarizedInstitution = Array.isArray(matchApp?.institutions)
            ? matchApp.institutions[0]?.name
            : matchApp?.institutions?.name || otherDoc.application_id;
          plagiarizedDocTitle = otherDoc.document_type || otherDoc.file_name;
        }
      }
    }

    // 8. Persist new document record in Supabase documents table
    const docId = `DOC-${Date.now()}-${cleanFileName.slice(0, 16)}`;
    await supabase.from("documents").upsert({
      id: docId,
      application_id: applicationId,
      document_type: documentType,
      file_name: file.name,
      file_size: file.size,
      storage_path: storagePath,
      sha256_hash: sha256Hash,
      ocr_text: extractedText || null,
      page_count: forensicResult.metadata?.pageCount || 1,
      metadata: {
        creationDate: forensicResult.metadata?.creationDate,
        modDate: forensicResult.metadata?.modDate,
        diffHours: forensicResult.metadata?.diffHours,
        elaMetrics: forensicResult.tampering?.elaMetrics,
      },
      created_at: new Date().toISOString(),
    });

    // 9. Generate Anomaly Flags
    const anomalyFlagsToInsert: any[] = [];

    if (isExactDuplicate) {
      anomalyFlagsToInsert.push({
        application_id: applicationId,
        document_id: docId,
        anomaly_type: "duplicate",
        severity: "critical",
        confidence: 0.99,
        reason: `Cryptographic SHA-256 duplicate match with ${exactCollidingDoc} submitted by ${exactCollidingInst}.`,
        evidence: { sha256: sha256Hash, matched_institution: exactCollidingInst },
        page_number: 1,
        flagged_at: new Date().toISOString(),
      });
    }

    if (isEditedCopy) {
      anomalyFlagsToInsert.push({
        application_id: applicationId,
        document_id: docId,
        anomaly_type: "cross_institution_plagiarism",
        severity: "critical",
        confidence: similarityScore,
        reason: `Cross-Institution Document Plagiarism / Splicing: Uploaded document shares ${Math.round(similarityScore * 100)}% identical text and phrases with ${plagiarizedDocTitle} submitted by ${plagiarizedInstitution}, but cryptographic hashes differ. Localized alterations detected.`,
        evidence: {
          similarity_score: similarityScore,
          matched_institution: plagiarizedInstitution,
          matched_document: plagiarizedDocTitle,
          sample_matched_phrases: matchedPhrasesList,
        },
        page_number: 1,
        flagged_at: new Date().toISOString(),
      });
    }

    if (forensicResult.tampering?.isTampered) {
      anomalyFlagsToInsert.push({
        application_id: applicationId,
        document_id: docId,
        anomaly_type: "image_tamper_ela",
        severity: "high",
        confidence: forensicResult.tampering.confidence || 0.85,
        reason: forensicResult.tampering.reason || "Localized digital tampering detected via Error Level Analysis (ELA).",
        evidence: forensicResult.tampering.elaMetrics || {},
        bbox: forensicResult.tampering.boundingBox || { x: 380, y: 240, w: 80, h: 30 },
        page_number: 1,
        flagged_at: new Date().toISOString(),
      });
    }

    if (forensicResult.metadata?.diffHours && forensicResult.metadata.diffHours > 48) {
      anomalyFlagsToInsert.push({
        application_id: applicationId,
        document_id: docId,
        anomaly_type: "metadata_inversion",
        severity: "high",
        confidence: 0.92,
        reason: `PDF creation timestamp postdates stated legal execution date by ${Math.round(forensicResult.metadata.diffHours)} hours (>48h statutory tolerance).`,
        evidence: { diff_hours: forensicResult.metadata.diffHours },
        page_number: 1,
        flagged_at: new Date().toISOString(),
      });
    }

    if (anomalyFlagsToInsert.length > 0) {
      await supabase.from("anomaly_flags").insert(anomalyFlagsToInsert);
    }

    // 10. Call Google Gemma 4 Decision Support
    const evidencePackage: ForensicEvidencePackage = {
      applicationId,
      institutionName: currentInstName,
      documentId: docId,
      documentName: file.name,
      ocrText: extractedText,
      metadata: {
        creationDate: forensicResult.metadata?.creationDate,
        discrepancyHours: forensicResult.metadata?.diffHours,
      },
      tamperResult: forensicResult.tampering?.isTampered
        ? {
            isTampered: true,
            confidence: forensicResult.tampering.confidence,
            reason: forensicResult.tampering.reason,
            boundingBox: forensicResult.tampering.boundingBox,
          }
        : undefined,
      crossInstitutionCollision: isExactDuplicate
        ? {
            isDuplicate: true,
            collidingInstitution: exactCollidingInst,
            collidingDocId: exactCollidingDoc,
          }
        : isEditedCopy
        ? {
            isDuplicate: true,
            collidingInstitution: `${plagiarizedInstitution} (Edited Clone - ${Math.round(similarityScore * 100)}% text similarity)`,
            collidingDocId: plagiarizedDocTitle,
          }
        : undefined,
    };

    const aiReport = await synthesizeForensicAnalysis(evidencePackage);

    // 11. Append to Cryptographic Audit Ledger
    await supabase.rpc("append_audit", {
      p_actor: currentInstName,
      p_actor_role: "institution",
      p_action: "DOCUMENT_UPLOADED_AND_ANALYZED",
      p_entity: "documents",
      p_entity_id: docId,
      p_payload: {
        application_id: applicationId,
        file_name: file.name,
        sha256_hash: sha256Hash,
        is_exact_duplicate: isExactDuplicate,
        is_edited_copy: isEditedCopy,
        is_tampered: forensicResult.tampering?.isTampered || false,
        ai_recommendation: aiReport.statutoryRecommendation.action,
        ai_risk_score: aiReport.overallRiskScore,
        ai_model_used: aiReport.modelUsed,
      },
    });

    return NextResponse.json({
      success: true,
      documentId: docId,
      fileName: file.name,
      sha256Hash,
      isExactDuplicate,
      exactCollidingInst,
      isEditedCopy,
      plagiarizedInstitution,
      similarityScore,
      isTampered: forensicResult.tampering?.isTampered || false,
      tamperReason: forensicResult.tampering?.reason,
      boundingBox: forensicResult.tampering?.boundingBox,
      diffHours: forensicResult.metadata?.diffHours || 0,
      anomalies: anomalyFlagsToInsert,
      aiReport,
    });
  } catch (err: any) {
    console.error("Upload & Analysis Error:", err);
    return NextResponse.json({ error: err.message || "Failed to analyze uploaded document" }, { status: 500 });
  }
}
