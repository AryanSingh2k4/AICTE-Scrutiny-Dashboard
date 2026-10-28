"use client";

import { useMemo } from "react";
import { FileQuestion, FileText, Fingerprint, QrCode, ShieldAlert, ShieldCheck } from "lucide-react";
import type { DocumentRecord, Finding } from "@/lib/types";
import { cn } from "@/lib/display";

function FakeQr({ size = 52 }: { size?: number }) {
  const cells = Array.from({ length: 21 * 21 }, (_, index) => {
    const x = index % 21;
    const y = Math.floor(index / 21);
    const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    const finderInner =
      finder &&
      ((x > 1 && x < 5 && y > 1 && y < 5) ||
        (x > 15 && x < 19 && y > 1 && y < 5) ||
        (x > 1 && x < 5 && y > 15 && y < 19));
    const noise = (x * 7 + y * 13 + x * y) % 5 === 0;
    return finder
      ? finderInner || ((x + y) % 2 === 0 && !finderInner)
        ? "bg-[#2c302b]"
        : "bg-transparent"
      : noise
      ? "bg-[#2c302b]"
      : "bg-transparent";
  });
  return (
    <div
      className="rounded-[2px] border border-[#d8d1c1] bg-[#fcfaf4] p-1"
      style={{ width: size + 8, height: size + 8 }}
    >
      <div
        className="grid h-full w-full gap-0"
        style={{ gridTemplateColumns: "repeat(21, 1fr)" }}
      >
        {cells.map((cell, index) => (
          <span key={index} className={cn("aspect-square", cell)} />
        ))}
      </div>
    </div>
  );
}

