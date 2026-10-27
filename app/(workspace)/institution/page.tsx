"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  CloudUpload,
  FileCheck2,
  FileQuestion,
  FileText,
  HelpCircle,
  Info,
  MessageSquareWarning,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { extractedFieldSummary, submissionChecklist, uploadSteps } from "@/lib/mock-data";
import { cn, percent } from "@/lib/display";
import { PageHeader, SectionHeading } from "@/components/ui";

const checklistStatus = {
  uploaded: { label: "Uploaded", className: "bg-pine-soft text-pine border-pine/15", dot: "bg-pine" },
  attention: { label: "Clarification", className: "bg-ochre-soft text-ochre border-ochre/15", dot: "bg-ochre" },
  missing: { label: "Missing", className: "bg-rust-soft text-rust border-rust/15", dot: "bg-rust" },
};

export default function InstitutionPage() {
  const [processing, setProcessing] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [completed, setCompleted] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  function startProcessing(fileName = "land_ownership_deed_2026.pdf") {
    if (processing) return;
    setUploadedFile(fileName);
    setProcessing(true);
    setCompleted(false);
    setStepIndex(0);
    let index = 0;
    timerRef.current = window.setInterval(() => {
      index += 1;
      if (index >= uploadSteps.length) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        setProcessing(false);
        setCompleted(true);
        setStepIndex(uploadSteps.length);
        setToast("Document processed. Land & ownership is now present. Validation has been queued.");
      } else {
        setStepIndex(index);
      }
    }, 820);
  }

  const uploadedCount = submissionChecklist.filter((doc) => doc.status === "uploaded").length;
  const completeness = submissionChecklist.length ? Math.round((uploadedCount / submissionChecklist.length) * 100) : 0;
  const progress = stepIndex < 0 ? 0 : Math.min(100, Math.round((stepIndex / uploadSteps.length) * 100));

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="EoA Renewal 2026–27 · Technical Institution"
        title="Submission workspace"
        description="Track your application file, respond to clarifications, and watch document processing as it happens."
        actions={
          <>
            <Link href="/applications" className="btn btn-secondary">View applications <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            <button onClick={() => startProcessing()} className="btn btn-primary"><CloudUpload className="h-3.5 w-3.5" /> Upload document</button>
          </>
        }
      />

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-4">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div>
                <SectionHeading title="Document checklist" meta={`${uploadedCount} of ${submissionChecklist.length} provided`} />
                <p className="mt-1 text-[12px] text-muted">Required documents for EoA Renewal · 2026–27.</p>
              </div>
              <span className="chip border-pine/15 bg-pine-soft text-pine"><ShieldCheck className="h-3 w-3" /> Private bucket</span>
            </div>
            <div className="divide-y divide-line">
              {submissionChecklist.map((doc, index) => {
                const status = checklistStatus[doc.status as keyof typeof checklistStatus];
                const isMissing = doc.status === "missing";
                return (
                  <div key={doc.type} className={cn("flex flex-wrap items-center gap-3 px-5 py-3", isMissing && "bg-[#fdf7f3]")}>
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md border", isMissing ? "border-rust/20 bg-rust-soft text-rust" : "border-line bg-[#f8f5ee] text-muted")}>
                      {isMissing ? <FileQuestion className="h-4.5 w-4.5" /> : <FileText className="h-4.5 w-4.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13.5px] font-semibold text-ink">{doc.type}</span>
                        {doc.required ? <span className="rounded border border-line bg-paper px-1.5 py-0.5 text-[11px] font-medium text-muted">Required</span> : <span className="text-[11px] text-muted">Optional</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted">
                        <span>{doc.detail}</span>
                        {doc.size !== "—" ? <><span>·</span><span className="mono">{doc.size}</span></> : null}
                      </div>
                    </div>
                    <span className={cn("chip border", status.className)}><span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />{status.label}</span>
                    {isMissing ? (
                      <button onClick={() => startProcessing()} className="btn btn-primary h-8 text-[12px]"><Upload className="h-3 w-3" /> Upload</button>
                    ) : (
                      <button onClick={() => setToast(`${doc.type} replaced. Processing will re-run automatically.`)} className="flex h-8 items-center gap-1 rounded px-2.5 text-[12px] font-medium text-muted hover:bg-paper hover:text-ink">
                        <RefreshCw className="h-3 w-3" /> Replace
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t border-line bg-[#faf8f2] px-5 py-2.5">
              <span className="flex items-center gap-1.5 text-[11.5px] text-muted"><Info className="h-3 w-3" /> Files are private. Viewing requires a signed URL and is audit-logged.</span>
              <span className="mono text-[11px] text-muted">MAX 20 MB · PDF, JPG, PNG</span>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div>
                <SectionHeading title="Upload a document" meta={processing ? "processing" : "ready"} />
                <p className="mt-1 text-[12px] text-muted">Upload the missing land & ownership proof, or replace an existing file.</p>
              </div>
              {completed && uploadedFile ? <span className="chip border-pine/15 bg-pine-soft text-pine"><Check className="h-3 w-3" /> Added</span> : null}
            </div>
            <div className="p-4">
              <div className="relative flex min-h-[172px] flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-[#f8f5ee]/70 px-5 py-6 text-center transition-colors hover:border-pine/40 hover:bg-pine-soft/20">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-pine"><CloudUpload className="h-5 w-5" /></span>
                <div className="mt-3 text-[14px] font-semibold">{processing ? "Reading your document…" : "Drop a file here, or choose one"}</div>
                <p className="mt-1 max-w-[380px] text-[12px] leading-relaxed text-muted">
                  {processing ? "You can leave this page. Processing continues in the background and updates live." : "We compute a SHA-256 fingerprint, extract fields and run the checklist. Image-only scans use browser OCR with a manual-review fallback."}
                </p>
                {processing ? (
                  <div className="mt-3 w-full max-w-[340px]">
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#e7e1d5]"><div className="h-full rounded-full bg-pine transition-all duration-500" style={{ width: `${progress}%` }} /></div>
                    <div className="mt-1.5 flex justify-between text-[11.5px] text-muted"><span>{uploadSteps[Math.min(stepIndex, uploadSteps.length - 1)]?.label}</span><span className="mono">{progress}%</span></div>
                  </div>
                ) : (
                  <button onClick={() => startProcessing()} className="btn btn-secondary mt-3 h-9 text-[12.5px]"><Upload className="h-3.5 w-3.5" /> Choose sample file</button>
                )}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  { label: "Text layer first", detail: "Deterministic extraction" },
                  { label: "QR when present", detail: "Decoded at upload" },
                  { label: "OCR fallback", detail: "Marks review on failure" },
                ].map((item) => (
                  <div key={item.label} className="rounded-md border border-line bg-surface px-3 py-2">
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold"><Check className="h-3 w-3 text-pine" /> {item.label}</div>
                    <div className="mt-0.5 pl-4 text-[11px] text-muted">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <SectionHeading title="Extracted fields" meta="last run" />
              <span className="mono text-[11px] text-muted">avg confidence {extractedFieldSummary.length ? percent(extractedFieldSummary.reduce((s, f) => s + f.confidence, 0) / extractedFieldSummary.length) : "—"}</span>
            </div>
            {extractedFieldSummary.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileQuestion className="h-6 w-6 text-muted/50" />
                <div className="mt-2 text-[13px] font-semibold text-ink">No fields extracted yet</div>
                <p className="mt-0.5 text-[12px] text-muted">Upload a document to trigger the entity extraction pipeline.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2">
                {extractedFieldSummary.map((field, index) => (
                  <div key={field.field} className={cn("px-5 py-3", index < 4 && "border-b border-line", index % 2 === 0 && "sm:border-r sm:border-line")}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-[0.08em] text-muted">{field.field}</span>
                      <span className="mono text-[11px] text-muted">{percent(field.confidence)}</span>
                    </div>
                    <div className="mt-1 text-[13px] font-medium text-ink">{field.value}</div>
                    <div className="mt-1 text-[11.5px] text-muted">from {field.document}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-line bg-[#faf8f2] px-5 py-2.5">
              <span className="flex items-center gap-1.5 text-[11.5px] text-muted"><ScanLine className="h-3 w-3" /> Extraction is deterministic. No hosted LLM.</span>
              <Link href="/applications" className="flex items-center gap-1 text-[12px] font-semibold text-pine">View applications <ArrowUpRight className="h-3 w-3" /></Link>
            </div>
          </section>
        </div>

        <aside className="space-y-4 self-start">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <SectionHeading title="Submission summary" />
              <span className={cn("chip border", completeness === 100 ? "border-pine/15 bg-pine-soft text-pine" : "border-ochre/15 bg-ochre-soft text-ochre")}>
                {completeness === 100 ? "Complete" : "Incomplete"}
              </span>
            </div>
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#1c5444 0 ${completeness}%, #e9e4d8 ${completeness}% 100%)` }}>
                <div className="flex h-[62px] w-[62px] flex-col items-center justify-center rounded-full bg-surface">
                  <span className="mono text-[18px] font-medium leading-none">{completeness}%</span>
                  <span className="mt-0.5 text-[11px] text-muted">complete</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between text-[12.5px]"><span className="text-muted">Documents</span><span className="mono text-ink">{uploadedCount} / {submissionChecklist.length}</span></div>
                <div className="mt-1 flex justify-between text-[12.5px]"><span className="text-muted">Open findings</span><span className="mono text-rust">0</span></div>
                <div className="mt-1 flex justify-between text-[12.5px]"><span className="text-muted">Clarifications</span><span className="mono text-ochre">0</span></div>
              </div>
            </div>
            <div className="mx-4 mb-3 rounded-md border border-line bg-[#f8f5ee] px-3 py-2 text-[12px] leading-relaxed text-muted">
              <span className="font-semibold text-ink">Deadline:</span> 30 Nov 2026 · responses after this date may require a fresh application.
            </div>
            <div className="border-t border-line px-4 py-3">
              <div className="flex items-center justify-between text-[12px]"><span className="text-muted">Last submitted</span><span className="mono">27 Oct, 08:42</span></div>
              <div className="mt-1.5 flex items-center justify-between text-[12px]"><span className="text-muted">Last validation</span><span className="mono">27 Oct, 11:07</span></div>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <SectionHeading title="Live processing" meta="Realtime" />
              <span className="flex items-center gap-1 text-[11px] text-muted"><span className={cn("h-2 w-2 rounded-full", processing ? "animate-pulse-soft bg-ochre" : "bg-pine")} /> {processing ? "running" : "idle"}</span>
            </div>
            <div className="px-4 py-4">
              <div className="relative space-y-0">
                {uploadSteps.map((step, index) => {
                  const done = completed || index < stepIndex;
                  const current = processing && index === stepIndex;
                  return (
                    <div key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
                      {index < uploadSteps.length - 1 ? <span className={cn("absolute left-[6px] top-3 h-full w-px", done ? "bg-pine/30" : "bg-line")} /> : null}
                      <span className={cn(
                        "relative z-10 mt-0.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border",
                        done ? "border-pine bg-pine-soft text-pine" : current ? "border-ochre bg-ochre-soft text-ochre" : "border-line-strong bg-surface text-line-strong",
                      )}>
                        {done ? <Check className="h-2.5 w-2.5" /> : current ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ochre" /> : <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />}
                      </span>
                      <div className="min-w-0">
                        <div className={cn("text-[12.5px] font-medium", done ? "text-ink" : current ? "text-ochre" : "text-muted")}>{step.label}</div>
                        <div className="mt-0.5 truncate text-[11.5px] text-muted">{done ? step.detail : current ? "In progress…" : "Queued"}</div>
                      </div>
                      {done ? <span className="mono ml-auto text-[11px] text-muted">ok</span> : null}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-line bg-[#faf8f2] px-4 py-2.5">
              <span className="flex items-center gap-1 text-[11px] text-muted"><Clock3 className="h-3 w-3" /> {processing ? "listening to processing_events" : "last run 2.84s"}</span>
              {completed && uploadedFile ? <span className="mono text-[11px] text-pine">FILE ADDED</span> : <span className="mono text-[11px] text-muted">IDLE</span>}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-[#f8f5ee] p-4">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold"><HelpCircle className="h-3.5 w-3.5" /> Need a hand?</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">Your file is reviewed by a human officer. A finding is not a rejection. You can replace documents at any time before a decision is recorded.</p>
            <button onClick={() => setToast("User guide opened.")} className="mt-2.5 flex items-center gap-1 text-[12px] font-semibold text-pine">Read the user guide <ArrowUpRight className="h-3 w-3" /></button>
          </section>
        </aside>
      </div>

      {toast ? (
        <div className="fixed bottom-5 right-5 z-[100] flex max-w-[410px] items-start gap-3 rounded-lg border border-pine/20 bg-[#f7fbf7] px-4 py-3 shadow-lift animate-fade-up">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine-soft text-pine"><Check className="h-3 w-3" /></span>
          <p className="text-[12.5px] leading-relaxed text-muted">{toast}</p>
          <button onClick={() => setToast(null)} className="ml-1 text-muted hover:text-ink" aria-label="Dismiss"><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : null}
    </div>
  );
}
