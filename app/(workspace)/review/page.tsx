"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";
import { cn, reviewCategory } from "@/lib/display";
import type { ReviewItem } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { CURRENT_OFFICER } from "@/lib/officer/identity";

const CURRENT_OFFICER_NAME = CURRENT_OFFICER.name;

function categoryDetail(category: ReviewItem["category"]) {
  switch (category) {
    case "source_unavailable":
      return "Issuer adapter did not return a conclusive response. Retry the source before deciding.";
    case "anomaly":
      return "Advisory forensic indicator flagged for human inspection — this is not a conclusion.";
    case "ambiguous_match":
      return "Automated match is inconclusive against the configured similarity threshold.";
    case "extraction":
      return "A required field could not be extracted or matched with sufficient confidence.";
  }
}

function QueueCard({
  item,
  onClaim,
  claiming,
}: {
  item: ReviewItem;
  onClaim: () => void;
  claiming: boolean;
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
        <p className="mt-1 text-[12px] leading-relaxed text-[#656a62]">{categoryDetail(item.category)}</p>
        <div className="mt-1 text-[11px] text-muted">{item.documents} document(s) on file · {item.applicationId}</div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {item.assignee ? (
            <>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pine-soft text-[10px] font-bold text-pine">
                {item.assignee.split(" ").map((part) => part[0]).join("").slice(0, 2)}
              </span>
              <span className="truncate text-[12px] font-medium text-pine">
                {item.assignee === CURRENT_OFFICER_NAME ? "You" : item.assignee}
              </span>
            </>
          ) : (
            <>
              <span className="h-5 w-5 rounded-full border border-dashed border-line-strong" />
              <span className="text-[12px] text-muted">Unassigned</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!item.assignee ? (
            <button
              onClick={onClaim}
              disabled={claiming}
              className="flex h-6.5 items-center gap-1 rounded border border-line bg-surface px-2 text-[12px] font-semibold text-pine hover:border-pine/30 hover:bg-pine-soft/40 disabled:opacity-60"
            >
              {claiming ? <RefreshCw className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
              Claim
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
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  async function loadQueue() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/review-queue", { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Unable to load review queue");
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (err: any) {
      console.error("Failed to load review queue:", err);
      setError(err?.message || "Unable to load review queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (normalized && !`${item.institution} ${item.applicationId} ${item.reason} ${item.ruleId}`.toLowerCase().includes(normalized)) return false;
      return true;
    });
  }, [items, category, query]);

  const columns = [
    { key: "urgent", label: "Urgent", detail: "Resolve within 2 hours", items: filtered.filter((item) => item.priority === "urgent") },
    { key: "high", label: "High priority", detail: "Resolve within 1 day", items: filtered.filter((item) => item.priority === "high") },
    { key: "normal", label: "Normal", detail: "Resolve within 3 days", items: filtered.filter((item) => item.priority === "normal") },
  ];

  async function claimItem(item: ReviewItem) {
    setClaimingId(item.id);
    try {
      const res = await fetch("/api/review-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemKey: item.id, officerName: CURRENT_OFFICER_NAME }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Unable to claim item");

      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, assignee: CURRENT_OFFICER_NAME } : entry)));
      setToast(
        payload?.persisted === false
          ? `${item.institution} is assigned to you for this session. ${payload.warning || ""}`
          : `Queue item ${item.id} claimed. ${item.institution} is now assigned to you.`
      );
    } catch (err: any) {
      setToast(err?.message || "Unable to claim this item. Apply the review_claims migration to persist claims.");
    } finally {
      setClaimingId(null);
    }
  }

  async function autoAssign() {
    const unassigned = items.filter((item) => !item.assignee);
    if (unassigned.length === 0) {
      setToast("All queue items are already assigned.");
      return;
    }
    setLoading(true);
    const results = await Promise.allSettled(
      unassigned.map((item) =>
        fetch("/api/review-queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemKey: item.id, officerName: CURRENT_OFFICER_NAME }),
        }).then(async (res) => {
          if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            throw new Error(payload?.error || "Unable to claim item");
          }
          return item.id;
        })
      )
    );
    const claimed = results.filter((result) => result.status === "fulfilled").length;
    const claimedIds = new Set(
      results
        .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
        .map((result) => result.value)
    );
    setItems((current) => current.map((item) => (claimedIds.has(item.id) ? { ...item, assignee: CURRENT_OFFICER_NAME } : item)));
    setLoading(false);
    const failure = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
    setToast(
      failure
        ? `${claimed} of ${unassigned.length} items claimed. ${failure.reason?.message || "Some claims could not be persisted."}`
        : `${claimed} queue item(s) assigned to you and recorded in the audit log.`
    );
  }

  const unassignedCount = items.filter((item) => !item.assignee).length;
  const claimedCount = items.length - unassignedCount;
  const urgentCount = items.filter((item) => item.priority === "urgent").length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow={`${items.length} open · ${urgentCount} urgent · ${unassignedCount} unassigned`}
        title="Manual review queue"
        description="Items where automated checks were inconclusive, unavailable, or need a human judgment. Nothing here changes an outcome until an officer acts."
        actions={
          <>
            <button className="btn btn-secondary" onClick={loadQueue} disabled={loading}>
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
            </button>
            <button onClick={autoAssign} disabled={loading || unassignedCount === 0} className="btn btn-primary">
              <UserPlus className="h-3.5 w-3.5" /> Auto-assign ({unassignedCount})
            </button>
          </>
        }
      />

      {error ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-md border border-rust/25 bg-rust-soft px-4 py-3 text-[12.5px] text-rust">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">Could not load the review queue.</div>
            <div className="mt-0.5">{error}</div>
          </div>
        </div>
      ) : null}

      <div className="card mt-6 grid grid-cols-2 divide-x divide-y divide-line overflow-hidden lg:grid-cols-4 lg:divide-y-0">
        {[
          { label: "Unassigned", value: String(unassignedCount), detail: "awaiting officer", tone: "text-ink" },
          { label: "Source unavailable", value: String(items.filter((i) => i.category === "source_unavailable").length), detail: "retryable timeouts", tone: "text-slate" },
          { label: "Anomaly review", value: String(items.filter((i) => i.category === "anomaly").length), detail: "human eye required", tone: "text-rust" },
          { label: "Claimed", value: String(claimedCount), detail: "assigned in database", tone: "text-pine" },
        ].map((item) => (
          <div key={item.label} className="px-5 py-4">
            <div className="eyebrow text-[11px]">{item.label}</div>
            <div className={cn("display mt-2 text-[32px] leading-none", item.tone)}>{loading && !items.length ? "—" : item.value}</div>
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
              <span className="flex h-6 w-6 items-center justify-center rounded text-muted" aria-hidden="true"><Filter className="h-3.5 w-3.5" /></span>
            </div>
            <div className="space-y-2">
              {column.items.length ? column.items.map((item) => (
                <QueueCard
                  key={item.id}
                  item={item}
                  claiming={claimingId === item.id}
                  onClaim={() => claimItem(item)}
                />
              )) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-surface/50 px-4 py-9 text-center">
                  <Check className="h-4 w-4 text-pine" />
                  <div className="mt-2 text-[13px] font-medium">{loading && !items.length ? "Loading queue…" : "Nothing in this lane"}</div>
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
            <div className="mt-1 truncate text-[13px] font-semibold">{items.length > 0 ? `${items[0].id} · ${items[0].age}` : "Queue empty"}</div>
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
