"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Inbox,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { applications } from "@/lib/mock-data";
import { applicationStatus, cn, riskLevel } from "@/lib/display";
import type { ApplicationStatus, RiskLevel } from "@/lib/types";
import { PageHeader } from "@/components/ui";

const statusOptions: Array<{ value: "all" | ApplicationStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "findings_ready", label: "Findings ready" },
  { value: "in_review", label: "In review" },
  { value: "awaiting_source", label: "Awaiting source" },
  { value: "clarification_sent", label: "Clarification sent" },
  { value: "ready_for_decision", label: "Ready for decision" },
  { value: "processing", label: "Processing" },
];

const riskOptions: Array<{ value: "all" | RiskLevel; label: string }> = [
  { value: "all", label: "All risk levels" },
  { value: "high", label: "High risk" },
  { value: "medium", label: "Medium risk" },
  { value: "low", label: "Low risk" },
];

export default function ApplicationsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ApplicationStatus>("all");
  const [risk, setRisk] = useState<"all" | RiskLevel>("all");
  const [sortNewest, setSortNewest] = useState(true);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return applications
      .filter((app) => {
        if (normalized && !`${app.institution} ${app.id} ${app.city} ${app.state}`.toLowerCase().includes(normalized)) return false;
        if (status !== "all" && app.status !== status) return false;
        if (risk !== "all" && app.risk !== risk) return false;
        return true;
      })
      .sort((a, b) => (sortNewest ? b.submittedAt.localeCompare(a.submittedAt) : a.submittedAt.localeCompare(b.submittedAt)));
  }, [query, risk, sortNewest, status]);

  const hasFilters = query || status !== "all" || risk !== "all";

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow={`EoA Renewal 2026–27 · ${applications.length} applications`}
        title="Applications"
        description="Every submitted file, its evidence state, and the next human action. Sorted by scrutiny priority."
        actions={
          <>
            <button className="btn btn-secondary">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <Link href="/review" className="btn btn-primary">
              <Inbox className="h-3.5 w-3.5" />
              Review queue
            </Link>
          </>
        }
      />

      <div className="card mt-6 grid grid-cols-2 divide-x divide-y divide-line overflow-hidden lg:grid-cols-4 lg:divide-y-0">
        {[
          { label: "Total applications", value: String(applications.length), detail: "registered", icon: Inbox, tone: "text-ink" },
          { label: "Findings ready", value: String(applications.filter((a) => a.status === "findings_ready").length), detail: "awaiting officer", icon: CheckCircle2, tone: "text-ochre" },
          { label: "Ready for decision", value: String(applications.filter((a) => a.status === "ready_for_decision").length), detail: "no blocking issues", icon: ArrowRight, tone: "text-pine" },
          { label: "Median file age", value: "—", detail: "submission → decision", icon: Clock3, tone: "text-ink" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="px-5 py-4">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", item.tone)} />
                <span className="eyebrow text-[11px]">{item.label}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={cn("display text-[32px] leading-none", item.tone)}>{item.value}</span>
                <span className="text-[12px] text-muted">{item.detail}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface p-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by institution, application ID or city…"
            className="input h-9 border-transparent bg-paper pl-9 text-[13px] focus:bg-surface"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              className="h-9 appearance-none rounded-md border border-line bg-surface pl-3 pr-8 text-[12.5px] font-medium text-ink outline-none transition-colors hover:border-line-strong"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          </div>
          <div className="relative">
            <select
              value={risk}
              onChange={(event) => setRisk(event.target.value as typeof risk)}
              className="h-9 appearance-none rounded-md border border-line bg-surface pl-3 pr-8 text-[12.5px] font-medium text-ink outline-none transition-colors hover:border-line-strong"
            >
              {riskOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          </div>
          <button
            onClick={() => setSortNewest((current) => !current)}
            className="flex h-9 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-[12.5px] font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            <ArrowDownUp className="h-3.5 w-3.5" />
            {sortNewest ? "Newest first" : "Oldest first"}
          </button>
          {hasFilters ? (
            <button
              onClick={() => { setQuery(""); setStatus("all"); setRisk("all"); }}
              className="flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-rust transition-colors hover:bg-rust-soft"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          ) : null}
        </div>
      </div>

      <section className="card mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-[14px] font-semibold">Application register</h2>
            <span className="mono text-[11.5px] text-muted">{filtered.length} shown</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <span className="h-2 w-2 rounded-full bg-pine" /> Live status
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-[#f8f5ee]">
                <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Institution</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Programme</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Submitted</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Documents</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Findings</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Risk</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Status</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Officer</th>
                <th className="w-10 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((app) => {
                const statusItem = applicationStatus[app.status];
                const riskItem = riskLevel[app.risk];
                return (
                  <tr key={app.id} className="row-hover group">
                    <td className="px-5 py-3.5">
                      <Link href={`/applications/${app.id}`} className="flex items-center gap-3">
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold", riskItem.className)}>
                          {app.shortName}
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-[250px] truncate text-[13.5px] font-semibold text-ink group-hover:text-pine-deep">{app.institution}</span>
                          <span className="mono mt-0.5 block text-[11px] text-muted">{app.id} · {app.city}, {app.state}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="block text-[13px] text-ink">{app.programme}</span>
                      <span className="mt-0.5 block text-[11.5px] text-muted">Intake {app.intake}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="block text-[13px] text-ink">{app.submittedLabel}</span>
                      <span className="mt-0.5 block max-w-[120px] truncate text-[11px] text-muted">{app.lastAction}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("mono text-[12.5px]", app.documentsReceived < app.documentsTotal ? "text-ochre" : "text-ink")}>
                          {app.documentsReceived}<span className="text-muted">/{app.documentsTotal}</span>
                        </span>
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[#ebe6db]">
                          <div className={cn("h-full rounded-full", app.documentsReceived < app.documentsTotal ? "bg-ochre" : "bg-pine")} style={{ width: `${(app.documentsReceived / app.documentsTotal) * 100}%` }} />
                        </div>
                      </div>
                      {app.documentsReceived < app.documentsTotal ? <span className="mt-1 block text-[11px] text-ochre">missing item</span> : <span className="mt-1 block text-[11px] text-muted">complete</span>}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={cn("mono text-[12.5px] font-medium", app.highFindings > 0 ? "text-rust" : "text-ink")}>{app.findings}</span>
                      <span className="mt-1 block text-[11px] text-muted">{app.highFindings} high</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={cn("chip border", riskItem.className)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", riskItem.dot)} />
                        {riskItem.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={cn("chip border", statusItem.className)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", statusItem.dot)} />
                        {statusItem.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="flex items-center gap-1.5 text-[12px] text-ink">
                        {app.officer === "Unassigned" ? (
                          <span className="flex items-center gap-1.5 text-muted"><span className="h-4 w-4 rounded-full border border-dashed border-line-strong" /> Unassigned</span>
                        ) : (
                          <>
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pine-soft text-[10px] font-bold text-pine">{app.officer.split(" ").map((p) => p[0]).join("")}</span>
                            {app.officer}
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <Link href={`/applications/${app.id}`} className="inline-flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-paper hover:text-pine">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-muted"><Search className="h-4 w-4" /></div>
            <div className="mt-3 text-[13px] font-semibold">{applications.length === 0 ? "No applications registered yet" : "No applications match those filters"}</div>
            <p className="mt-1 text-[11px] text-muted">{applications.length === 0 ? "Applications submitted by institutions will appear here." : "Try a different status, risk level or search term."}</p>
            {hasFilters ? <button onClick={() => { setQuery(""); setStatus("all"); setRisk("all"); }} className="btn btn-secondary mt-4">Reset filters</button> : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-line bg-[#faf8f2] px-5 py-2.5">
          <span className="text-[12px] text-muted">Showing {filtered.length === 0 ? 0 : 1}–{filtered.length} of {applications.length}</span>
          <div className="flex items-center gap-1">
            <button className="flex h-7 w-7 items-center justify-center rounded border border-line bg-surface text-muted disabled:opacity-40" disabled><ChevronLeft className="h-3.5 w-3.5" /></button>
            <button className="flex h-7 w-7 items-center justify-center rounded bg-pine text-[12px] font-semibold text-white">1</button>
            <button className="flex h-7 w-7 items-center justify-center rounded border border-line bg-surface text-muted disabled:opacity-40" disabled><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {[
          { title: "No auto-decisions", body: "Every outcome is recorded by an authorised officer. ScrutiniX never changes an application's outcome on its own.", icon: CheckCircle2, tone: "text-pine" },
          { title: "Explainable by default", body: "Each finding carries its rule ID, version, evidence, source and timestamp. Nothing is a black box.", icon: SlidersHorizontal, tone: "text-slate" },
          { title: "Graceful degradation", body: "A failed OCR pass or issuer timeout becomes a review item with a reason. It never crashes the pipeline.", icon: Clock3, tone: "text-ochre" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex gap-3 rounded-lg border border-line bg-surface px-4 py-3.5">
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", item.tone)} />
              <div>
                <div className="text-[13px] font-semibold">{item.title}</div>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{item.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
