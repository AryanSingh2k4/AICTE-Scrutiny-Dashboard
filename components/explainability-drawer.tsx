"use client";

import { useEffect } from "react";
import {
  ArrowUpRight,
  Check,
  Clock3,
  ExternalLink,
  Fingerprint,
  FileText,
  Info,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import type { DocumentRecord, Finding } from "@/lib/types";
import { cn, percent, severity } from "@/lib/display";
import { ConfidenceMeter, MonoTag } from "@/components/ui";

export function ExplainabilityDrawer({
  finding,
  document,
  open,
  acknowledged,
  onClose,
  onAcknowledge,
}: {
  finding: Finding | null;
  document: DocumentRecord | null;
  open: boolean;
  acknowledged: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
}) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, open]);

  if (!open || !finding) return null;
  const item = severity[finding.severity] || severity.high;

  return (
    <div className="fixed inset-0 z-[85] flex justify-end bg-ink/25 backdrop-blur-[1px]" onMouseDown={onClose}>
      <aside
        className="flex h-full w-full max-w-[470px] flex-col border-l border-line-strong bg-surface shadow-lift animate-slide-in"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div className="flex items-start gap-3">
            <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", item.className)}>
              <ShieldAlert className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn("chip border", item.className)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", item.dot)} />
                  {item.label} severity
                </span>
                <span className="mono text-[11.5px] text-muted">{finding.id}</span>
              </div>
              <h2 className="mt-2 max-w-[340px] text-[15px] font-semibold leading-snug text-ink">{finding.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted hover:bg-paper hover:text-ink" aria-label="Close explanation">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scroll">
          <div className="border-b border-line bg-[#f8f5ee] px-5 py-3">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate" />
              <p className="text-[12px] leading-relaxed text-muted">
                <span className="font-semibold text-ink">Advisory indicator.</span> This is not a conclusion of forgery or misconduct.
                Only a human officer may determine an outcome.
              </p>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-line bg-[#faf8f2] px-3 py-2.5">
                <div className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Rule</div>
                <div className="mono mt-1 text-[13px] font-medium text-ink">{finding.ruleId}</div>
                <div className="mt-0.5 text-[11.5px] text-muted">version {finding.ruleVersion}</div>
              </div>
              <div className="rounded-md border border-line bg-[#faf8f2] px-3 py-2.5">
                <div className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Rule type</div>
                <div className="mt-1 text-[12.5px] font-medium text-ink">{finding.ruleType.replaceAll("_", " ")}</div>
                <div className="mt-0.5 text-[11.5px] text-muted">config-driven</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="eyebrow text-[11px]">Model confidence</div>
                <span className="mono text-[12.5px] font-medium text-ink">{percent(finding.confidence)}</span>
              </div>
              <ConfidenceMeter value={finding.confidence} tone={finding.severity === "high" ? "rust" : finding.severity === "medium" ? "ochre" : "pine"} className="mt-2" showValue={false} />
              <div className="mt-1.5 flex justify-between text-[11.5px] text-muted">
                <span>Advisory confidence, not a probability of forgery</span>
                <span>threshold {finding.ruleType === "image_forensics" ? "0.78" : "0.90"}</span>
              </div>
            </div>

            <div className="mt-5">
              <div className="eyebrow text-[11px]">Finding</div>
              <p className="mt-2 text-[13px] leading-[1.75] text-[#4b514b]">{finding.description}</p>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <div className="eyebrow text-[11px]">Evidence</div>
                <span className="mono text-[11.5px] text-muted">{finding.evidence.length} items</span>
              </div>
              <div className="mt-2 overflow-hidden rounded-md border border-line">
                {finding.evidence.map((evidence, index) => (
                  <div key={evidence} className={cn("flex gap-2.5 px-3 py-2.5", index > 0 && "border-t border-line")}>
                    <span className="mono mt-0.5 text-[11px] text-line-strong">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-[12.5px] leading-relaxed text-[#4b514b]">{evidence}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-md border border-line bg-[#faf8f2] p-3.5">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-pine" />
                <span className="text-[12.5px] font-semibold">Traceability chain</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-1 text-center">
                {[
                  { label: "Rule", value: finding.ruleId },
                  { label: "Document", value: document?.label ?? "—" },
                  { label: "Source", value: "recorded" },
                  { label: "Human", value: "required" },
                ].map((step, index) => (
                  <div key={step.label} className="flex flex-1 items-center gap-1">
                    <div className="min-w-0 flex-1">
                      <div className={cn("mx-auto flex h-7 w-7 items-center justify-center rounded-full border text-[11px]", index === 3 ? "border-ochre bg-ochre-soft text-ochre" : "border-pine/20 bg-pine-soft text-pine")}>
                        {index === 3 ? <Clock3 className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      </div>
                      <div className="mt-1 truncate text-[11px] font-medium text-ink">{step.label}</div>
                      <div className="mt-0.5 truncate text-[10.5px] text-muted">{step.value}</div>
                    </div>
                    {index < 3 ? <div className="mb-4 h-px w-2 shrink-0 bg-line-strong" /> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="eyebrow text-[11px]">Location & source</div>
              <div className="mt-2 space-y-2 rounded-md border border-line px-3.5 py-3">
                <div className="flex items-start justify-between gap-3 text-[12.5px]">
                  <span className="text-muted">Document</span>
                  <span className="text-right font-medium text-ink">{finding.documentLabel}</span>
                </div>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-muted">Page</span>
                  <span className="mono text-ink">{finding.page || "—"}</span>
                </div>
                <div className="flex items-start justify-between gap-3 text-[12.5px]">
                  <span className="text-muted">Region</span>
                  <span className="mono text-right text-ink">{finding.bbox ? `${finding.bbox.x}%, ${finding.bbox.y}%, ${finding.bbox.w}% × ${finding.bbox.h}%` : "not applicable"}</span>
                </div>
                <div className="flex items-start justify-between gap-3 text-[12.5px]">
                  <span className="text-muted">Source</span>
                  <span className="max-w-[230px] text-right text-ink">{finding.source}</span>
                </div>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-muted">Generated</span>
                  <span className="mono text-ink">{finding.timestamp}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-[#e4d5b7] bg-[#f9f0de] p-3.5">
              <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#735523]">
                <ScanLine className="h-4 w-4" /> Suggested human action
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b542d]">{finding.recommendation}</p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11.5px] text-muted"><FileText className="h-3.5 w-3.5" /> Source response retained</div>
              <button className="flex items-center gap-1 text-[12px] font-medium text-pine hover:underline">Open source record <ExternalLink className="h-3 w-3" /></button>
            </div>
          </div>
        </div>

        <div className="border-t border-line bg-[#faf8f2] px-5 py-3.5">
          {acknowledged ? (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-pine"><ShieldCheck className="h-4 w-4" /> Acknowledged for human review</span>
              <span className="mono text-[11px] text-muted">logged · 11:46 IST</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] leading-relaxed text-muted">Acknowledging does not clear the finding or change the application outcome.</p>
              <button onClick={onAcknowledge} className="btn btn-primary shrink-0 text-[12.5px]">
                <Check className="h-3.5 w-3.5" /> Acknowledge
              </button>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-[11.5px] text-muted">
            <span className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> Every view of this finding is audit-logged</span>
            <MonoTag>{finding.id}</MonoTag>
          </div>
        </div>
      </aside>
    </div>
  );
}
