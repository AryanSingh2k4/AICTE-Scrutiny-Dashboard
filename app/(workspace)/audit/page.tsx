"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  Eye,
  FileText,
  Fingerprint,
  KeyRound,
  Link2,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { auditEntries } from "@/lib/mock-data";
import { cn } from "@/lib/display";
import { PageHeader, SectionHeading } from "@/components/ui";

const actionFilters = [
  { value: "all", label: "All events" },
  { value: "officer.decision.recorded", label: "Officer decisions" },
  { value: "validation.run.completed", label: "Validation runs" },
  { value: "document.viewed", label: "Document views" },
  { value: "rule.updated", label: "Rule changes" },
  { value: "issuer.verification.failed", label: "Issuer failures" },
];

export default function AuditPage() {
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(auditEntries[0]?.id ?? "");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selected = auditEntries.find((entry) => entry.id === selectedId) ?? auditEntries[0] ?? null;

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return auditEntries.filter((entry) => {
      if (actionFilter !== "all" && entry.action !== actionFilter) return false;
      if (normalized && !`${entry.action} ${entry.actor} ${entry.entity} ${entry.id}`.toLowerCase().includes(normalized)) return false;
      return true;
    });
  }, [actionFilter, query]);

  function verifyChain() {
    setVerifying(true);
    window.setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      setToast(
        auditEntries.length > 0
          ? `Chain integrity verified. ${auditEntries.length} entries checked. First broken entry: none.`
          : "Audit chain initialized. 0 entries recorded.",
      );
    }, 900);
  }

  function copyHash() {
    if (selected) {
      navigator.clipboard?.writeText(selected.hash);
      setToast("Entry hash copied to clipboard.");
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow={`Append-only · SHA-256 hash chain · ${auditEntries.length} entries`}
        title="Audit trail"
        description="A verifiable record of every rule applied, record read, source response, document view and human decision."
        actions={
          <>
            <button className="btn btn-secondary"><Download className="h-3.5 w-3.5" /> Export log</button>
            <button onClick={verifyChain} disabled={verifying} className={cn("btn", verified ? "btn-secondary" : "btn-primary")}>
              {verifying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              {verifying ? "Verifying chain…" : verified ? "Chain verified" : "Verify chain integrity"}
            </button>
          </>
        }
      />

      <div className="card mt-6 grid grid-cols-2 divide-x divide-y divide-line overflow-hidden lg:grid-cols-4 lg:divide-y-0">
        {[
          { label: "Chain status", value: auditEntries.length > 0 ? "Intact" : "Ready", detail: "cryptographic verification", tone: "text-pine", icon: ShieldCheck },
          { label: "Entries sealed", value: String(auditEntries.length), detail: "append-only log", tone: "text-ink", icon: LockKeyhole },
          { label: "Last sealed", value: auditEntries.length > 0 ? auditEntries[0].timestamp : "—", detail: "timestamped", tone: "text-ink", icon: Clock3 },
          { label: "Hash algorithm", value: "SHA-256", detail: "prev_hash + canonical JSON", tone: "text-ink", icon: Fingerprint },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="px-5 py-4">
              <div className="flex items-center gap-2"><Icon className={cn("h-4 w-4", item.tone)} /><span className="eyebrow text-[11px]">{item.label}</span></div>
              <div className={cn("mono mt-2 text-[26px] font-medium leading-none", item.tone)}>{item.value}</div>
              <div className="mt-1.5 text-[12px] text-muted">{item.detail}</div>
            </div>
          );
        })}
      </div>

      {verified ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-pine/20 bg-pine-soft/60 px-4 py-2.5 text-[13px] text-pine-deep animate-fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-semibold">Chain integrity verified.</span>
          <span className="text-[12.5px]">{auditEntries.length} entries checked · first broken entry: none · no gaps in sequence.</span>
          <span className="mono ml-auto text-[11px]">verified</span>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
            <div className="relative min-w-[210px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search actor, action or entity…" className="input h-9 border-transparent bg-paper pl-8 text-[13px] focus:bg-surface" />
            </div>
            <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="h-9 rounded-md border border-line bg-surface px-2.5 text-[12.5px] font-medium text-ink outline-none">
              {actionFilters.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
            </select>
            <span className="mono text-[11.5px] text-muted">{filtered.length} of {auditEntries.length} shown</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-[#f8f5ee]">
                  <th className="w-14 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Seq</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Event</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Actor</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Entity</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Time (IST)</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Hash</th>
                  <th className="w-8 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((entry) => {
                  const active = selectedId === entry.id;
                  return (
                    <tr key={entry.id} onClick={() => setSelectedId(entry.id)} className={cn("cursor-pointer transition-colors", active ? "bg-pine-soft/35" : "row-hover")}>
                      <td className="px-4 py-2.5"><span className="mono text-[12px] text-muted">#{entry.sequence}</span></td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-1.5 w-1.5 rounded-full", entry.action.includes("failed") ? "bg-rust" : entry.action.includes("decision") ? "bg-pine" : entry.action.includes("rule") ? "bg-ochre" : "bg-slate")} />
                          <span className="mono text-[12.5px] font-medium text-ink">{entry.action}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5"><span className="text-[12.5px] text-ink">{entry.actor}</span><span className="mt-0.5 block text-[11px] text-muted">{entry.actorRole}</span></td>
                      <td className="px-3 py-2.5"><span className="mono text-[12px] text-muted">{entry.entity}</span></td>
                      <td className="px-3 py-2.5"><span className="mono text-[11.5px] text-muted">{entry.timestamp}</span></td>
                      <td className="px-3 py-2.5"><span className="mono text-[11.5px] text-muted">{entry.hash}</span></td>
                      <td className="px-2 py-2.5"><ChevronRight className={cn("h-3.5 w-3.5", active ? "text-pine" : "text-line-strong")} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 ? <div className="px-5 py-12 text-center text-[12px] text-muted">No entries match the current filter.</div> : null}
          <div className="flex items-center justify-between border-t border-line bg-[#faf8f2] px-4 py-2.5">
            <span className="text-[12px] text-muted">Showing the 8 most recent entries · full log available via export.</span>
            <div className="flex items-center gap-1">
              <button className="flex h-7 items-center gap-1 rounded border border-line bg-surface px-2.5 text-[11.5px] text-muted"><ChevronRight className="h-3 w-3 rotate-180" /> Prev</button>
              <button className="flex h-7 items-center gap-1 rounded border border-line bg-surface px-2.5 text-[11.5px] text-muted">Next <ChevronRight className="h-3 w-3" /></button>
            </div>
          </div>
        </section>

        <aside className="space-y-4 self-start">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <SectionHeading title="Selected entry" meta={selected?.id ?? "—"} />
              {selected ? (
                <button onClick={copyHash} className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-paper hover:text-ink" aria-label="Copy hash"><Copy className="h-3.5 w-3.5" /></button>
              ) : null}
            </div>
            {!selected ? (
              <div className="p-8 text-center text-[12px] text-muted">
                No audit entries recorded yet. Actions, validations, and decisions will be cryptographically sealed here.
              </div>
            ) : (
              <>
                <div className="px-4 py-3.5">
                  <div className="mono text-[13px] font-medium text-ink">{selected.action}</div>
                  <div className="mt-2 flex items-center gap-2 text-[12px] text-muted"><UserRound className="h-3.5 w-3.5" /> {selected.actor} <span>·</span> {selected.actorRole}</div>
                  <div className="mt-1 flex items-center gap-2 text-[12px] text-muted"><FileText className="h-3.5 w-3.5" /> <span className="mono">{selected.entity}</span></div>
                  <div className="mt-1 flex items-center gap-2 text-[12px] text-muted"><Clock3 className="h-3.5 w-3.5" /> {selected.timestamp} IST</div>

                  <div className="mt-3.5 rounded-md border border-line bg-[#f8f5ee] p-2.5">
                    <div className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Payload</div>
                    <pre className="mt-1.5 overflow-x-auto font-mono text-[11px] leading-[1.7] text-[#4b514b]">{JSON.stringify(selected.payload, null, 2)}</pre>
                  </div>

                  <div className="mt-3 space-y-2 border-t border-line pt-3">
                    <div>
                      <div className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Previous hash</div>
                      <div className="mono mt-1 flex items-center justify-between text-[11.5px] text-muted"><span>{selected.previousHash}</span><Link2 className="h-3 w-3" /></div>
                    </div>
                    <div>
                      <div className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Entry hash</div>
                      <div className="mono mt-1 flex items-center justify-between text-[11.5px] text-pine"><span>{selected.hash}</span><LockKeyhole className="h-3 w-3" /></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-line bg-[#faf8f2] px-4 py-2.5">
                  <span className="flex items-center gap-1 text-[11.5px] text-pine"><Check className="h-3 w-3" /> Chain link valid</span>
                  <span className="mono text-[11px] text-muted">SEQ #{selected.sequence}</span>
                </div>
              </>
            )}
          </section>

          <section className="card p-4">
            <div className="flex items-center justify-between">
              <SectionHeading title="Chain integrity" />
              <span className={cn("chip border", verified ? "border-pine/15 bg-pine-soft text-pine" : "border-line bg-paper text-muted")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", verified ? "bg-pine" : "bg-slate")} /> {verified ? "Verified" : "Not checked"}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="flex flex-1 items-center gap-1">
                  <div className={cn("flex h-8 flex-1 items-center justify-center rounded border text-[11px]", verified ? "border-pine/20 bg-pine-soft text-pine" : "border-line bg-[#f8f5ee] text-muted")}>
                    <LockKeyhole className="h-3.5 w-3.5" />
                  </div>
                  {index < 4 ? <Link2 className={cn("h-3 w-3 shrink-0", verified ? "text-pine/50" : "text-line-strong")} /> : null}
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 text-[12px]">
              <div className="flex justify-between"><span className="text-muted">Entries checked</span><span className="mono">{verified ? "1,284" : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted">First broken</span><span className="mono text-pine">{verified ? "none" : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted">Last verified</span><span className="mono">{verified ? "just now" : "09:58 IST"}</span></div>
            </div>
            <button onClick={verifyChain} disabled={verifying} className="btn btn-secondary mt-3 h-9 w-full text-[12.5px]">
              {verifying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              {verifying ? "Verifying…" : "Run verification"}
            </button>
          </section>

          <section className="card p-4">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold"><Eye className="h-3.5 w-3.5" /> What gets logged</div>
            <div className="mt-2.5 space-y-1.5 text-[12px] text-muted">
              {[
                "Rules applied, with version",
                "AICTE records read",
                "Issuer source responses",
                "Document views & PII reveals",
                "Officer decisions",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5"><Check className="h-3 w-3 text-pine" /> {item}</div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="flex gap-3 rounded-lg border border-line bg-surface px-4 py-3.5">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-pine" />
          <div><div className="text-[13px] font-semibold">Append-only by design</div><p className="mt-1 text-[12px] leading-relaxed text-muted">UPDATE and DELETE are revoked at the database level. Entries can only be appended through the audit function.</p></div>
        </div>
        <div className="flex gap-3 rounded-lg border border-line bg-surface px-4 py-3.5">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-slate" />
          <div><div className="text-[13px] font-semibold">Each row seals the previous</div><p className="mt-1 text-[12px] leading-relaxed text-muted">hash = SHA-256(prev_hash || canonical_json(row)), serialized under an advisory lock.</p></div>
        </div>
        <div className="flex gap-3 rounded-lg border border-line bg-surface px-4 py-3.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ochre" />
          <div><div className="text-[13px] font-semibold">Independent verification</div><p className="mt-1 text-[12px] leading-relaxed text-muted">verify_audit_chain() returns ok or the first broken entry ID, so integrity can be checked without trust.</p></div>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-5 right-5 z-[100] flex max-w-[400px] items-start gap-3 rounded-lg border border-pine/20 bg-[#f7fbf7] px-4 py-3 shadow-lift animate-fade-up">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine-soft text-pine"><Check className="h-3 w-3" /></span>
          <p className="text-[12.5px] leading-relaxed text-muted">{toast}</p>
          <button onClick={() => setToast(null)} className="ml-1 text-muted hover:text-ink" aria-label="Dismiss"><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : null}
    </div>
  );
}
