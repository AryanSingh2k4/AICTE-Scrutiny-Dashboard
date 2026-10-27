import type {
  ApplicationStatus,
  DocumentStatus,
  FindingSeverity,
  RiskLevel,
  VerificationStatus,
} from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const applicationStatus: Record<string, { label: string; className: string; dot: string }> = {
  processing: { label: "Processing", className: "bg-slate-soft text-slate border-slate/15", dot: "bg-slate" },
  findings_ready: { label: "Findings ready", className: "bg-ochre-soft text-ochre border-ochre/15", dot: "bg-ochre" },
  findings_available: { label: "Findings available", className: "bg-ochre-soft text-ochre border-ochre/15", dot: "bg-ochre" },
  in_review: { label: "In review", className: "bg-pine-soft text-pine border-pine/15", dot: "bg-pine" },
  awaiting_source: { label: "Awaiting source", className: "bg-slate-soft text-slate border-slate/15", dot: "bg-slate" },
  clarification_sent: { label: "Clarification sent", className: "bg-paper text-muted border-line-strong", dot: "bg-[#9b9a90]" },
  ready_for_decision: { label: "Ready for decision", className: "bg-pine-soft text-pine border-pine/15", dot: "bg-pine" },
  ready_for_review: { label: "Ready for review", className: "bg-pine-soft text-pine border-pine/15", dot: "bg-pine" },
  submitted: { label: "Submitted", className: "bg-slate-soft text-slate border-slate/15", dot: "bg-slate" },
};

export const riskLevel: Record<RiskLevel, { label: string; className: string; dot: string }> = {
  high: { label: "High", className: "bg-rust-soft text-rust border-rust/15", dot: "bg-rust" },
  medium: { label: "Medium", className: "bg-ochre-soft text-ochre border-ochre/15", dot: "bg-ochre" },
  low: { label: "Low", className: "bg-pine-soft text-pine border-pine/15", dot: "bg-pine" },
};

export const documentStatus: Record<DocumentStatus, { label: string; className: string; dot: string }> = {
  verified: { label: "Verified", className: "bg-pine-soft text-pine border-pine/15", dot: "bg-pine" },
  mismatch: { label: "Mismatch", className: "bg-ochre-soft text-ochre border-ochre/15", dot: "bg-ochre" },
  expired: { label: "Expired", className: "bg-rust-soft text-rust border-rust/15", dot: "bg-rust" },
  missing: { label: "Missing", className: "bg-[#f0ede5] text-muted border-line-strong", dot: "bg-[#9b9a90]" },
  processing: { label: "Processing", className: "bg-slate-soft text-slate border-slate/15", dot: "bg-slate animate-pulse-soft" },
  manual_review: { label: "Manual review", className: "bg-slate-soft text-slate border-slate/15", dot: "bg-slate" },
};

export const severity: Record<string, { label: string; className: string; dot: string; bar: string }> = {
  critical: { label: "Critical", className: "bg-rust-soft text-rust border-rust/15", dot: "bg-rust", bar: "bg-rust" },
  high: { label: "High", className: "bg-rust-soft text-rust border-rust/15", dot: "bg-rust", bar: "bg-rust" },
  medium: { label: "Medium", className: "bg-ochre-soft text-ochre border-ochre/15", dot: "bg-ochre", bar: "bg-ochre" },
  low: { label: "Low", className: "bg-pine-soft text-pine border-pine/15", dot: "bg-pine", bar: "bg-pine" },
  info: { label: "Info", className: "bg-slate-soft text-slate border-slate/15", dot: "bg-slate", bar: "bg-slate" },
};

export const verificationStatus: Record<VerificationStatus, { label: string; className: string; dot: string }> = {
  not_started: { label: "Not started", className: "bg-[#f0ede5] text-muted border-line-strong", dot: "bg-[#9b9a90]" },
  verification_pending: { label: "Pending", className: "bg-slate-soft text-slate border-slate/15", dot: "bg-slate animate-pulse-soft" },
  verified: { label: "Verified", className: "bg-pine-soft text-pine border-pine/15", dot: "bg-pine" },
  mismatch_detected: { label: "Mismatch", className: "bg-ochre-soft text-ochre border-ochre/15", dot: "bg-ochre" },
  expired: { label: "Expired", className: "bg-rust-soft text-rust border-rust/15", dot: "bg-rust" },
  source_unavailable: { label: "Source unavailable", className: "bg-slate-soft text-slate border-slate/15", dot: "bg-slate" },
  manual_review_required: { label: "Manual review", className: "bg-ochre-soft text-ochre border-ochre/15", dot: "bg-ochre" },
};

export const reviewCategory: Record<string, string> = {
  source_unavailable: "Source unavailable",
  ambiguous_match: "Ambiguous match",
  anomaly: "Anomaly review",
  extraction: "Extraction quality",
};

export function initials(name: string) {
  return name
    .split(" ")
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}
