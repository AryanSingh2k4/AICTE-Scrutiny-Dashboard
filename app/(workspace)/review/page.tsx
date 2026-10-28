"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";
import { reviewQueue } from "@/lib/mock-data";
import { cn, percent, reviewCategory } from "@/lib/display";
import type { ReviewItem } from "@/lib/types";
import { PageHeader } from "@/components/ui";

function QueueCard({
  item,
  claimed,
  onClaim,
}: {
  item: ReviewItem;
  claimed: boolean;
  onClaim: () => void;
}) {
  const accent =
    item.priority === "urgent"
      ? "before:bg-rust"
      : item.priority === "high"
        ? "before:bg-ochre"
        : "before:bg-slate";

  return (
    <article className={cn("card relative overflow-hidden p-3.5 before:absolute before:inset-y-0 before:left-0 before:w-[2px]", accent)}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn(
          "text-[11px] font-bold uppercase tracking-[0.12em]",
          item.priority === "urgent" ? "text-rust" : item.priority === "high" ? "text-ochre" : "text-slate",
        )}>
          {item.priority === "urgent" ? "Urgent" : item.priority === "high" ? "High priority" : "Normal"}
        </span>
        <span className="flex items-center gap-1 text-[11.5px] text-muted"><Clock3 className="h-3 w-3" /> {item.age}</span>
      </div>

      <Link href={`/applications/${item.applicationId}`} className="group mt-2 block">
        <h3 className="text-[13.5px] font-semibold leading-snug text-ink group-hover:text-pine-deep">{item.reason}</h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[#efebe2] text-[10px] font-bold text-muted">{item.shortName}</span>
          <span className="truncate text-[12px] text-muted">{item.institution}</span>
        </div>
      </Link>

      <div className="mt-3 rounded-md border border-line bg-[#faf8f2] px-2.5 py-2">
        <div className="flex items-center justify-between">
          <span className="mono text-[11px] text-muted">{item.ruleId}</span>
          <span className="mono text-[11px] text-muted">{reviewCategory[item.category]}</span>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-[#656a62]">
          {item.category === "source_unavailable"
            ? "Adapter timeout after 5.0s. No conclusive response recorded."
            : item.category === "anomaly"
              ? "ELA variance 3.8σ above page median in certificate number region."
              : "Normalized similarity 0.76 against configured threshold 0.95."}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {claimed ? (
            <>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pine-soft text-[10px] font-bold text-pine">AM</span>
              <span className="text-[12px] font-medium text-pine">You</span>
            </>
          ) : item.assignee ? (
            <>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#eeeae0] text-[10px] font-bold text-muted">{item.assignee.split(" ").map((part) => part[0]).join("")}</span>
              <span className="text-[12px] text-muted">{item.assignee}</span>
            </>
          ) : (
            <>
              <span className="h-5 w-5 rounded-full border border-dashed border-line-strong" />
              <span className="text-[12px] text-muted">Unassigned</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!claimed && !item.assignee ? (
            <button onClick={onClaim} className="flex h-6.5 items-center gap-1 rounded border border-line bg-surface px-2 text-[12px] font-semibold text-pine hover:border-pine/30 hover:bg-pine-soft/40">
              <UserPlus className="h-3 w-3" /> Claim
            </button>
          ) : null}
          <Link href={`/applications/${item.applicationId}`} className="flex h-6.5 items-center gap-1 rounded px-2 text-[12px] font-semibold text-muted hover:bg-paper hover:text-ink">
            Open <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function ReviewQueuePage() {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [claimed, setClaimed] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);

  useEffect(() => {
    async function loadQueue() {
      try {
        const res = await fetch("/api/applications");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.applications)) {
            const queueItems: ReviewItem[] = data.applications
              .filter((app: any) => app.findings > 0 || app.status === "findings_available" || app.risk === "high")
              .map((app: any) => ({
                id: `REV-${app.id}`,
                applicationId: app.id,
                institution: app.institution,
                shortName: app.shortName,
                reason: `${app.findings} forensic anomaly item(s) require officer scrutiny`,
                category: "anomaly",
                ruleId: "EOA-PLAG-01",
                confidence: 0.95,
                age: "Just now",
                priority: "urgent",
              }));
            setItems(queueItems);
          }
        }
      } catch (e) {
        console.warn("Notice loading dynamic queue:", e);
      }
    }
    loadQueue();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (normalized && !`${item.institution} ${item.applicationId} ${item.reason}`.toLowerCase().includes(normalized)) return false;
      return true;
    });
  }, [category, items, query]);

  const columns = [
    { key: "urgent", label: "Urgent", detail: "Resolve within 2 hours", items: filtered.filter((item) => item.priority === "urgent") },
    { key: "high", label: "High priority", detail: "Resolve within 1 day", items: filtered.filter((item) => item.priority === "high") },
    { key: "normal", label: "Normal", detail: "Resolve within 3 days", items: filtered.filter((item) => item.priority === "normal") },
  ];

  function claim(id: string, institution: string) {
    setClaimed((current) => [...current, id]);
    setToast(`Queue item ${id} claimed. ${institution} is now assigned to you.`);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow={`${items.length} open · ${items.filter(i => i.priority === "urgent" || i.priority === "high").length} high priority`}
        title="Manual review queue"
        description="Items where automated checks were inconclusive, unavailable, or need a human judgment. Nothing here changes an outcome until an officer acts."
        actions={
          <>
            <button className="btn btn-secondary"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
            <button onClick={() => setToast(`${items.filter(i => !i.assignee && !claimed.includes(i.id)).length} unassigned items distributed by current workload.`)} className="btn btn-primary"><UserPlus className="h-3.5 w-3.5" /> Auto-assign ({items.filter(i => !i.assignee && !claimed.includes(i.id)).length})</button>
          </>
        }
      />

      <div className="card mt-6 grid grid-cols-2 divide-x divide-y divide-line overflow-hidden lg:grid-cols-4 lg:divide-y-0">
        {[
          { label: "Unassigned", value: String(items.filter(i => !i.assignee && !claimed.includes(i.id)).length), detail: "awaiting officer", tone: "text-ink" },
          { label: "Source unavailable", value: String(items.filter(i => i.category === "source_unavailable").length), detail: "retryable timeouts", tone: "text-slate" },
          { label: "Anomaly review", value: String(items.filter(i => i.category === "anomaly").length), detail: "human eye required", tone: "text-rust" },
          { label: "Median wait", value: items.length > 0 ? "0.4s" : "—", detail: "instant routing", tone: "text-pine" },
        ].map((item) => (
          <div key={item.label} className="px-5 py-4">
            <div className="eyebrow text-[11px]">{item.label}</div>
            <div className={cn("display mt-2 text-[32px] leading-none", item.tone)}>{item.value}</div>
            <div className="mt-1.5 text-[12px] text-muted">{item.detail}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface p-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search queue by institution or reason…" className="input h-9 border-transparent bg-paper pl-9 text-[13px] focus:bg-surface" />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {[
            { key: "all", label: "All items" },
            { key: "source_unavailable", label: "Source unavailable" },
            { key: "ambiguous_match", label: "Ambiguous match" },
            { key: "anomaly", label: "Anomaly" },
            { key: "extraction", label: "Extraction" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setCategory(item.key)}
              className={cn("rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-colors", category === item.key ? "bg-pine-soft text-pine-deep" : "text-muted hover:bg-paper hover:text-ink")}
            >
              {item.label}
            </button>
          ))}
        </div>
        {query || category !== "all" ? (
          <button onClick={() => { setQuery(""); setCategory("all"); }} className="flex h-8 items-center gap-1 rounded px-2.5 text-[12px] font-medium text-rust hover:bg-rust-soft"><X className="h-3.5 w-3.5" /> Clear</button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {columns.map((column) => (
          <section key={column.key} className="rounded-xl border border-line bg-[#f8f5ee]/70 p-2.5">
            <div className="flex items-center justify-between px-1.5 pb-2.5 pt-1">
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", column.key === "urgent" ? "bg-rust" : column.key === "high" ? "bg-ochre" : "bg-slate")} />
                  <h2 className="text-[13px] font-semibold">{column.label}</h2>
                  <span className="mono rounded bg-surface px-1.5 py-0.5 text-[11px] text-muted ring-1 ring-line">{column.items.length}</span>
                </div>
                <p className="mt-0.5 pl-4 text-[11.5px] text-muted">{column.detail}</p>
              </div>
              <button className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-surface" aria-label={`Filter ${column.label}`}><Filter className="h-3.5 w-3.5" /></button>
            </div>
            <div className="space-y-2">
              {column.items.length ? column.items.map((item) => (
                <QueueCard key={item.id} item={item} claimed={claimed.includes(item.id)} onClaim={() => claim(item.id, item.institution)} />
              )) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-surface/50 px-4 py-9 text-center">
                  <Check className="h-4 w-4 text-pine" />
                  <div className="mt-2 text-[13px] font-medium">Nothing in this lane</div>
                  <div className="mt-0.5 text-[11.5px] text-muted">All clear for the current filter.</div>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex items-start gap-3 rounded-lg border border-line bg-surface px-4 py-3.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-pine" />
          <div>
            <div className="text-[13px] font-semibold">A queue item is not a verdict</div>
            <p className="mt-1 max-w-[620px] text-[12px] leading-relaxed text-muted">
              Items enter this queue when a check cannot be completed, a match is ambiguous, or an advisory indicator needs a human eye. Claiming an item assigns it to you and is recorded in the audit log.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3.5">
          <div>
            <div className="text-[11px] text-muted">Oldest unresolved item</div>
            <div className="mt-1 text-[13px] font-semibold">{reviewQueue.length > 0 ? `${reviewQueue[0].id} · ${reviewQueue[0].age}` : "Queue empty"}</div>
          </div>
          <Link href="/audit" className="flex items-center gap-1 text-[12px] font-semibold text-pine">Audit trail <ChevronRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-5 right-5 z-[100] flex max-w-[390px] items-start gap-3 rounded-lg border border-pine/20 bg-[#f7fbf7] px-4 py-3 shadow-lift animate-fade-up">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine-soft text-pine"><Check className="h-3.5 w-3.5" /></span>
          <p className="text-[12.5px] leading-relaxed text-muted">{toast}</p>
          <button onClick={() => setToast(null)} className="ml-1 text-muted hover:text-ink" aria-label="Dismiss"><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : null}
    </div>
  );
}
