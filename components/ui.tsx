import type { ReactNode } from "react";
import { cn, riskLevel } from "@/lib/display";
import type { RiskLevel } from "@/lib/types";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-[680px]">
        {eyebrow ? <div className="eyebrow mb-2">{eyebrow}</div> : null}
        <h1 className="display text-[36px] leading-[0.98] text-ink sm:text-[42px]">{title}</h1>
        {description ? <p className="mt-2.5 max-w-[620px] text-[13.5px] leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionHeading({
  title,
  action,
  meta,
}: {
  title: string;
  action?: ReactNode;
  meta?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        {meta ? <span className="mono text-[11px] text-muted">{meta}</span> : null}
      </div>
      {action}
    </div>
  );
}

export function RiskChip({ level, className }: { level: RiskLevel; className?: string }) {
  const item = riskLevel[level];
  return (
    <span className={cn("chip border", item.className, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", item.dot)} />
      {item.label}
    </span>
  );
}

export function ConfidenceMeter({
  value,
  tone = "pine",
  className,
  showValue = true,
}: {
  value: number;
  tone?: "pine" | "ochre" | "rust" | "slate";
  className?: string;
  showValue?: boolean;
}) {
  const colors = {
    pine: "bg-pine",
    ochre: "bg-ochre",
    rust: "bg-rust",
    slate: "bg-slate",
  };
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1 w-full overflow-hidden rounded-full bg-[#e8e3d8]">
        <div className={cn("h-full rounded-full", colors[tone])} style={{ width: `${Math.max(4, Math.round(value * 100))}%` }} />
      </div>
      {showValue ? <span className="mono w-8 shrink-0 text-right text-[11px] text-muted">{Math.round(value * 100)}%</span> : null}
    </div>
  );
}

export function Sparkline({ values, tone = "#1c5444" }: { values: number[]; tone?: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 28 - ((value - min) / Math.max(1, max - min)) * 24;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-[82px]" aria-hidden="true">
      <polyline points={points} fill="none" stroke={tone} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <circle cx="100" cy={Number(points.split(" ").at(-1)?.split(",")[1] ?? 0)} r="1.6" fill={tone} />
    </svg>
  );
}

export function MonoTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("mono rounded border border-line bg-[#f5f2e9] px-2 py-0.5 text-[11px] text-muted", className)}>{children}</span>
  );
}

export function EmptyState({ title, description, icon }: { title: string; description: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon ? <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-muted">{icon}</div> : null}
      <div className="text-[14px] font-semibold text-ink">{title}</div>
      <p className="mt-1 max-w-[340px] text-[12px] leading-relaxed text-muted">{description}</p>
    </div>
  );
}

export function Divider() {
  return <div className="h-px w-full bg-line" />;
}
