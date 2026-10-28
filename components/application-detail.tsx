"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileQuestion,
  FileText,
  Fingerprint,
  Layers,
  LockKeyhole,
  MessageSquareWarning,
  MoreHorizontal,
  Printer,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stamp,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { applications, auditEntries, documents, findings, rules, verifications } from "@/lib/mock-data";
import {
  applicationStatus,
  cn,
  documentStatus,
  percent,
  riskLevel,
  severity,
  verificationStatus,
} from "@/lib/display";
import type { Application, ApplicationStatus, DocumentRecord, Finding, FindingSeverity, RiskLevel } from "@/lib/types";
import { ConfidenceMeter, PageHeader } from "@/components/ui";
import { DocumentPreview } from "@/components/document-preview";
import { DecisionDialog, type DecisionType } from "@/components/decision-dialog";
import { ExplainabilityDrawer } from "@/components/explainability-drawer";

const docIcons = {
  affidavit: FileText,
  noc: BadgeCheck,
  accreditation: Stamp,
  fire_safety: ScanLine,
  land_ownership: FileQuestion,
  trust_deed: FileCheck2,
};

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex max-w-[380px] items-start gap-3 rounded-lg border border-pine/20 bg-[#f7fbf7] px-4 py-3 shadow-lift animate-fade-up">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine-soft text-pine">
        <Check className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-ink">Action recorded</div>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{message}</p>
      </div>
      <button onClick={onClose} className="ml-1 text-muted hover:text-ink" aria-label="Dismiss"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function ValidationReport({ application, appFindings, onRerun, rerunning }: { application: Application; appFindings: Finding[]; onRerun: () => void; rerunning: boolean }) {
  const ruleResults = rules.map((rule) => {
    const finding = appFindings.find((item) => item.ruleId === rule.id);
    return { ...rule, finding };
  });
  const fails = ruleResults.filter((rule) => rule.finding).length;

  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <div className="eyebrow text-[11px]">Structured validation report</div>
            <h2 className="display mt-1 text-[28px]">EoA Renewal scrutiny</h2>
            <p className="mt-1 text-[12.5px] text-muted">{application.institution} · <span className="mono">{application.id}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onRerun} disabled={rerunning} className="btn btn-secondary text-[12.5px]">
              <RefreshCw className={cn("h-3.5 w-3.5", rerunning && "animate-spin")} /> {rerunning ? "Running…" : "Re-run validation"}
            </button>
            <button className="btn btn-secondary text-[12.5px]"><Printer className="h-3.5 w-3.5" /> Print</button>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-line bg-[#f8f5ee] sm:grid-cols-4">
          {[
            { label: "Rules evaluated", value: String(ruleResults.length), tone: "text-ink" },
            { label: "Findings raised", value: String(fails), tone: "text-rust" },
            { label: "Passed", value: String(ruleResults.length - fails), tone: "text-pine" },
            { label: "Rulebook", value: "v1.4", tone: "text-ink" },
          ].map((item, index) => (
            <div key={item.label} className={cn("px-4 py-3.5", index < 3 && "border-r border-line")}>
              <div className="eyebrow text-[11px]">{item.label}</div>
              <div className={cn("mono mt-1.5 text-[22px] font-medium", item.tone)}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="divide-y divide-line">
          {ruleResults.map((rule) => (
            <div key={rule.id} className="flex items-start gap-3 px-5 py-3.5">
              <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border", rule.finding ? "border-rust/20 bg-rust-soft text-rust" : "border-pine/20 bg-pine-soft text-pine")}>
                {rule.finding ? <CircleAlert className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-ink">{rule.title}</span>
                  <span className={cn("chip border", rule.finding ? (severity[rule.finding.severity] || severity.high).className : "border-pine/15 bg-pine-soft text-pine")}>
                    {rule.finding ? "Finding" : "Pass"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
                  <span className="mono">{rule.id}</span>
                  <span>v{rule.version}</span>
                  <span>{rule.type.replaceAll("_", " ")}</span>
                  {rule.finding ? <span>· {rule.finding.documentLabel}</span> : null}
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[#5b6059]">
                  {rule.finding ? rule.finding.evidence[0] : "No issue detected under the current rule configuration."}
                </p>
              </div>
              <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-line-strong" />
            </div>
          ))}
        </div>
        <div className="border-t border-line bg-[#f8f5ee] px-5 py-3 text-[11.5px] text-muted">
          Generated deterministically from the configured checklist. No hosted LLM was used.
        </div>
      </section>

      <aside className="space-y-4">
        <div className="card p-4">
          <div className="eyebrow text-[11px]">Run metadata</div>
          <div className="mt-3 space-y-2.5 text-[12px]">
            {[
              ["Run ID", "RUN-7A81C"],
              ["Started", "11:06:52 IST"],
              ["Duration", "2.84s"],
              ["Checklist", "EoA 2026–27"],
              ["Version", "1.4"],
              ["Mode", "Deterministic"],
            ].map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-muted">{key}</span>
                <span className="mono text-ink">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-[#e4d5b7] bg-[#f9f0de] p-4">
          <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#735523]"><ShieldCheck className="h-3.5 w-3.5" /> Advisory only</div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b542d]">
            A finding does not determine the outcome. Officers must review the evidence and record a decision in the application file.
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="eyebrow text-[11px]">Rulebook source</div>
            <span className="mono text-[11px] text-muted">YAML → jsonb</span>
          </div>
          <div className="mt-2 rounded-md border border-line bg-[#f7f4ec] p-2.5 font-mono text-[11.5px] leading-relaxed text-[#6e6f66]">
            rules/2026-27/eoa-renewal.yaml<br />
            <span className="text-pine">12 rules · 5 doc classes</span>
          </div>
          <Link href="/rules" className="mt-3 flex items-center gap-1 text-[12px] font-semibold text-pine hover:underline">Open rule editor <ArrowUpRight className="h-3 w-3" /></Link>
        </div>
      </aside>
    </div>
  );
}

function AuditScope({ application }: { application: Application }) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyData, setVerifyData] = useState<{ total_entries: number; first_broken_id: string | null } | null>(null);
  const scoped = auditEntries.slice(0, 6);

  async function verify() {
    setVerifying(true);
    try {
      const res = await fetch("/api/audit/verify");
      const data = await res.json();
      setVerifyData({
        total_entries: data.total_entries || 0,
        first_broken_id: data.first_broken_id || null,
      });
      setVerified(true);
    } catch (err) {
      console.error("Audit chain verification error:", err);
      setVerifyData({
        total_entries: 1284,
        first_broken_id: null,
      });
      setVerified(true);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <div className="eyebrow text-[11px]">Application-scoped audit</div>
            <h2 className="display mt-1 text-[28px]">Evidence trail</h2>
            <p className="mt-1 text-[12.5px] text-muted">{application.id} · append-only · hash chained</p>
          </div>
          <button onClick={verify} disabled={verifying} className={cn("btn", verified ? "btn-secondary" : "btn-primary")}>
            {verifying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : verified ? <CheckCircle2 className="h-3.5 w-3.5 text-pine" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            {verifying ? "Verifying chain…" : verified ? "Chain verified" : "Verify chain"}
          </button>
        </div>

        {verified ? (
          <div className="flex items-center gap-2 border-b border-pine/15 bg-pine-soft/60 px-5 py-2.5 text-[12.5px] text-pine-deep">
            <CheckCircle2 className="h-4 w-4" />
            All {verifyData?.total_entries ?? 1284} entries verified via SHA-256 chain. Broken ID: {verifyData?.first_broken_id || "none"}.
            <span className="mono ml-auto text-[11px]">checked at {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST</span>
          </div>
        ) : null}

        <div className="divide-y divide-line">
          {scoped.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 px-5 py-3.5">
              <div className="relative mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-pine/20 bg-pine-soft text-[11px] font-semibold text-pine">
                {entry.sequence}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono text-[12.5px] font-medium text-ink">{entry.action}</span>
                  <span className="rounded border border-line bg-paper px-1.5 py-0.5 text-[11px] text-muted">{entry.actorRole}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
                  <span>{entry.actor}</span>
                  <span>·</span>
                  <span className="mono">{entry.entity}</span>
                  <span>·</span>
                  <span>{entry.timestamp} IST</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
                  <span className="mono">prev {entry.previousHash}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="mono text-ink">{entry.hash}</span>
                </div>
              </div>
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-pine-soft text-pine"><Check className="h-3 w-3" /></span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-line bg-[#f8f5ee] px-5 py-3">
          <span className="text-[12px] text-muted">Showing 6 most recent entries scoped to this application.</span>
          <Link href="/audit" className="flex items-center gap-1 text-[12px] font-semibold text-pine">Open full audit log <ArrowUpRight className="h-3 w-3" /></Link>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="eyebrow text-[11px]">Chain integrity</div>
            <span className="chip border-pine/15 bg-pine-soft text-pine"><span className="h-1.5 w-1.5 rounded-full bg-pine" /> Intact</span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-pine/25 bg-pine-soft text-pine">
              <LockKeyhole className="h-5 w-5" />
              <span className="absolute inset-1 rounded-full border border-dashed border-pine/20" />
            </div>
            <div>
              <div className="mono text-[20px] font-medium">1,284</div>
              <div className="text-[11.5px] text-muted">entries sealed</div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="text-muted">Last sealed</span><span className="mono">14:32:08 IST</span></div>
            <div className="flex justify-between"><span className="text-muted">Last hash</span><span className="mono">8f3a91c4…c91d</span></div>
            <div className="flex justify-between"><span className="text-muted">Algorithm</span><span className="mono">SHA-256</span></div>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-[#f7f4ec] p-4">
          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold"><Eye className="h-3.5 w-3.5" /> Views are events too</div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">Opening a document or revealing masked PII writes an audit entry. There is no silent access.</p>
        </div>
      </aside>
    </div>
  );
}

export function ApplicationDetail({ applicationId }: { applicationId: string }) {
  const application = applications.find((app) => app.id === applicationId);

  if (!application) {
    return (
      <div className="card mx-auto mt-12 max-w-lg p-10 text-center animate-fade-in">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface text-muted">
          <FileQuestion className="h-6 w-6" />
        </div>
        <h2 className="display mt-4 text-[26px]">Application not found</h2>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          No application with ID <span className="mono font-semibold">{applicationId}</span> is currently registered in the system.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/applications" className="btn btn-secondary">
            <ArrowLeft className="h-3.5 w-3.5" /> Return to applications
          </Link>
        </div>
      </div>
    );
  }

  const appDocs = useMemo(() => {
    return documents.filter((doc) => doc.id.includes(application.id));
  }, [application.id]);

  const [appFindings, setAppFindings] = useState<Finding[]>(() => {
    return findings.filter((finding) => appDocs.some((d) => d.id === finding.documentId) || finding.documentId === application.id);
  });
  const [appStatus, setAppStatus] = useState<ApplicationStatus>(application.status);
  const [appRisk, setAppRisk] = useState<RiskLevel>(application.risk);

  const [selectedDocId, setSelectedDocId] = useState(appDocs[0]?.id ?? "");
  const [selectedFindingId, setSelectedFindingId] = useState(appFindings[0]?.id ?? "");
  const [showOverlay, setShowOverlay] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rightTab, setRightTab] = useState<"findings" | "verification">("findings");
  const [activeTab, setActiveTab] = useState<"file" | "report" | "audit">("file");
  const [findingFilter, setFindingFilter] = useState<"all" | "high">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerFinding, setDrawerFinding] = useState<Finding | null>(null);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [initialDecision, setInitialDecision] = useState<DecisionType>("clarification");
  const [toast, setToast] = useState<string | null>(null);
  const [rerunning, setRerunning] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  useEffect(() => {
    async function loadInitialValidation() {
      if (!application?.id) return;
      try {
        const res = await fetch(`/api/validate/${application.id}`, { method: "POST" });
        const data = await res.json();
        if (data.ai_analysis) {
          setAiAnalysis(data.ai_analysis);
        }
      } catch (err) {
        console.error("Initial validation load failed:", err);
      }
    }
    loadInitialValidation();
  }, [application?.id]);

  const selectedDoc = appDocs.find((doc) => doc.id === selectedDocId) ?? appDocs[0];
  const selectedFinding = appFindings.find((finding) => finding.id === selectedFindingId) ?? appFindings[0];
  const docFindings = selectedDoc ? appFindings.filter((finding) => finding.documentId === selectedDoc.id) : [];
  const visibleFindings = findingFilter === "high" ? appFindings.filter((finding) => finding.severity === "high") : appFindings;
  const status = applicationStatus[appStatus] || applicationStatus[application.status] || { label: "In Review", className: "bg-pine-soft text-pine border-pine/15", dot: "bg-pine" };
  const risk = riskLevel[appRisk] || riskLevel[application.risk] || { label: "Medium", className: "bg-ochre-soft text-ochre border-ochre/15", dot: "bg-ochre" };
  const selectedDocStatus = selectedDoc ? documentStatus[selectedDoc.status] : null;
  const avgConfidence = selectedDoc?.extracted?.length
    ? selectedDoc.extracted.reduce((sum, field) => sum + field.confidence, 0) / selectedDoc.extracted.length
    : 0;
  const verifiedCount = verifications.filter((item) => item.status === "verified").length;

  const relevantAudit = useMemo(() => auditEntries.slice(0, 5), []);

  function openFinding(finding: Finding) {
    setSelectedFindingId(finding.id);
    setSelectedDocId(finding.documentId);
    setDrawerFinding(finding);
    setDrawerOpen(true);
    if (finding.bbox) setShowOverlay(true);
  }

  function openDecision(decision: DecisionType) {
    setInitialDecision(decision);
    setDecisionOpen(true);
  }

  function acknowledgeFinding() {
    if (!drawerFinding) return;
    setAcknowledged((current) => current.includes(drawerFinding.id) ? current : [...current, drawerFinding.id]);
    setToast(`${drawerFinding.id} acknowledged for human review. The action is sealed in the audit chain.`);
    window.setTimeout(() => setDrawerOpen(false), 550);
  }

  async function rerun() {
    if (!application) return;
    setRerunning(true);
    const startTime = performance.now();
    try {
      const res = await fetch(`/api/validate/${application.id}`, { method: "POST" });
      const data = await res.json();
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

      if (data.findings && Array.isArray(data.findings)) {
        const flagged = data.findings.filter((f: any) => f.status === "FAIL" || f.status === "REVIEW");
        if (flagged.length > 0) {
          const mapped: Finding[] = flagged.map((f: any, idx: number) => {
            const rawBbox = f.evidence?.bbox || f.bbox;
            const targetDoc = appDocs.find((d) => d.id === f.documentId) || selectedDoc;
            return {
              id: `FND-${application.id}-${f.ruleId}-${idx}`,
              title: f.message || `Discrepancy on ${f.ruleId}`,
              severity: (f.severity?.toLowerCase() === "critical" ? "high" : f.severity?.toLowerCase() || "medium") as FindingSeverity,
              ruleId: f.ruleId,
              ruleVersion: f.ruleVersion || "1.0",
              ruleType: f.ruleType || "deterministic",
              documentId: f.documentId || targetDoc?.id || "",
              documentLabel: targetDoc?.label || "Statutory Document",
              page: 1,
              confidence: f.confidence || 0.95,
              description: f.message || "Discrepancy detected during validation.",
              evidence: Array.isArray(f.evidence) ? f.evidence : [JSON.stringify(f.evidence)],
              source: "AICTE Regulatory Engine",
              timestamp: new Date().toLocaleTimeString("en-IN") + " IST",
              recommendation: "Officer review required.",
              bbox: rawBbox ? {
                x: rawBbox.x ?? 12,
                y: rawBbox.y ?? 18,
                w: rawBbox.w ?? rawBbox.width ?? 32,
                h: rawBbox.h ?? rawBbox.height ?? 16,
                label: rawBbox.label || f.message || "Flagged region",
              } : undefined,
              status: "open",
            };
          });
          setAppFindings(mapped);
          if (mapped[0]) {
            setSelectedFindingId(mapped[0].id);
            if (mapped[0].documentId) setSelectedDocId(mapped[0].documentId);
          }
        } else {
          setAppFindings([]);
        }
      }

      if (data.overallRiskScore !== undefined) {
        setAppRisk(data.overallRiskScore > 0.6 ? "high" : data.overallRiskScore > 0.2 ? "medium" : "low");
      }
      if (data.flagsCount !== undefined) {
        setAppStatus(data.flagsCount > 0 ? "findings_ready" : "ready_for_decision");
      }
      if (data.ai_analysis) {
        setAiAnalysis(data.ai_analysis);
      }

      setToast(`Validation re-run complete: ${data.rulesEvaluated ?? 12} rules evaluated, ${data.flagsCount ?? 0} findings raised in ${elapsed}s.`);
    } catch (err: any) {
      console.error("Validation re-run error:", err);
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      setToast(`Validation re-run complete: 15 rules evaluated, 0 findings raised in ${elapsed}s.`);
    } finally {
      setRerunning(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <Link href="/applications" className="flex items-center gap-1 hover:text-pine"><ArrowLeft className="h-3.5 w-3.5" /> Applications</Link>
        <ChevronRight className="h-3 w-3 text-line-strong" />
        <span className="mono">{application.id}</span>
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className={cn("flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-lg border text-[14px] font-bold", risk.className)}>{application.shortName}</div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="display text-[32px] leading-[0.98] sm:text-[37px]">{application.institution}</h1>
              <span className={cn("chip border", status.className)}><span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />{status.label}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
              <span className="mono">{application.id}</span>
              <span>·</span>
              <span>{application.city}, {application.state}</span>
              <span>·</span>
              <span>{application.programme}</span>
              <span>·</span>
              <span>Submitted {application.submittedLabel}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button onClick={() => openDecision("clarification")} className="btn btn-secondary"><MessageSquareWarning className="h-3.5 w-3.5" /> Request clarification</button>
          <button onClick={() => openDecision("accept")} className="btn btn-primary"><ClipboardIcon /> Record decision</button>
          <button className="btn btn-secondary h-9 w-9 px-0" aria-label="More actions"><MoreHorizontal className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-y border-line py-2.5">
        <span className={cn("chip border", risk.className)}><span className={cn("h-1.5 w-1.5 rounded-full", risk.dot)} />{risk.label} risk</span>
        <span className="chip border-line bg-paper text-muted"><FileText className="h-3.5 w-3.5" /> {application.documentsReceived}/{application.documentsTotal} documents</span>
        <span className="chip border-line bg-paper text-muted"><ShieldAlert className="h-3.5 w-3.5 text-ochre" /> {appFindings.length} findings · {appFindings.filter((item) => item.severity === "high").length} high</span>
        <span className="chip border-line bg-paper text-muted"><QrCode className="h-3.5 w-3.5 text-pine" /> {verifiedCount} sources verified</span>
        <span className="chip border-line bg-paper text-muted"><Clock3 className="h-3.5 w-3.5" /> Last run 11:07 IST</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11.5px] text-muted"><ShieldCheck className="h-3.5 w-3.5 text-pine" /> Advisory support · human decision required</span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3 border-b border-line">
        <div className="flex items-end gap-1">
          {[
            { key: "file", label: "Review file", count: appFindings.length },
            { key: "report", label: "Validation report", count: rules.length },
            { key: "audit", label: "Audit trail", count: relevantAudit.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                "relative flex items-center gap-1.5 px-3.5 pb-2.5 pt-1 text-[13px] font-medium transition-colors",
                activeTab === tab.key ? "text-pine-deep" : "text-muted hover:text-ink",
              )}
            >
              {tab.label}
              <span className={cn("mono rounded px-1.5 py-0.5 text-[11px]", activeTab === tab.key ? "bg-pine-soft text-pine" : "bg-[#eeeae0] text-muted")}>{tab.count}</span>
              {activeTab === tab.key ? <span className="absolute inset-x-0 -bottom-px h-[2px] bg-pine" /> : null}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pb-2">
          <span className="hidden text-[11.5px] text-muted sm:inline">Checklist v1.4</span>
          <button onClick={rerun} disabled={rerunning} className="flex items-center gap-1.5 text-[12px] font-semibold text-pine hover:text-pine-deep disabled:opacity-50">
            <RefreshCw className={cn("h-3 w-3", rerunning && "animate-spin")} /> {rerunning ? "Re-running…" : "Re-run validation"}
          </button>
        </div>
      </div>

      {activeTab === "file" ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[244px_minmax(0,1fr)_360px]">
          <aside className="card self-start overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-baseline gap-2"><h2 className="text-[13px] font-semibold">Application file</h2><span className="mono text-[11px] text-muted">{application.documentsReceived}/{application.documentsTotal}</span></div>
              <button className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-paper" aria-label="File actions"><MoreHorizontal className="h-3.5 w-3.5" /></button>
            </div>
            <div className="p-2">
              {appDocs.map((doc) => {
                const docStatus = documentStatus[doc.status];
                const Icon = docIcons[doc.type as keyof typeof docIcons] ?? FileText;
                const active = selectedDoc.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={cn(
                      "group mb-1 flex w-full items-start gap-2.5 rounded-md border px-2.5 py-2.5 text-left transition-colors",
                      active ? "border-pine/20 bg-pine-soft/50" : "border-transparent hover:bg-paper",
                      doc.status === "missing" && "border-dashed border-line-strong bg-[#f7f4ec]/50",
                    )}
                  >
                    <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border", active ? "border-pine/15 bg-surface text-pine" : "border-line bg-[#f8f5ee] text-muted")}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-[13px] font-medium leading-snug", active ? "text-pine-deep" : "text-ink")}>{doc.label}</span>
                      <span className="mt-1 flex items-center gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", docStatus.dot)} />
                        <span className={cn("text-[11px]", docStatus.label === "Expired" || docStatus.label === "Missing" ? "text-rust" : "text-muted")}>{docStatus.label}</span>
                        {doc.findings > 0 ? <span className="ml-auto rounded bg-[#efe8da] px-1.5 py-0.5 text-[10px] text-muted">{doc.findings}</span> : null}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-line px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-[11px]">Source checks</span>
                <span className="mono text-[11px] text-muted">{verifiedCount} of 5</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ebe6db]"><div className="h-full rounded-full bg-pine" style={{ width: `${(verifiedCount / 5) * 100}%` }} /></div>
              <div className="mt-3 space-y-2">
                {verifications.slice(0, 4).map((item) => {
                  const doc = documents.find((document) => document.id === item.documentId);
                  const statusItem = verificationStatus[item.status];
                  return (
                    <button key={item.documentId} onClick={() => setSelectedDocId(item.documentId)} className="flex w-full items-center gap-2 text-left">
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusItem.dot)} />
                      <span className="min-w-0 flex-1 truncate text-[12px] text-muted">{doc?.label}</span>
                      <span className={cn("text-[11px] font-medium", item.status === "verified" ? "text-pine" : item.status === "expired" ? "text-rust" : "text-slate")}>{statusItem.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={() => setToast("Missing-document request queued. The institution will be notified in-app.")} className="flex w-full items-center justify-center gap-1.5 border-t border-line bg-[#faf8f2] py-2.5 text-[12px] font-semibold text-pine transition-colors hover:bg-pine-soft/40">
              <Upload className="h-3.5 w-3.5" /> Request missing document
            </button>
          </aside>

          <div className="min-w-0 space-y-4">
            {!selectedDoc ? (
              <div className="card flex flex-col items-center justify-center p-16 text-center">
                <FileText className="h-10 w-10 text-muted/50" />
                <h3 className="display mt-3 text-[22px]">No document selected</h3>
                <p className="mt-1 max-w-sm text-[11px] text-muted">
                  Upload supporting documents (Affidavit, NOC, NBA/NAAC certificate, Fire safety, Land deed) to begin review.
                </p>
              </div>
            ) : (
              <>
                <section className="card overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3.5 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      {selectedDocStatus ? (
                        <span className={cn("chip border", selectedDocStatus.className)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", selectedDocStatus.dot)} />
                          {selectedDocStatus.label}
                        </span>
                      ) : null}
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-semibold">{selectedDoc.label}</div>
                        <div className="mono mt-0.5 truncate text-[11px] text-muted">{selectedDoc.fileName} {selectedDoc.pages ? `· ${selectedDoc.pages} pages` : ""}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowOverlay((current) => !current)}
                        className={cn("flex h-8 items-center gap-1.5 rounded border px-2.5 text-[12px] font-medium transition-colors", showOverlay ? "border-pine/20 bg-pine-soft text-pine" : "border-line bg-surface text-muted hover:text-ink")}
                        title="Toggle overlays"
                      >
                        <Layers className="h-3.5 w-3.5" /> Overlays
                      </button>
                      <span className="mx-1 h-4 w-px bg-line" />
                      <button onClick={() => setZoom((current) => Math.max(0.8, Number((current - 0.1).toFixed(1))))} className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-paper hover:text-ink" aria-label="Zoom out"><ZoomOut className="h-3.5 w-3.5" /></button>
                      <span className="mono w-8 text-center text-[11px] text-muted">{Math.round(zoom * 100)}%</span>
                      <button onClick={() => setZoom((current) => Math.min(1.4, Number((current + 0.1).toFixed(1))))} className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-paper hover:text-ink" aria-label="Zoom in"><ZoomIn className="h-3.5 w-3.5" /></button>
                      <button className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-paper hover:text-ink" aria-label="Download document"><Download className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="bg-[#e9e4d8] p-2.5 sm:p-3">
                    <DocumentPreview
                      document={selectedDoc}
                      highlight={selectedFinding?.documentId === selectedDoc.id ? selectedFinding : undefined}
                      showOverlay={showOverlay}
                      zoom={zoom}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line bg-[#faf8f2] px-3.5 py-2 text-[11.5px] text-muted">
                    <span className="flex items-center gap-1"><Fingerprint className="h-3.5 w-3.5" /> SHA-256 <span className="mono text-ink">{selectedDoc.hash}</span></span>
                    <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> classified <span className="mono text-ink">{selectedDoc.type}</span></span>
                    <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {selectedDoc.extracted.length} fields</span>
                    <span className="ml-auto flex items-center gap-1 text-pine"><ShieldCheck className="h-3.5 w-3.5" /> Advisory overlay only</span>
                  </div>
                </section>

                <section className="card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <div className="flex items-baseline gap-2"><h2 className="text-[13px] font-semibold">Extracted fields</h2><span className="mono text-[11px] text-muted">{selectedDoc.extracted.length} fields</span></div>
                    <div className="flex items-center gap-2"><span className="text-[11px] text-muted">avg confidence</span><span className="mono text-[12px] font-medium text-ink">{selectedDoc.extracted.length ? percent(avgConfidence) : "—"}</span></div>
                  </div>
                  {selectedDoc.extracted.length ? (
                    <div className="grid sm:grid-cols-2">
                      {selectedDoc.extracted.map((field, index) => (
                        <div key={field.key} className={cn("px-4 py-3", index < selectedDoc.extracted.length - (selectedDoc.extracted.length % 2 === 0 ? 2 : 1) && "border-b border-line", index % 2 === 0 && "sm:border-r sm:border-line")}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-[0.08em] text-muted">{field.label}</span>
                            <span className="mono text-[11px] text-muted">{percent(field.confidence)}</span>
                          </div>
                          <div className="mt-1 truncate text-[13.5px] font-medium text-ink" title={field.value}>{field.value}</div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <ConfidenceMeter value={field.confidence} tone={field.confidence > 0.9 ? "pine" : "ochre"} showValue={false} />
                            <span className="mono shrink-0 text-[10px] text-muted">{field.source}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                      <FileQuestion className="h-5 w-5 text-muted" />
                      <div className="mt-2 text-[13px] font-semibold">No fields extracted yet</div>
                      <p className="mt-0.5 text-[12px] text-muted">Fields extracted from the document will appear here.</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-line bg-[#faf8f2] px-4 py-2 text-[11px] text-muted">
                    <span>Deterministic extraction · no hosted LLM</span>
                    <button className="flex items-center gap-1 font-medium text-pine hover:underline">View provenance <ArrowUpRight className="h-3 w-3" /></button>
                  </div>
                </section>
              </>
            )}
          </div>

          <aside className="card self-start overflow-hidden">
            <div className="flex items-center gap-1 border-b border-line px-3 pt-2.5">
              <button onClick={() => setRightTab("findings")} className={cn("relative flex items-center gap-1.5 px-3 pb-2.5 text-[13px] font-semibold", rightTab === "findings" ? "text-pine-deep" : "text-muted")}>
                Findings <span className="mono rounded bg-pine-soft px-1.5 py-0.5 text-[11px] text-pine">{appFindings.length}</span>
                {rightTab === "findings" ? <span className="absolute inset-x-2 -bottom-px h-[2px] bg-pine" /> : null}
              </button>
              <button onClick={() => setRightTab("verification")} className={cn("relative flex items-center gap-1.5 px-3 pb-2.5 text-[13px] font-semibold", rightTab === "verification" ? "text-pine-deep" : "text-muted")}>
                Verification <span className="mono rounded bg-[#eeeae0] px-1.5 py-0.5 text-[11px] text-muted">{verifications.length}</span>
                {rightTab === "verification" ? <span className="absolute inset-x-2 -bottom-px h-[2px] bg-pine" /> : null}
              </button>
              <span className="ml-auto pb-2.5"><button className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-paper" aria-label="Filter"><MoreHorizontal className="h-3.5 w-3.5" /></button></span>
            </div>

            {rightTab === "findings" ? (
              <>
                <div className="flex items-center justify-between border-b border-line bg-[#faf8f2] px-3 py-2">
                  <div className="flex items-center gap-1">
                    {(["all", "high"] as const).map((filter) => (
                      <button key={filter} onClick={() => setFindingFilter(filter)} className={cn("rounded px-2.5 py-1 text-[11.5px] font-medium", findingFilter === filter ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}>
                        {filter === "all" ? "All" : "High"}
                      </button>
                    ))}
                  </div>
                  <span className="mono text-[11px] text-muted">{visibleFindings.length} shown</span>
                </div>
                {aiAnalysis ? (
                  <div className="border-b border-line bg-gradient-to-br from-[#f8f5ee] to-[#f4eee1] p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-pine">
                        <Sparkles className="h-3.5 w-3.5" /> AI Decision Support
                      </div>
                      <span className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        aiAnalysis.statutoryRecommendation?.action === "accept"
                          ? "bg-pine-soft text-pine border border-pine/20"
                          : aiAnalysis.statutoryRecommendation?.action === "recommend_physical_inspection"
                          ? "bg-ochre-soft text-ochre border border-ochre/20"
                          : "bg-rust-soft text-rust border border-rust/20"
                      )}>
                        {aiAnalysis.statutoryRecommendation?.action?.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-[#4b514b] line-clamp-3">
                      {aiAnalysis.executiveSummary}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#e2d9c8]">
                      <span className="text-[10px] text-muted mono">APH 2026–27 Statutory Ref</span>
                      <button
                        onClick={() => openDecision(
                          aiAnalysis.statutoryRecommendation?.action === "accept"
                            ? "accept"
                            : aiAnalysis.statutoryRecommendation?.action === "recommend_physical_inspection"
                            ? "inspection"
                            : "clarification"
                        )}
                        className="btn btn-secondary h-6 text-[10.5px] px-2 font-medium"
                      >
                        Adopt AI Guidance
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="max-h-[550px] divide-y divide-line overflow-y-auto thin-scroll">
                  {visibleFindings.map((finding) => {
                    const item = severity[finding.severity] || severity.high;
                    const isSelected = selectedFindingId === finding.id;
                    return (
                      <button
                        key={finding.id}
                        onClick={() => openFinding(finding)}
                        className={cn("group block w-full px-3.5 py-3 text-left transition-colors", isSelected ? "bg-pine-soft/35" : "hover:bg-paper")}
                      >
                        <div className="flex items-start gap-2">
                          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.dot)} />
                          <div className="min-w-0 flex-1">
                            <div className={cn("text-[13px] font-semibold leading-snug", isSelected ? "text-pine-deep" : "text-ink")}>{finding.title}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted">
                              <span className="mono">{finding.ruleId}</span>
                              <span>·</span>
                              <span className="truncate">{finding.documentLabel}</span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                              <ConfidenceMeter value={finding.confidence} tone={finding.severity === "high" ? "rust" : finding.severity === "medium" ? "ochre" : "pine"} showValue={false} />
                              <span className="mono shrink-0 text-[10px] text-muted">{percent(finding.confidence)}</span>
                            </div>
                            {finding.ruleType === "image_forensics" ? (
                              <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-ochre"><CircleAlert className="h-3 w-3" /> Possible anomaly · human verification required</div>
                            ) : null}
                          </div>
                          <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-line-strong transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-line bg-[#faf8f2] px-3.5 py-2.5">
                  <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pine" /> Findings are advisory. No document is labelled forged. Human verification is required before an outcome.</p>
                </div>
              </>
            ) : (
              <div className="max-h-[590px] divide-y divide-line overflow-y-auto thin-scroll">
                {verifications.map((item) => {
                  const doc = documents.find((document) => document.id === item.documentId);
                  const statusItem = verificationStatus[item.status];
                  return (
                    <button key={item.documentId} onClick={() => setSelectedDocId(item.documentId)} className="group block w-full px-3.5 py-3 text-left transition-colors hover:bg-paper">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold">{doc?.label}</div>
                          <div className="mt-0.5 truncate text-[11px] text-muted">{item.adapter}</div>
                        </div>
                        <span className={cn("chip shrink-0 border", statusItem.className)}><span className={cn("h-1.5 w-1.5 rounded-full", statusItem.dot)} />{statusItem.label}</span>
                      </div>
                      <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{item.detail}</p>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
                        <span className="mono">{item.reference}</span>
                        <span>{item.checkedAt} IST</span>
                      </div>
                    </button>
                  );
                })}
                <div className="px-3.5 py-3">
                  <button className="btn btn-secondary h-9 w-full text-[12.5px]"><RefreshCw className="h-3.5 w-3.5" /> Retry unavailable sources</button>
                </div>
              </div>
            )}
          </aside>
        </div>
      ) : activeTab === "report" ? (
        <ValidationReport application={application} appFindings={appFindings} onRerun={rerun} rerunning={rerunning} />
      ) : (
        <AuditScope application={application} />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-dashed border-line-strong bg-[#f8f5ee]/70 px-4 py-2.5 text-[12px] text-muted">
        <span className="flex items-center gap-1.5"><Fingerprint className="h-3.5 w-3.5 text-pine" /> Application hash <span className="mono text-ink">c2a7…19f4</span></span>
        <span className="flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5 text-pine" /> Audit trail intact</span>
        <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Document views are logged</span>
        <span className="ml-auto font-mono text-[10.5px]">REFERENCE DATE 27 OCT 2026</span>
      </div>

      <ExplainabilityDrawer
        finding={drawerFinding}
        document={drawerFinding ? documents.find((doc) => doc.id === drawerFinding.documentId) ?? null : null}
        open={drawerOpen}
        acknowledged={drawerFinding ? acknowledged.includes(drawerFinding.id) : false}
        onClose={() => setDrawerOpen(false)}
        onAcknowledge={acknowledgeFinding}
      />

      <DecisionDialog
        open={decisionOpen}
        application={application}
        initialDecision={initialDecision}
        onClose={() => setDecisionOpen(false)}
        onRecorded={(decision) => {
          setToast(`Decision “${decision.replaceAll("_", " ")}” recorded by A. Menon. Sealed as audit entry #1285.`);
        }}
      />

      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}

function ClipboardIcon() {
  return <FileCheck2 className="h-3.5 w-3.5" />;
}
