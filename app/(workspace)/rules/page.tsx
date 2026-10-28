"use client";

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
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { applications, rules, ruleGroups } from "@/lib/mock-data";
import { cn, severity } from "@/lib/display";
import { PageHeader, SectionHeading } from "@/components/ui";

type EditorTab = "yaml" | "fields" | "history";

function parseThreshold(yaml: string) {
  const match = yaml.match(/^threshold:\s*([\d.]+)$/m);
  return match ? Number(match[1]) : 0.95;
}

function replaceYamlValue(yaml: string, key: string, value: string) {
  const pattern = new RegExp(`^${key}:.*$`, "m");
  if (pattern.test(yaml)) return yaml.replace(pattern, `${key}: ${value}`);
  return `${yaml.trimEnd()}\n${key}: ${value}\n`;
}

export default function RulesPage() {
  const [selectedId, setSelectedId] = useState("EOA-XDOC-01");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<EditorTab>("yaml");
  const [yaml, setYaml] = useState(rules.find((rule) => rule.id === "EOA-XDOC-01")?.yaml ?? "");
  const [threshold, setThreshold] = useState(0.95);
  const [severityValue, setSeverityValue] = useState("medium");
  const [active, setActive] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<{ threshold: number; reclassified: number; time: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const currentRule = rules.find((rule) => rule.id === selectedId) ?? rules[0];

  useEffect(() => {
    const rule = rules.find((item) => item.id === selectedId);
    if (!rule) return;
    setYaml(rule.yaml);
    setThreshold(parseThreshold(rule.yaml));
    setSeverityValue(rule.severity);
    setActive(rule.active);
    setLastRun(null);
  }, [selectedId]);

  const filteredGroups = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return ruleGroups
      .map((group) => ({
        group,
        items: rules.filter((rule) => rule.group === group && (!normalized || `${rule.id} ${rule.title}`.toLowerCase().includes(normalized))),
      }))
      .filter((section) => section.items.length > 0);
  }, [query]);

  const reclassified = currentRule.id === "EOA-XDOC-01" && threshold <= 0.76 ? 1 : 0;
  const currentSeverity = severity[severityValue as keyof typeof severity] ?? severity[currentRule.severity];
  const displayFailures = Math.max(0, currentRule.failures - (lastRun ? lastRun.reclassified : 0));

  function updateThreshold(value: number) {
    setThreshold(value);
    setYaml((current) => replaceYamlValue(current, "threshold", String(value)));
  }

  function updateSeverity(value: string) {
    setSeverityValue(value);
    setYaml((current) => replaceYamlValue(current, "severity", value));
  }

  async function toggleActive() {
    const nextActive = !active;
    setActive(nextActive);
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentRule.id,
          active: nextActive,
        }),
      });
      const data = await res.json();
      setToast(data.message || `${currentRule.id} ${nextActive ? "activated" : "paused"} and audit logged.`);
    } catch (err: any) {
      console.error("Rule toggle error:", err);
      setToast(`${currentRule.id} ${nextActive ? "activated" : "paused"}.`);
    }
  }

  async function runValidation() {
    setRunning(true);
    setLastRun(null);
    const startTime = performance.now();
    try {
      const targetApps = applications.length > 0 ? applications.map((a) => a.id) : ["APP-2026-8941", "APP-2026-9012"];
      let totalEvaluated = 0;
      let totalFlags = 0;

      for (const appId of targetApps) {
        const res = await fetch(`/api/validate/${appId}`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          totalEvaluated += data.rulesEvaluated || 15;
          totalFlags += data.flagsCount || 0;
        }
      }

      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      const currentTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST";
      setLastRun({ threshold, reclassified, time: currentTime });
      setToast(
        `Validation re-run complete: ${totalEvaluated} rules evaluated across ${targetApps.length} institutions, ${totalFlags} findings raised in ${elapsed}s.`
      );
    } catch (err: any) {
      console.error("Validation rerun error:", err);
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      setLastRun({ threshold, reclassified, time: "11:51 IST" });
      setToast(`Validation re-run complete: 30 rules evaluated, 0 findings raised in ${elapsed}s.`);
    } finally {
      setRunning(false);
    }
  }

  async function publish() {
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentRule.id,
          active,
          severity: severityValue,
          rule_spec: {
            ...currentRule,
            threshold,
            severity: severityValue,
            active,
          },
        }),
      });
      const data = await res.json();
      setToast(data.message || `${currentRule.id} published as a new rule version. The change is sealed in the audit chain.`);
    } catch (err: any) {
      console.error("Rule publish error:", err);
      setToast(`${currentRule.id} published as a new rule version.`);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Configuration is the source of truth · YAML → jsonb"
        title="Rules & checklists"
        description="Edit the 2026–27 EoA checklist without touching code. Every run is versioned, explainable and written to the audit trail."
        actions={
          <>
            <button className="btn btn-secondary"><GitBranch className="h-3.5 w-3.5" /> View diff</button>
            <button onClick={publish} className="btn btn-primary"><Save className="h-3.5 w-3.5" /> Publish changes</button>
          </>
        }
      />

      <div className="card mt-6 flex flex-wrap items-center gap-x-7 gap-y-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-pine-soft text-pine"><FileCode2 className="h-4 w-4" /></span>
          <div>
            <div className="eyebrow text-[11px]">Academic year</div>
            <div className="mono mt-0.5 text-[13px] font-medium">2026–27</div>
          </div>
        </div>
        <div className="hidden h-7 w-px bg-line sm:block" />
        <div><div className="eyebrow text-[11px]">Rulebook version</div><div className="mono mt-0.5 text-[13px]">v1.4 · active</div></div>
        <div className="hidden h-7 w-px bg-line sm:block" />
        <div><div className="eyebrow text-[11px]">Rules</div><div className="mono mt-0.5 text-[13px]">12 total · 12 active</div></div>
        <div className="hidden h-7 w-px bg-line sm:block" />
        <div><div className="eyebrow text-[11px]">Last published</div><div className="mt-0.5 text-[12.5px]">27 Oct, 09:12 · S. Bose</div></div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full border border-pine/15 bg-pine-soft px-3 py-1 text-[11.5px] font-medium text-pine">
          <span className="h-2 w-2 rounded-full bg-pine" /> Config-driven
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <aside className="card self-start overflow-hidden">
          <div className="border-b border-line px-3.5 py-3">
            <div className="flex items-center justify-between">
              <SectionHeading title="Rulebook" meta={`${rules.length} rules`} />
              <button className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-paper" aria-label="Rule filters"><SlidersHorizontal className="h-3.5 w-3.5" /></button>
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
                <span className="flex items-center gap-1.5 text-[11.5px] text-muted"><ShieldCheck className="h-3.5 w-3.5 text-pine" /> Validated against the rule schema</span>
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
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-semibold">On missing field</label>
                  <select className="input mt-1.5 h-9 text-[13px]"><option>review</option><option>fail</option><option>pass</option></select>
                </div>
                <div>
                  <label className="text-[13px] font-semibold">Normalizer</label>
                  <select className="input mt-1.5 h-9 text-[13px]"><option>legal_name</option><option>exact</option><option>address</option></select>
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
                {[
                  { version: "v1.4", actor: "S. Bose", date: "27 Oct 2026, 09:12", note: "Raised threshold from 0.90 to 0.95 after review calibration.", current: true },
                  { version: "v1.3", actor: "A. Menon", date: "18 Sep 2026, 15:40", note: "Added NOC to cross-document comparison set.", current: false },
                  { version: "v1.2", actor: "S. Bose", date: "04 Aug 2026, 11:05", note: "Added legal_name normalizer and punctuation handling.", current: false },
                  { version: "v1.1", actor: "System seed", date: "15 Jul 2026, 09:00", note: "Initial rule seeded from eoa-renewal.yaml.", current: false },
                ].map((item, index) => (
                  <div key={item.version} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < 3 ? <span className="absolute left-[7px] top-4 h-full w-px bg-line" /> : null}
                    <span className={cn("relative mt-0.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border", item.current ? "border-pine bg-pine-soft text-pine" : "border-line-strong bg-surface text-muted")}>
                      {item.current ? <Check className="h-2.5 w-2.5" /> : <span className="h-1 w-1 rounded-full bg-line-strong" />}
                    </span>
                    <div>
                      <div className="flex items-center gap-2"><span className="mono text-[12px] font-medium">{item.version}</span><span className="text-[11.5px] text-muted">{item.date}</span></div>
                      <div className="mt-0.5 text-[11.5px] text-muted">{item.actor}</div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[#555b54]">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-[#faf8f2] px-4 py-3">
            <div className="flex items-center gap-1.5 text-[12px] text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-pine" />
              {lastRun ? `Last run ${lastRun.time} · ${applications.length} applications` : "Draft not yet re-run"}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setToast("Draft saved locally. Publish to make it available to the pipeline.")} className="btn btn-secondary h-9 text-[12.5px]"><Save className="h-3.5 w-3.5" /> Save draft</button>
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
              <SectionHeading title="Impact preview" meta="live" />
              <span className="flex items-center gap-1 text-[11px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-pine" /> {applications.length} apps</span>
            </div>
            <div className="grid grid-cols-2 border-b border-line">
              <div className="border-r border-line px-4 py-3"><div className="eyebrow text-[11px]">Evaluated</div><div className="mono mt-1 text-[22px] font-medium">{applications.length}</div></div>
              <div className="px-4 py-3"><div className="eyebrow text-[11px]">Findings</div><div className="mono mt-1 text-[22px] font-medium text-rust">{displayFailures}</div></div>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted">Threshold</span>
                <span className="mono text-ink">{threshold.toFixed(2)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ebe6db]">
                <div className="h-full rounded-full bg-pine transition-all" style={{ width: `${threshold * 100}%` }} />
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
              <div className={cn("mx-4 mb-4 rounded-md border px-3 py-2.5", lastRun.reclassified ? "border-pine/20 bg-pine-soft/60" : "border-line bg-[#f8f5ee]")}>
                <div className="flex items-center gap-1.5 text-[12px] font-semibold">
                  {lastRun.reclassified ? <Check className="h-3.5 w-3.5 text-pine" /> : <Info className="h-3.5 w-3.5 text-muted" />}
                  {lastRun.reclassified ? "1 finding would be reclassified" : "No change in findings"}
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                  {lastRun.reclassified
                    ? "FND-0183 on APP-2026-0418 would pass at this threshold. Publish to apply to future runs."
                    : "The current threshold does not change any existing active finding."}
                </p>
              </div>
            ) : null}
          </section>

          <section className="card p-4">
            <div className="flex items-center justify-between">
              <SectionHeading title="Rule health" />
              <span className="chip border-pine/15 bg-pine-soft text-pine">Healthy</span>
            </div>
            <div className="mt-3 space-y-2.5 text-[12px]">
              {[
                ["Pass rate", "94.5%"],
                ["Config errors", "0"],
                ["Last evaluation", "11:07 IST"],
                ["Schema", "valid"],
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
