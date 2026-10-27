"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  FileCheck2,
  FileStack,
  FileText,
  FileWarning,
  Inbox,
  MoreHorizontal,
  RotateCcw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  activityFeed,
  applications,
  auditEntries,
  dashboardMetrics,
  reviewQueue,
  signalData,
  sourceHealth,
  throughputData,
} from "@/lib/mock-data";
import { cn } from "@/lib/display";
import { ConfidenceMeter, PageHeader, RiskChip, SectionHeading, Sparkline } from "@/components/ui";
import { ThroughputChart } from "@/components/overview-charts";

const toneMap = {
  pine: { chip: "bg-pine-soft text-pine", spark: "#1c5444" },
  ochre: { chip: "bg-ochre-soft text-ochre", spark: "#98661c" },
  rust: { chip: "bg-rust-soft text-rust", spark: "#a24835" },
  neutral: { chip: "bg-[#e8e4d8] text-ink", spark: "#4d544e" },
};

export default function OverviewPage() {
  const [tab, setTab] = useState<"all" | "high" | "source" | "review">("all");

  const visibleApplications = applications
    .filter((app) => {
      if (tab === "high") return app.risk === "high";
      if (tab === "source") return app.status === "awaiting_source";
      if (tab === "review") return app.status === "in_review";
      return true;
    })
    .slice(0, 5);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Tuesday, 27 October 2026 · 11:42 IST"
        title="Scrutiny overview"
        description="A live view of EoA Renewal applications, evidence gaps and the items that need a human decision."
        actions={
          <>
            <button className="btn btn-secondary">
              <Download className="h-4 w-4" />
              Export brief
            </button>
            <Link href="/review" className="btn btn-primary">
              <Inbox className="h-4 w-4" />
              Review queue ({reviewQueue.length})
            </Link>
          </>
        }
      />

      <div className="card mt-6 grid grid-cols-2 overflow-hidden lg:grid-cols-4">
        {dashboardMetrics.map((metric, index) => {
          const tone = toneMap[metric.tone];
          return (
            <div
              key={metric.label}
              className={cn(
                "relative px-4 py-4 sm:px-5 sm:py-5",
                index < 2 ? "border-b border-line lg:border-b-0" : "",
                index % 2 === 0 ? "border-r border-line" : "",
                index !== 3 ? "lg:border-r lg:border-line" : "",
                index === 1 ? "border-r-0 lg:border-r" : "",
              )}
            >
              <div className="eyebrow text-[11px]">{metric.label}</div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <div className="display text-[36px] leading-none tracking-[-0.035em] sm:text-[40px]">{metric.value}</div>
                <Sparkline values={metric.series} tone={tone.spark} />
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <span className={cn("inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold", tone.chip)}>
                  {metric.tone === "pine" ? <TrendingDown className="h-3 w-3" /> : null}
                  {metric.delta}
                </span>
                <span className="text-[12px] text-muted">{metric.detail}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <section className="card overflow-hidden xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
            <SectionHeading title="Applications in focus" meta={`${visibleApplications.length} of ${applications.length}`} />
            <div className="flex items-center gap-1">
              {[
                { key: "all", label: "All" },
                { key: "high", label: "High risk" },
                { key: "source", label: "Awaiting source" },
                { key: "review", label: "In review" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key as typeof tab)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                    tab === item.key ? "bg-pine-soft text-pine-deep font-semibold" : "text-muted hover:bg-paper hover:text-ink",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {visibleApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <FileText className="h-9 w-9 text-muted/50" />
                <div className="mt-2.5 text-[14px] font-semibold text-ink">No applications registered</div>
                <p className="mt-1 text-[12px] text-muted">Applications submitted by institutions will appear here.</p>
              </div>
            ) : (
              <table className="w-full min-w-[740px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-[#f8f5ee]">
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Institution</th>
                    <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">File</th>
                    <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Findings</th>
                    <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Risk</th>
                    <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Status</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visibleApplications.map((app) => (
                    <tr key={app.id} className="transition-colors hover:bg-paper/70">
                      <td className="px-5 py-3.5">
                        <Link href={`/applications/${app.id}`} className="group block">
                          <div className="text-[13.5px] font-semibold text-ink group-hover:text-pine-deep">{app.institution}</div>
                          <div className="mt-0.5 text-[12px] text-muted">
                            {app.city}, {app.state} · <span className="mono text-[11.5px]">{app.programme}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="mono text-[12px] text-ink">{app.id}</span>
                        <div className="text-[11.5px] text-muted">{app.submittedLabel}</div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("mono text-[13px] font-medium", app.highFindings > 0 ? "text-rust" : "text-ink")}>
                            {app.findings}
                          </span>
                          {app.highFindings > 0 ? (
                            <span className="rounded bg-rust-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-rust">
                              {app.highFindings} high
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[11.5px] text-muted">{app.documentsReceived}/{app.documentsTotal} docs</div>
                      </td>
                      <td className="px-3 py-3.5">
                        <RiskChip level={app.risk} />
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="mono text-[12px] capitalize text-ink">{app.status.replace("_", " ")}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={`/applications/${app.id}`} className="btn-ghost inline-flex items-center gap-1 text-[12.5px] font-medium text-pine hover:text-pine-deep">
                          Review <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-line bg-[#faf8f2] px-5 py-3 text-[12px] text-muted">
            <span>Showing {visibleApplications.length} priority applications · updated 11:42 IST</span>
            <Link href="/applications" className="font-semibold text-pine hover:underline">
              View all applications →
            </Link>
          </div>
        </section>

        <section className="card flex flex-col overflow-hidden xl:col-span-4">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <div>
              <SectionHeading title="Manual review queue" meta={`${reviewQueue.length} open`} />
              <p className="mt-1 text-[12px] text-muted">Only a human officer can resolve these.</p>
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pine-soft text-pine">
              <CircleAlert className="h-4 w-4" />
            </span>
          </div>
          <div className="flex-1 divide-y divide-line">
            {reviewQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <Inbox className="h-8 w-8 text-muted/50" />
                <div className="mt-2.5 text-[13.5px] font-semibold text-ink">Queue is clear</div>
                <p className="mt-0.5 text-[12px] text-muted">No applications currently require human review.</p>
              </div>
            ) : (
              reviewQueue.slice(0, 3).map((item) => (
                <Link key={item.id} href="/review" className="group block px-5 py-3.5 transition-colors hover:bg-paper">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        item.priority === "urgent" ? "bg-rust" : item.priority === "high" ? "bg-ochre" : "bg-slate",
                      )}
                    />
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">{item.priority}</span>
                    <span className="mono ml-auto text-[11px] text-muted">{item.age}</span>
                  </div>
                  <div className="mt-1.5 text-[13px] font-semibold leading-snug text-ink group-hover:text-pine-deep">{item.reason}</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#efebe2] text-[10px] font-bold text-muted">{item.shortName}</span>
                    <span className="truncate text-[12px] text-muted">{item.institution}</span>
                    <span className="mono ml-auto shrink-0 text-[11px] text-muted">{item.ruleId}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link href="/review" className="flex items-center justify-between border-t border-line bg-[#faf8f2] px-5 py-3 text-[12.5px] font-semibold text-pine transition-colors hover:bg-pine-soft/40">
            Open full queue
            <span className="flex items-center gap-1.5"><span className="mono text-[11px] text-muted">{reviewQueue.length} items</span><ArrowUpRight className="h-3.5 w-3.5" /></span>
          </Link>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <section className="card overflow-hidden xl:col-span-7">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <div>
              <SectionHeading title="Scrutiny throughput" meta="last 7 days" />
              <p className="mt-1 text-[12px] text-muted">Applications validated against the 2026–27 checklist.</p>
            </div>
            <div className="flex items-center gap-3 text-[11.5px] text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-pine" /> Validated</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ochre" /> Manual</span>
            </div>
          </div>
          <div className="px-3 pb-3 pt-4">
            <ThroughputChart />
          </div>
          <div className="grid grid-cols-3 border-t border-line bg-[#faf8f2]">
            <div className="border-r border-line px-5 py-3">
              <div className="mono text-[15px] font-semibold text-ink">{throughputData.reduce((acc, c) => acc + c.validated, 0)}</div>
              <div className="text-[11.5px] text-muted">validated this week</div>
            </div>
            <div className="border-r border-line px-5 py-3">
              <div className="mono text-[15px] font-semibold text-ink">{throughputData.reduce((acc, c) => acc + c.manual, 0)}</div>
              <div className="text-[11.5px] text-muted">routed to review</div>
            </div>
            <div className="px-5 py-3">
              <div className="mono text-[15px] font-semibold text-pine">
                {throughputData.length ? `${Math.round((throughputData.reduce((acc, c) => acc + c.validated, 0) / (throughputData.reduce((acc, c) => acc + c.validated + c.manual, 0) || 1)) * 100)}%` : "—"}
              </div>
              <div className="text-[11.5px] text-muted">straight-through rate</div>
            </div>
          </div>
        </section>

        <section className="card overflow-hidden xl:col-span-5">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <div>
              <SectionHeading title="Signals by family" meta={`${signalData.length} open`} />
              <p className="mt-1 text-[12px] text-muted">Advisory indicators requiring human verification.</p>
            </div>
            <Link href="/applications" className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-paper hover:text-ink">
              <MoreHorizontal className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4 px-5 py-5">
            {signalData.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-muted">No risk signals flagged yet.</div>
            ) : (
              signalData.map((signal) => (
                <div key={signal.label}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-ink">{signal.label}</span>
                    <span className="mono text-[11px] text-muted">{signal.count}</span>
                  </div>
                  <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-[#ebe6db]">
                    <div className="h-full rounded-full" style={{ width: `${(signal.count / 10) * 100}%`, backgroundColor: signal.tone }} />
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mx-5 mb-4 flex items-start gap-2.5 rounded-md border border-line bg-[#f7f4ec] px-3.5 py-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-pine" />
            <p className="text-[11.5px] leading-relaxed text-muted">
              Indicators are not conclusions. No finding is labelled forged or fraudulent anywhere in ScrutiniX.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <section className="card overflow-hidden xl:col-span-5">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <SectionHeading title="Recent activity" />
            <span className="flex items-center gap-1.5 text-[11px] text-muted"><span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-pine" /> Live</span>
          </div>
          <div className="divide-y divide-line">
            {activityFeed.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-muted">No activity events recorded yet.</div>
            ) : (
              activityFeed.slice(0, 4).map((item) => (
                <div key={item.title} className="flex items-start gap-3 px-5 py-3">
                  <span className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    item.tone === "rust" ? "bg-rust" : item.tone === "ochre" ? "bg-ochre" : item.tone === "slate" ? "bg-slate" : "bg-pine",
                  )} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium text-ink">{item.title}</div>
                    <div className="mt-0.5 truncate text-[11px] text-muted">{item.meta}</div>
                  </div>
                  <span className="mono text-[11px] text-muted">{item.time}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="card overflow-hidden xl:col-span-4">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <SectionHeading title="Issuer source health" />
            <span className="chip border-pine/15 bg-pine-soft text-pine">4 adapters</span>
          </div>
          <div className="divide-y divide-line">
            {sourceHealth.map((source) => (
              <div key={source.name} className="flex items-center gap-3 px-5 py-3">
                <span className={cn("h-2 w-2 rounded-full", source.tone === "ochre" ? "bg-ochre" : "bg-pine")} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-medium text-ink">{source.name}</div>
                  <div className={cn("text-[11px]", source.tone === "ochre" ? "text-ochre font-medium" : "text-muted")}>{source.status}</div>
                </div>
                <div className="w-[78px]">
                  <ConfidenceMeter value={source.uptime / 100} tone={source.tone === "ochre" ? "ochre" : "pine"} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[10px] border border-pine/20 bg-pine-deep px-5 py-4 text-[#f3f0e6] shadow-card xl:col-span-3">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full border border-white/10" />
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full border border-white/10" />
          <div className="eyebrow text-[#b7c9bf] text-[11px]">Current rulebook</div>
          <div className="display mt-2 text-[30px] leading-none">2026–27</div>
          <div className="mt-1 text-[12px] text-[#c7d4cb]">EoA Renewal · version 1.4</div>
          <div className="mt-4 flex items-center gap-4 border-t border-white/15 pt-3">
            <div>
              <div className="mono text-[16px] font-semibold">12</div>
              <div className="text-[11px] text-[#aebfb4]">rules</div>
            </div>
            <div>
              <div className="mono text-[16px] font-semibold">5</div>
              <div className="text-[11px] text-[#aebfb4]">doc classes</div>
            </div>
            <div>
              <div className="mono text-[16px] font-semibold">3</div>
              <div className="text-[11px] text-[#aebfb4]">issuers</div>
            </div>
          </div>
          <Link href="/rules" className="mt-4 flex items-center justify-between rounded-md border border-white/20 bg-white/[0.08] px-3.5 py-2 text-[12.5px] font-semibold text-[#f3f0e6] transition-colors hover:bg-white/[0.14]">
            Open rulebook <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#9fb2a7]">
            <CheckCircle2 className="h-3 w-3" /> Seeded from YAML · editable by officers
          </div>
        </section>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-dashed border-line-strong bg-[#f8f5ee]/60 px-4 py-2.5 text-[12px] text-muted">
        <span className="flex items-center gap-1.5"><FileWarning className="h-3.5 w-3.5 text-pine" /> {reviewQueue.length} items in review queue</span>
        <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> System ready for document processing</span>
        <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-pine" /> Audit chain initialized · {auditEntries.length} entries</span>
        <span className="ml-auto font-mono text-[11px] font-semibold">READY</span>
      </div>
    </div>
  );
}
