"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  CircleAlert,
  Code2,
  FileCode2,
  GitBranch,
  History,
  Info,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn, severity } from "@/lib/display";
import { PageHeader, SectionHeading } from "@/components/ui";
import { parse as parseYaml } from "yaml";
import type { Application, RuleRecord } from "@/lib/types";

type EditorTab = "yaml" | "fields" | "history";

function specFromYaml(yaml: string): Record<string, unknown> {
  try {
    const parsed = parseYaml(yaml);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function parseThreshold(yaml: string) {
  const match = yaml.match(/^threshold:\s*([\d.]+)$/m);
  if (match) return Number(match[1]);
  const spec = specFromYaml(yaml);
  const value = Number(spec.threshold);
  return Number.isFinite(value) && value > 0 ? value : 0.95;
}

function replaceYamlValue(yaml: string, key: string, value: string) {
  const pattern = new RegExp(`^${key}:.*$`, "m");
  if (pattern.test(yaml)) return yaml.replace(pattern, `${key}: ${value}`);
  return `${yaml.trimEnd()}\n${key}: ${value}\n`;
}

function formatStamp(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export default function RulesPage() {
  const [rules, setRules] = useState<RuleRecord[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<EditorTab>("yaml");
  const [yaml, setYaml] = useState("");
  const [threshold, setThreshold] = useState(0.95);
  const [severityValue, setSeverityValue] = useState("medium");
  const [onMissing, setOnMissing] = useState("review");
  const [normalizer, setNormalizer] = useState("legal_name");
  const [active, setActive] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<{ evaluated: number; findings: number; apps: number; time: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadRules(showSpinner = true) {
    if (showSpinner) setLoading(true);
    setLoadError(null);
    try {
      const [rulesRes, appsRes] = await Promise.all([
        fetch("/api/rules", { cache: "no-store" }),
        fetch("/api/applications", { cache: "no-store" }),
      ]);

      const rulesPayload = await rulesRes.json();
      if (!rulesRes.ok) throw new Error(rulesPayload?.error || "Unable to load the rulebook");
      const loadedRules: RuleRecord[] = Array.isArray(rulesPayload.rules) ? rulesPayload.rules : [];

      const appsPayload = await appsRes.json().catch(() => ({ applications: [] }));
      const loadedApps: Application[] = Array.isArray(appsPayload.applications) ? appsPayload.applications : [];

      setRules(loadedRules);
      setApplications(loadedApps);
      setSelectedId((current) => {
        if (current && loadedRules.some((rule) => rule.id === current)) return current;
        return loadedRules[0]?.id ?? "";
      });
    } catch (err: any) {
      console.error("Failed to load rulebook:", err);
      setLoadError(err?.message || "Unable to load the rulebook");
      setRules([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  const currentRule = rules.find((rule) => rule.id === selectedId) ?? rules[0] ?? null;

  useEffect(() => {
    if (!currentRule) {
      setYaml("");
      return;
    }
    const spec = specFromYaml(currentRule.yaml);
    setYaml(currentRule.yaml);
    setThreshold(parseThreshold(currentRule.yaml));
    setSeverityValue(String(spec.severity ?? currentRule.severity));
    setOnMissing(String(spec.on_missing ?? "review"));
    setNormalizer(String(spec.normalizer ?? "legal_name"));
    setActive(currentRule.active);
    setLastRun(null);
    // Re-sync the editor whenever the selected rule or its stored definition changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, currentRule?.yaml]);

  const groups = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const rule of rules) {
      if (!seen.has(rule.group)) {
        seen.add(rule.group);
        ordered.push(rule.group);
      }
    }
    return ordered;
  }, [rules]);

  const filteredGroups = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return groups
      .map((group) => ({
        group,
        items: rules.filter(
          (rule) => rule.group === group && (!normalized || `${rule.id} ${rule.title}`.toLowerCase().includes(normalized))
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [groups, rules, query]);

  const rulebookVersion = useMemo(() => {
    const versions = rules.map((rule) => rule.version).filter(Boolean);
    if (versions.length === 0) return "—";
    return versions.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).at(-1) ?? "—";
  }, [rules]);

  const lastPublished = useMemo(() => {
    const stamps = rules.map((rule) => rule.updatedAt).filter(Boolean) as string[];
    if (stamps.length === 0) return null;
    return stamps.sort().at(-1) ?? null;
  }, [rules]);

  const health = useMemo(() => {
    const evaluations = rules.reduce((sum, rule) => sum + rule.evaluations, 0);
    const failures = rules.reduce((sum, rule) => sum + rule.failures, 0);
    const configErrors = rules.filter((rule) => Object.keys(specFromYaml(rule.yaml)).length === 0).length;
    return {
      evaluations,
      failures,
      configErrors,
      passRate: evaluations > 0 ? `${(((evaluations - failures) / evaluations) * 100).toFixed(1)}%` : "—",
    };
  }, [rules]);

  const currentSeverity = severity[severityValue as keyof typeof severity] ?? (currentRule ? severity[currentRule.severity] : severity.medium);

  function updateThreshold(value: number) {
    setThreshold(value);
    setYaml((current) => replaceYamlValue(current, "threshold", String(value)));
  }

  function updateSeverity(value: string) {
    setSeverityValue(value);
    setYaml((current) => replaceYamlValue(current, "severity", value));
  }

  function updateOnMissing(value: string) {
    setOnMissing(value);
    setYaml((current) => replaceYamlValue(current, "on_missing", value));
  }

  function updateNormalizer(value: string) {
    setNormalizer(value);
    setYaml((current) => replaceYamlValue(current, "normalizer", value));
  }

  function viewDiff() {
    if (!currentRule) return;
    if (yaml === currentRule.yaml) {
      setToast(`${currentRule.id}: no unpublished changes against the stored rule.`);
      return;
    }
    const before = currentRule.yaml.split("\n");
    const after = yaml.split("\n");
    const changed = after.filter((line, index) => line !== before[index]).length + Math.abs(after.length - before.length);
    setToast(`${currentRule.id}: ${changed} line(s) differ from the stored rule. Publish to commit the change.`);
  }

  async function toggleActive() {
    if (!currentRule) return;
    const nextActive = !active;
    setActive(nextActive);
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentRule.id, active: nextActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Rule toggle failed");
      setToast(data.message || `${currentRule.id} ${nextActive ? "activated" : "paused"} and audit logged.`);
      await loadRules(false);
    } catch (err: any) {
      console.error("Rule toggle error:", err);
      setActive(!nextActive);
      setToast(`Could not update ${currentRule.id}: ${err?.message || "request failed"}.`);
    }
  }

  async function runValidation() {
    if (!currentRule) return;
    if (applications.length === 0) {
      setToast("No applications are registered yet, so there is nothing to re-validate.");
      return;
    }
    setRunning(true);
    setLastRun(null);
    const startTime = performance.now();
    try {
      let totalEvaluated = 0;
      let totalFlags = 0;
      let completed = 0;
      const failures: string[] = [];

      for (const app of applications) {
        const res = await fetch(`/api/validate/${app.id}`, { method: "POST" });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          failures.push(`${app.id}: ${payload?.error || `HTTP ${res.status}`}`);
          continue;
        }
        const data = await res.json();
        totalEvaluated += Number(data.rulesEvaluated ?? 0);
        totalFlags += Number(data.flagsCount ?? 0);
        completed += 1;
      }

      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      const currentTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST";
      if (completed > 0) {
        setLastRun({ evaluated: totalEvaluated, findings: totalFlags, apps: completed, time: currentTime });
      }
      setToast(
        completed > 0
          ? `Validation re-run complete: ${totalEvaluated} rule evaluations across ${completed}/${applications.length} applications, ${totalFlags} findings raised in ${elapsed}s.${failures.length ? ` ${failures.length} application(s) failed.` : ""}`
          : `Validation re-run failed for all ${applications.length} applications. ${failures[0] || ""}`
      );
      await loadRules(false);
    } catch (err: any) {
      console.error("Validation rerun error:", err);
      setToast(`Validation re-run failed: ${err?.message || "request error"}. No findings were changed.`);
    } finally {
      setRunning(false);
    }
  }

  async function publish() {
    if (!currentRule) return;
    let spec: Record<string, unknown>;
    try {
      const parsed = parseYaml(yaml);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setToast(`Cannot publish ${currentRule.id}: the YAML must define a rule object.`);
        return;
      }
      spec = parsed as Record<string, unknown>;
    } catch (err: any) {
      setToast(`Cannot publish ${currentRule.id}: invalid YAML — ${err?.message || "parse error"}.`);
      return;
    }

    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentRule.id,
          active,
          severity: severityValue,
          rule_spec: {
            ...spec,
            id: currentRule.id,
            threshold,
            severity: severityValue,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Rule publish failed");
      setToast(data.message || `${currentRule.id} published. The change is sealed in the audit chain.`);
      await loadRules(false);
    } catch (err: any) {
      console.error("Rule publish error:", err);
      setToast(`Could not publish ${currentRule.id}: ${err?.message || "request failed"}.`);
    }
  }

  if (loading && rules.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          eyebrow="Configuration is the source of truth · YAML → jsonb"
          title="Rules & checklists"
          description="Edit the 2026–27 EoA checklist without touching code. Every run is versioned, explainable and written to the audit trail."
        />
        <div className="card mt-6 flex flex-col items-center justify-center px-6 py-20 text-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted" />
          <div className="mt-3 text-[14px] font-semibold text-ink">Loading the live rulebook…</div>
          <p className="mt-1 text-[12px] text-muted">Reading rules, versions and application counts from the database.</p>
        </div>
      </div>
    );
  }

  if (!currentRule) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          eyebrow="Configuration is the source of truth · YAML → jsonb"
          title="Rules & checklists"
          description="Edit the 2026–27 EoA checklist without touching code. Every run is versioned, explainable and written to the audit trail."
          actions={
            <button onClick={() => loadRules()} className="btn btn-secondary">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          }
        />
        <div className="card mt-6 flex flex-col items-center justify-center px-6 py-20 text-center">
          <CircleAlert className="h-7 w-7 text-rust" />
          <div className="mt-3 text-[14px] font-semibold text-ink">
            {loadError ? "Could not load the rulebook" : "No rules are seeded"}
          </div>
          <p className="mt-1 max-w-md text-[12px] text-muted">
            {loadError || "Seed the rules table (supabase/seed or 01_init.sql) to make the checklist editable here."}
          </p>
          <button onClick={() => loadRules()} className="btn btn-secondary mt-4">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Configuration is the source of truth · YAML → jsonb"
        title="Rules & checklists"
        description="Edit the 2026–27 EoA checklist without touching code. Every run is versioned, explainable and written to the audit trail."
        actions={
          <>
            <button onClick={viewDiff} className="btn btn-secondary"><GitBranch className="h-3.5 w-3.5" /> View diff</button>
            <button onClick={() => loadRules()} disabled={loading} className="btn btn-secondary"><RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh</button>
            <button onClick={publish} className="btn btn-primary"><Save className="h-3.5 w-3.5" /> Publish changes</button>
          </>
        }
      />

      {loadError ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-md border border-rust/25 bg-rust-soft px-4 py-3 text-[12.5px] text-rust">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">Could not refresh the rulebook.</div>
            <div className="mt-0.5">{loadError}</div>
          </div>
        </div>
      ) : null}

      <div className="card mt-6 flex flex-wrap items-center gap-x-7 gap-y-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-pine-soft text-pine"><FileCode2 className="h-4 w-4" /></span>
          <div>
            <div className="eyebrow text-[11px]">Academic year</div>
            <div className="mono mt-0.5 text-[13px] font-medium">2026–27</div>
          </div>
        </div>
        <div className="hidden h-7 w-px bg-line sm:block" />
        <div><div className="eyebrow text-[11px]">Rulebook version</div><div className="mono mt-0.5 text-[13px]">v{rulebookVersion} · live</div></div>
        <div className="hidden h-7 w-px bg-line sm:block" />
        <div><div className="eyebrow text-[11px]">Rules</div><div className="mono mt-0.5 text-[13px]">{rules.length} total · {rules.filter((rule) => rule.active).length} active</div></div>
        <div className="hidden h-7 w-px bg-line sm:block" />
        <div><div className="eyebrow text-[11px]">Last published</div><div className="mt-0.5 text-[12.5px]">{formatStamp(lastPublished)}</div></div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full border border-pine/15 bg-pine-soft px-3 py-1 text-[11.5px] font-medium text-pine">
          <span className="h-2 w-2 rounded-full bg-pine" /> DB-backed
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <aside className="card self-start overflow-hidden">
          <div className="border-b border-line px-3.5 py-3">
            <div className="flex items-center justify-between">
              <SectionHeading title="Rulebook" meta={`${rules.length} rules`} />
              <span className="flex h-6 w-6 items-center justify-center rounded text-muted" aria-hidden="true"><SlidersHorizontal className="h-3.5 w-3.5" /></span>
            </div>
            <div className="relative mt-2.5">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a rule…" className="input h-9 border-line bg-paper pl-8 text-[13px]" />
            </div>
          </div>
          <div className="max-h-[610px] overflow-y-auto thin-scroll">
            {filteredGroups.map((section) => (
              <div key={section.group}>
                <div className="flex items-center gap-2 bg-[#f8f5ee] px-3.5 py-2">
                  <span className="eyebrow text-[11px]">{section.group}</span>
                  <span className="mono text-[11px] text-muted">{section.items.length}</span>
                  <span className="ml-auto h-px flex-1 bg-line" />
                </div>
                {section.items.map((rule) => {
                  const selected = selectedId === rule.id;
                  return (
                    <button
                      key={rule.id}
                      onClick={() => setSelectedId(rule.id)}
                      className={cn(
                        "group flex w-full items-start gap-2.5 border-b border-line/70 px-3.5 py-2.5 text-left transition-colors last:border-b-0",
                        selected ? "bg-pine-soft/45" : "hover:bg-paper",
                      )}
                    >
                      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", rule.active ? (rule.failures > 4 ? "bg-rust" : "bg-pine") : "bg-line-strong")} />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-[13px] font-medium", selected ? "text-pine-deep" : "text-ink")}>{rule.title}</span>
                        <span className="mono mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted">
                          {rule.id} <span className="text-line-strong">·</span> {rule.failures} findings
                        </span>
                      </span>
                      <ChevronRight className={cn("mt-1 h-3.5 w-3.5 shrink-0 text-line-strong", selected && "text-pine")} />
                    </button>
                  );
                })}
              </div>
            ))}
            {filteredGroups.length === 0 ? (
              <div className="px-4 py-10 text-center text-[12px] text-muted">No rules match “{query}”.</div>
            ) : null}
          </div>
          <div className="border-t border-line bg-[#faf8f2] px-3.5 py-2.5 text-[11.5px] text-muted">
            <span className="flex items-center gap-1.5"><Info className="h-3 w-3" /> YAML files seed the database.</span>
          </div>
        </aside>

        <section className="card min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3.5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono text-[12px] text-muted">{currentRule.id}</span>
                <span className="rounded border border-line bg-paper px-1.5 py-0.5 text-[11px] text-muted">v{currentRule.version}</span>
                <span className={cn("chip border", currentSeverity.className)}><span className={cn("h-1.5 w-1.5 rounded-full", currentSeverity.dot)} />{currentSeverity.label}</span>
                {lastRun ? <span className="chip border-pine/15 bg-pine-soft text-pine"><Check className="h-3 w-3" /> Run complete</span> : null}
              </div>
              <h2 className="mt-1.5 text-[15px] font-semibold">{currentRule.title}</h2>
              <p className="mt-0.5 text-[12px] text-muted">{currentRule.type.replaceAll("_", " ")} · {currentRule.group} · {currentRule.evaluations} evaluations</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted">{active ? "Active" : "Paused"}</span>
              <button
                onClick={toggleActive}
                className={cn("relative h-[20px] w-[36px] rounded-full transition-colors", active ? "bg-pine" : "bg-line-strong")}
                aria-label="Toggle rule"
              >
                <span className={cn("absolute top-[2px] h-[16px] w-[16px] rounded-full bg-surface shadow-sm transition-transform", active ? "left-[18px]" : "left-[2px]")} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-line bg-[#faf8f2] px-3">
            <div className="flex items-center gap-0.5">
              {[
                { key: "yaml", label: "YAML", icon: Code2 },
                { key: "fields", label: "Fields", icon: SlidersHorizontal },
                { key: "history", label: "History", icon: History },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.key} onClick={() => setTab(item.key as EditorTab)} className={cn("relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium", tab === item.key ? "text-pine-deep" : "text-muted hover:text-ink")}>
                    <Icon className="h-3.5 w-3.5" /> {item.label}
                    {tab === item.key ? <span className="absolute inset-x-2 bottom-0 h-[2px] bg-pine" /> : null}
                  </button>
                );
              })}
            </div>
            <span className="mono hidden text-[11px] text-muted sm:block">rules/2026-27/eoa-renewal.yaml</span>
          </div>

          {tab === "yaml" ? (
            <div className="bg-[#f8f5ee] p-3">
              <div className="overflow-hidden rounded-md border border-line-strong bg-[#fcfaf4]">
                <div className="flex items-center justify-between border-b border-line bg-[#f3efe5] px-3 py-1.5">
                  <span className="mono text-[11px] uppercase tracking-[0.12em] text-muted">YAML · editable</span>
                  <span className="mono text-[11px] text-muted">{yaml.split("\n").length} lines</span>
                </div>
                <div className="flex max-h-[420px] overflow-auto font-mono text-[12.5px] leading-[1.8]">
                  <div className="select-none border-r border-line bg-[#f5f1e8] px-2.5 py-3 text-right text-[11px] text-[#b0aa9c]">
                    {yaml.split("\n").map((_, index) => <div key={index}>{index + 1}</div>)}
                  </div>
                  <textarea
                    value={yaml}
                    onChange={(event) => setYaml(event.target.value)}
                    spellCheck={false}
                    className="min-h-[390px] flex-1 resize-none bg-transparent px-3 py-3 font-mono text-[12.5px] leading-[1.8] text-[#2d3b33] outline-none"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between px-0.5">
                <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
                  <ShieldCheck className={cn("h-3.5 w-3.5", yaml === currentRule.yaml ? "text-pine" : "text-ochre")} />
                  {yaml === currentRule.yaml ? "Matches the stored rule" : "Unpublished draft — publish to persist"}
                </span>
                <button onClick={() => setYaml(currentRule.yaml)} className="flex items-center gap-1 text-[11.5px] font-medium text-muted hover:text-ink"><RotateCcw className="h-3 w-3" /> Reset</button>
              </div>
            </div>
          ) : tab === "fields" ? (
            <div className="space-y-5 px-4 py-5">
              <div>
                <label className="text-[13px] font-semibold">Similarity threshold</label>
                <p className="mt-0.5 text-[12px] text-muted">Minimum normalized similarity for a cross-document match to pass.</p>
                <div className="mt-3 flex items-center gap-3">
                  <input type="range" min="0.5" max="1" step="0.01" value={threshold} onChange={(event) => updateThreshold(Number(event.target.value))} className="h-1.5 flex-1 cursor-pointer accent-[#1c5444]" />
                  <span className="mono w-14 rounded border border-line bg-paper px-2 py-1 text-center text-[12px]">{threshold.toFixed(2)}</span>
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-muted"><span>0.50 permissive</span><span>1.00 exact</span></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[13px] font-semibold">Severity</label>
                  <select value={severityValue} onChange={(event) => updateSeverity(event.target.value)} className="input mt-1.5 h-9 text-[13px]">
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="info">Info</option>
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-semibold">On missing field</label>
                  <select value={onMissing} onChange={(event) => updateOnMissing(event.target.value)} className="input mt-1.5 h-9 text-[13px]">
                    <option value="review">review</option>
                    <option value="fail">fail</option>
                    <option value="pass">pass</option>
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-semibold">Normalizer</label>
                  <select value={normalizer} onChange={(event) => updateNormalizer(event.target.value)} className="input mt-1.5 h-9 text-[13px]">
                    <option value="legal_name">legal_name</option>
                    <option value="exact">exact</option>
                    <option value="address">address</option>
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-semibold">Rule version</label>
                  <input className="input mt-1.5 h-9 font-mono text-[13px]" value={currentRule.version} readOnly />
                </div>
              </div>
              <div className="rounded-md border border-line bg-[#f8f5ee] px-3 py-2.5 text-[12px] leading-relaxed text-muted">
                Changes are written to the draft YAML. Re-run validation to preview the effect before publishing.
              </div>
            </div>
          ) : (
            <div className="px-4 py-4">
              <div className="space-y-0">
                <div className="relative flex gap-3 pb-5">
                  <span className="relative mt-0.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border border-pine bg-pine-soft text-pine">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="mono text-[12px] font-medium">v{currentRule.version}</span>
                      <span className="text-[11.5px] text-muted">{formatStamp(currentRule.updatedAt)}</span>
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-muted">Current stored record</div>
                    <p className="mt-1 text-[12px] leading-relaxed text-[#555b54]">
                      {currentRule.active ? "Active" : "Paused"} · {currentRule.evaluations} evaluations · {currentRule.failures} findings · severity {currentRule.severity}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-line bg-[#f8f5ee] px-3 py-2.5 text-[12px] leading-relaxed text-muted">
                The rules table stores the current definition only. Every publish is appended to the hash-chained audit log —{" "}
                <Link href="/audit" className="font-semibold text-pine hover:underline">open the audit trail</Link> to see the change history.
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-[#faf8f2] px-4 py-3">
            <div className="flex items-center gap-1.5 text-[12px] text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-pine" />
              {lastRun
                ? `Last run ${lastRun.time} · ${lastRun.apps} applications · ${lastRun.findings} findings`
                : `Stored rule · ${applications.length} applications available`}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setToast("Draft kept locally in this editor. Publish to persist it to the database.")} className="btn btn-secondary h-9 text-[12.5px]"><Save className="h-3.5 w-3.5" /> Save draft</button>
              <button onClick={runValidation} disabled={running} className="btn btn-primary h-9 min-w-[145px] text-[12.5px]">
                {running ? <RotateCcw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                {running ? "Running validation…" : "Re-run validation"}
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4 self-start">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <SectionHeading title="Impact preview" meta="live data" />
              <span className="flex items-center gap-1 text-[11px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-pine" /> {applications.length} apps</span>
            </div>
            <div className="grid grid-cols-2 border-b border-line">
              <div className="border-r border-line px-4 py-3"><div className="eyebrow text-[11px]">Evaluated</div><div className="mono mt-1 text-[22px] font-medium">{applications.length}</div></div>
              <div className="px-4 py-3"><div className="eyebrow text-[11px]">Rule findings</div><div className="mono mt-1 text-[22px] font-medium text-rust">{currentRule.failures}</div></div>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted">Threshold</span>
                <span className="mono text-ink">{threshold.toFixed(2)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ebe6db]">
                <div className="h-full rounded-full bg-pine transition-all" style={{ width: `${Math.min(Math.max(threshold, 0), 1) * 100}%` }} />
              </div>
              <div className="mt-3 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Affected applications</div>
                {applications.length === 0 ? (
                  <div className="py-2 text-[12px] text-muted italic">No applications available for impact preview.</div>
                ) : (
                  applications.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[12px] text-ink">{item.institution}</span>
                      <span className={cn("mono text-[11.5px]", item.risk === "high" ? "text-ochre" : "text-pine")}>{item.findings} findings</span>
                      <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", item.risk === "high" ? "bg-ochre-soft text-ochre" : "bg-pine-soft text-pine")}>{item.risk}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            {lastRun ? (
              <div className="mx-4 mb-4 rounded-md border border-pine/20 bg-pine-soft/60 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold">
                  <Check className="h-3.5 w-3.5 text-pine" /> Last run applied to the database
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                  {lastRun.evaluated} rule evaluations across {lastRun.apps} applications produced {lastRun.findings} findings at {lastRun.time}.
                </p>
              </div>
            ) : null}
          </section>

          <section className="card p-4">
            <div className="flex items-center justify-between">
              <SectionHeading title="Rule health" />
              <span className={cn("chip border", health.configErrors === 0 && rules.length > 0 ? "border-pine/15 bg-pine-soft text-pine" : "border-ochre/20 bg-ochre-soft text-ochre")}>
                {health.configErrors === 0 && rules.length > 0 ? "Healthy" : "Needs attention"}
              </span>
            </div>
            <div className="mt-3 space-y-2.5 text-[12px]">
              {[
                ["Pass rate", health.passRate],
                ["Config errors", String(health.configErrors)],
                ["Rulebook updated", formatStamp(lastPublished)],
                ["Schema", health.configErrors === 0 ? "valid" : "invalid"],
              ].map(([key, value]) => (
                <div key={key} className="flex items-center justify-between"><span className="text-muted">{key}</span><span className="mono text-ink">{value}</span></div>
              ))}
            </div>
          </section>

          <div className="rounded-lg border border-[#e4d5b7] bg-[#f9f0de] p-4">
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#735523]"><CircleAlert className="h-3.5 w-3.5" /> Human review stays</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b542d]">
              A threshold change can reduce noise, but it never clears a finding automatically. Officers still decide.
            </p>
          </div>
        </aside>
      </div>

      {toast ? (
        <div className="fixed bottom-5 right-5 z-[100] flex max-w-[420px] items-start gap-3 rounded-lg border border-pine/20 bg-[#f7fbf7] px-4 py-3 shadow-lift animate-fade-up">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine-soft text-pine"><Check className="h-3.5 w-3.5" /></span>
          <p className="text-[12.5px] leading-relaxed text-muted">{toast}</p>
          <button onClick={() => setToast(null)} className="ml-1 text-muted hover:text-ink" aria-label="Dismiss"><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : null}
    </div>
  );
}
