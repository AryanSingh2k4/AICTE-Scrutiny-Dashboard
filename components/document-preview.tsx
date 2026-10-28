import { FileQuestion, FileText, ScanLine } from "lucide-react";
import type { DocumentRecord, Finding } from "@/lib/types";
import { cn } from "@/lib/display";

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
    (highlight.ruleType === "image_forensics"
      ? "Possible alteration"
      : highlight.title) ||
    "Flagged region";
  const conf =
    typeof highlight.confidence === "number"
      ? highlight.confidence.toFixed(2)
      : "0.85";

  return (
    <>
      <div
        className="absolute z-30 rounded-[2px] border-2 border-rust bg-rust/15 shadow-[0_0_0_1px_rgba(255,255,255,.5),0_0_24px_rgba(162,72,53,.25)] transition-all"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${w}%`,
          height: `${h}%`,
        }}
      >
        <div className="absolute -top-[20px] left-[-2px] flex items-center gap-1.5 whitespace-nowrap rounded-t-[3px] bg-rust px-2 py-0.5 text-[7px] font-bold text-white shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span>{label}</span>
          <span className="opacity-80">· {conf}</span>
        </div>
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
      <div className="relative z-10 w-full origin-top transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
        {document.status === "missing" ? (
          <div className="mx-auto flex min-h-[430px] w-full max-w-[560px] flex-col items-center justify-center rounded-[2px] border border-dashed border-[#bdb4a2] bg-[#f5f1e7]/70 px-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong bg-surface text-muted">
              <FileQuestion className="h-5 w-5" />
            </div>
            <div className="display mt-4 text-[25px] text-ink">Document not provided</div>
            <p className="mt-2 max-w-[320px] text-[12.5px] leading-relaxed text-muted">
              {document.label} is required by the 2026–27 checklist. A missing item is not a rejection.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[11.5px] text-muted">
              <FileQuestion className="h-3.5 w-3.5" /> Waiting for institution upload
            </div>
          </div>
        ) : (
          <div className="doc-paper relative mx-auto w-full max-w-[560px] overflow-hidden rounded-[2px]">
            <div className="relative px-8 pb-8 pt-7 sm:px-10">
              <div className="flex items-start justify-between gap-4 border-b border-[#d9d2c1] pb-4">
                <div className="min-w-0">
                  <div className="mono text-[7.5px] uppercase tracking-[0.18em] text-[#8a8474]">Submitted evidence · OCR text layer</div>
                  <div className="doc-serif mt-1.5 truncate text-[16px] text-[#2d312c]">{document.label}</div>
                  <div className="mono mt-1 truncate text-[8px] text-[#7a766a]">{document.fileName}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="mono text-[6.5px] uppercase tracking-[0.14em] text-[#9a9384]">Pages</div>
                  <div className="mono mt-0.5 text-[10px] text-[#5e5d55]">{document.pages || "—"}</div>
                </div>
              </div>

              {document.ocrText ? (
                <pre className="doc-serif mt-5 max-h-[520px] overflow-y-auto whitespace-pre-wrap text-[9.5px] leading-[1.9] text-[#46483f] thin-scroll">
                  {document.ocrText}
                </pre>
              ) : (
                <div className="mt-6 flex min-h-[300px] flex-col items-center justify-center rounded border border-dashed border-[#cfc6b2] bg-[#f6f2e7]/70 px-6 text-center">
                  <ScanLine className="h-5 w-5 text-[#8a8474]" />
                  <div className="mt-2 text-[12px] font-semibold text-[#46483f]">No text layer captured</div>
                  <p className="mt-1 max-w-[300px] text-[11px] leading-relaxed text-[#7a766a]">
                    The pipeline has not stored OCR text for this file. Download the original document to inspect it.
                  </p>
                </div>
              )}

              <div className="mt-6 flex items-end justify-between gap-4 border-t border-[#ded7c7] pt-3">
                <div className="min-w-0">
                  <div className="mono text-[6.5px] uppercase tracking-[0.12em] text-[#9a9384]">SHA-256</div>
                  <div className="mono mt-0.5 truncate text-[7.5px] text-[#5e5d55]">{document.hash}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="mono text-[6.5px] uppercase tracking-[0.12em] text-[#9a9384]">Uploaded</div>
                  <div className="mono mt-0.5 text-[7.5px] text-[#5e5d55]">{document.uploadedAt}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-[7px] text-[#8a8474]">
                <FileText className="h-2.5 w-2.5" /> Rendered from the stored text layer · no hosted LLM
              </div>
            </div>
            {highlight && showOverlay ? (
              <BoundingBoxOverlay highlight={highlight} showOverlay={showOverlay} />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