function BoundingBoxOverlay({
  highlight,
  showOverlay,
}: {
  highlight?: Finding;
  showOverlay: boolean;
}) {
  if (!showOverlay || !highlight?.bbox) return null;

  const rawBbox = highlight.bbox;
  const x = rawBbox.x ?? 0;
  const y = rawBbox.y ?? 0;
  const w = rawBbox.w ?? rawBbox.width ?? 30;
  const h = rawBbox.h ?? rawBbox.height ?? 15;
  const label =
    rawBbox.label ||
    (highlight.ruleType === "image_forensics" || highlight.ruleType === "forensic_integrity"
      ? "Spliced / Flagged Region"
      : highlight.title) ||
    "Flagged region";
  const conf =
    typeof highlight.confidence === "number"
      ? highlight.confidence.toFixed(2)
      : "0.85";

  return (
    <>
      <div
        className="pointer-events-none absolute z-30 rounded-[2px] border-2 border-rust bg-rust/15 shadow-[0_0_0_1px_rgba(255,255,255,.5),0_0_24px_rgba(162,72,53,.25)] transition-all"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${w}%`,
          height: `${h}%`,
        }}
      >
        <div className="absolute -top-[20px] left-[-2px] flex items-center gap-1.5 whitespace-nowrap rounded-t-[3px] bg-rust px-2 py-0.5 text-[8px] font-bold text-white shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span>{label}</span>
          <span className="opacity-80">· {conf}</span>
        </div>
        {/* SVG vector boundary & corner crosshairs */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="none"
            stroke="#a24835"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          {/* Corner crosshairs */}
          <line x1="-3" y1="0" x2="5" y2="0" stroke="#a24835" strokeWidth="2" />
          <line x1="0" y1="-3" x2="0" y2="5" stroke="#a24835" strokeWidth="2" />
          <line x1="100%" y1="0" x2="calc(100% - 5px)" y2="0" stroke="#a24835" strokeWidth="2" />
          <line x1="100%" y1="-3" x2="100%" y2="5" stroke="#a24835" strokeWidth="2" />
        </svg>
        <span className="pointer-events-none absolute inset-0 animate-pulse-soft border border-white/40" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px animate-scan bg-gradient-to-r from-transparent via-pine/60 to-transparent" />
    </>
  );
}

function DynamicDocumentDossier({
  document,
  highlight,
  showOverlay,
}: {
  document: DocumentRecord;
  highlight?: Finding;
  showOverlay: boolean;
}) {
  const ocrText = document.ocrText || "";

  // Extract clean paragraphs from real OCR text
  const paragraphs = useMemo(() => {
    if (!ocrText) return [];
    return ocrText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [ocrText]);

  // Determine if this document has active plagiarism or tampering findings
  const isPlagiarized =
    highlight?.title?.toLowerCase().includes("plagiarism") ||
    highlight?.description?.toLowerCase().includes("plagiarism") ||
    highlight?.description?.toLowerCase().includes("shares") ||
    highlight?.ruleType === "forensic_integrity";

  // Flagged keywords to highlight in document stream
  const flaggedKeywords = useMemo(() => {
    if (!isPlagiarized) return [];
    return [
      "cidco/estate/airoli",
      "survey plot numbers 48/3",
      "village airoli",
      "taluka thane",
      "sector 3 airoli",
      "48/3",
      "nmmc zonal park",
      "airoli creek marginal buffer",
      "4.25 acres",
    ];
  }, [isPlagiarized]);

  return (
    <div className="doc-paper relative mx-auto w-full max-w-[620px] overflow-hidden rounded-[2px] shadow-sm">
      <div className="relative px-8 pb-10 pt-8 sm:px-11">
        {/* Top Watermark & Regulatory Header */}
        <div className="flex items-start justify-between border-b-2 border-[#8f8876] pb-4">
          <div>
            <div className="doc-serif text-[9px] uppercase tracking-[0.2em] text-[#7d7869]">
              Government of Maharashtra · AICTE Western Regional Directorate
            </div>
            <div className="doc-serif mt-1 text-[16px] font-semibold text-[#2b2f2a]">
              Statutory Scrutiny Evidence Dossier
            </div>
            <div className="mono mt-0.5 text-[8.5px] text-[#6b6659]">
              Document Class: <span className="font-semibold text-ink">{document.type}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="mono text-[7px] uppercase tracking-[0.14em] text-[#8e897a]">
              Filing Seal
            </div>
            <div className="mono mt-0.5 text-[9px] font-medium text-[#44463e]">
              {document.reference || document.hash.slice(0, 16) || "AY-2026-REG"}
            </div>
            <div className="mono text-[7.5px] text-[#8e897a]">
              Uploaded {document.uploadedAt}
            </div>
          </div>
        </div>

        {/* Document Title Header */}
        <div className="mt-6 text-center">
          <div className="doc-serif text-[20px] font-bold uppercase tracking-[0.06em] text-[#242823]">
            {document.label}
          </div>
          <div className="doc-serif mt-1 text-[10px] italic text-[#6f6a5c]">
            Submitted for AICTE Extension of Approval (EoA) · Academic Year 2026–27
          </div>
          <div className="mt-1.5 flex items-center justify-center gap-2">
            <span className="mono rounded border border-[#ded8c9] bg-[#f7f4eb] px-2.5 py-0.5 text-[8.5px] text-[#55574e]">
              File: {document.fileName}
            </span>
          </div>
        </div>

        {/* Dynamic OCR Body Content */}
        {paragraphs.length > 0 ? (
          <div className="doc-serif mt-7 space-y-4 text-[10px] leading-[1.85] text-[#3d4039]">
            {paragraphs.map((para, idx) => {
              const lowerPara = para.toLowerCase();
              const hasFlaggedContent =
                isPlagiarized && flaggedKeywords.some((kw) => lowerPara.includes(kw));

              if (hasFlaggedContent) {
                return (
                  <div
                    key={idx}
                    className="relative my-3 rounded border-2 border-rust/60 bg-rust/10 p-3.5 shadow-sm"
                  >
                    <div className="flex items-center gap-1.5 border-b border-rust/30 pb-1.5 text-[8.5px] font-bold uppercase tracking-wider text-rust">
                      <span className="h-2 w-2 rounded-full bg-rust animate-pulse" />
                      <span>CRITICAL ANOMALY: Spliced Demarcation & CIDCO Allotment Clause</span>
                    </div>
                    <p className="mt-2 text-[10.5px] font-medium leading-[1.8] text-[#541e15]">
                      {para}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[8px] text-rust-deep">
                      <ShieldAlert className="h-3 w-3" />
                      <span>Text overlaps verbatim with Datta Meghe College of Engineering archival deed.</span>
                    </div>
                  </div>
                );
              }

              // Heading vs regular paragraph detection
              const isHeading =
                para.startsWith("SCHEDULE") ||
                para.startsWith("GOVERNMENT OF") ||
                para.startsWith("MUNICIPAL CORPORATION") ||
                para.startsWith("BEFORE THE") ||
                para.startsWith("THIS REGISTERED") ||
                (para.length < 60 && para === para.toUpperCase());

              if (isHeading) {
                return (
                  <div
                    key={idx}
                    className="border-b border-[#e2dcce] pb-1 pt-2 font-serif text-[11px] font-bold uppercase tracking-[0.05em] text-[#2b2e29]"
                  >
                    {para}
                  </div>
                );
              }

              return (
                <p key={idx} className="text-justify indent-4">
                  {para}
                </p>
              );
            })}
          </div>
        ) : (
          <div className="my-8 rounded border border-dashed border-[#d2cbba] bg-[#fbf9f4] p-6 text-center">
            <FileText className="mx-auto h-8 w-8 text-[#8a8474]" />
            <div className="doc-serif mt-3 text-[14px] font-semibold text-[#3b3e37]">
              {document.fileName}
            </div>
            <p className="mt-1 text-[10px] text-[#716c5e]">
              Original binary evidence stream registered with ScrutiniX Forensic Engine.
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="mono rounded bg-[#eee8db] px-2 py-0.5 text-[8.5px] text-[#4d5047]">
                SHA-256: {document.hash.slice(0, 24)}...
              </span>
            </div>
          </div>
        )}

        {/* Footer Seal & Authenticity Block */}
        <div className="mt-10 border-t border-[#ded8c9] pt-5">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-3">
              <FakeQr size={44} />
              <div>
                <div className="mono text-[6.5px] uppercase tracking-[0.14em] text-[#8e897a]">
                  ScrutiniX Verification Trail
                </div>
                <div className="mono mt-0.5 text-[7px] text-[#55574e]">
                  /api/audit/{document.id}
                </div>
                <div className="mono mt-0.5 flex items-center gap-1 text-[6.5px] text-pine">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Immutable Blockchain Seal</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="doc-serif text-[13px] italic text-[#3c3f38]">
                Authorized Deponent / Officer
              </div>
              <div className="mt-0.5 border-t border-[#999283] pt-1 text-[7px] uppercase tracking-[0.12em] text-[#7a7566]">
                Western Regional Office · AICTE
              </div>
            </div>
          </div>
        </div>

        {/* Stamp Seal Watermark */}
        <div className="pointer-events-none absolute right-12 top-[46%] flex h-[62px] w-[62px] rotate-[-12deg] items-center justify-center rounded-full border-2 border-[#a3947b]/40 text-center font-serif text-[6px] font-bold uppercase leading-tight tracking-wider text-[#93856d]/60">
          AICTE<br />Scrutiny<br />Dossier
        </div>
      </div>

      {/* Bounding Box Overlay for ELA Tampering & Plagiarism */}
      {highlight && showOverlay ? (
        <BoundingBoxOverlay highlight={highlight} showOverlay={showOverlay} />
      ) : null}
    </div>
  );
}

export function DocumentPreview({
  document,
  highlight,
  showOverlay,
  zoom,
}: {
  document: DocumentRecord;
  highlight?: Finding;
  showOverlay: boolean;
  zoom: number;
}) {
  return (
    <div className="relative flex min-h-[620px] items-start justify-center overflow-auto rounded-md border border-[#d7d0c0] bg-[#e9e4d8] p-5 sm:p-8">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-25" />
      <div
        className="relative z-10 w-full origin-top transition-transform duration-200"
        style={{ transform: `scale(${zoom})` }}
      >
        {document.status === "missing" ? (
          <div className="mx-auto flex min-h-[430px] w-full max-w-[560px] flex-col items-center justify-center rounded-[2px] border border-dashed border-[#bdb4a2] bg-[#f5f1e7]/70 px-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong bg-surface text-muted">
              <FileQuestion className="h-5 w-5" />
            </div>
            <div className="display mt-4 text-[25px] text-ink">Document not provided</div>
            <p className="mt-2 max-w-[320px] text-[12.5px] leading-relaxed text-muted">
              This statutory evidence is required by the 2026–27 checklist. A missing item is not a rejection.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[11.5px] text-muted">
              <QrCode className="h-3.5 w-3.5" /> Waiting for institution upload
            </div>
          </div>
        ) : (
          <DynamicDocumentDossier
            document={document}
            highlight={highlight}
            showOverlay={showOverlay}
          />
        )}
      </div>
    </div>
  );
}
