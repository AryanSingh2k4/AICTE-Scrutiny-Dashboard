export type Role =
  | "scrutiny_officer"
  | "senior_officer"
  | "institution"
  | "auditor";

export type ApplicationStatus =
  | "processing"
  | "findings_ready"
  | "findings_available"
  | "in_review"
  | "awaiting_source"
  | "clarification_sent"
  | "ready_for_decision"
  | "ready_for_review"
  | "submitted";

export type RiskLevel = "high" | "medium" | "low";

export type DocumentStatus =
  | "verified"
  | "mismatch"
  | "expired"
  | "missing"
  | "processing"
  | "manual_review";

export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export type VerificationStatus =
  | "not_started"
  | "verification_pending"
  | "verified"
  | "mismatch_detected"
  | "expired"
  | "source_unavailable"
  | "manual_review_required";

export interface Application {
  id: string;
  institution: string;
  shortName: string;
  city: string;
  state: string;
  programme: string;
  intake: number;
  trust: string;
  submittedAt: string;
  submittedLabel: string;
  documentsTotal: number;
  documentsReceived: number;
  findings: number;
  highFindings: number;
  status: ApplicationStatus;
  risk: RiskLevel;
  officer: string;
  lastAction: string;
}

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  source: string;
}

export interface DocumentRecord {
  id: string;
  type: string;
  label: string;
  fileName: string;
  pages: number;
  status: DocumentStatus;
  issuer: string;
  reference: string;
  hash: string;
  uploadedAt: string;
  extracted: ExtractedField[];
  findings: number;
  note?: string;
  ocrText?: string;
  storagePath?: string;
}

export interface Finding {
  id: string;
  title: string;
  severity: FindingSeverity;
  ruleId: string;
  ruleVersion: string;
  ruleType: string;
  documentId: string;
  documentLabel: string;
  page: number;
  confidence: number;
  description: string;
  evidence: string[];
  source: string;
  timestamp: string;
  recommendation: string;
  bbox?: { x: number; y: number; w?: number; width?: number; h?: number; height?: number; label?: string };
  status: "open" | "acknowledged";
}

export interface VerificationRecord {
  documentId: string;
  adapter: string;
  status: VerificationStatus;
  source: string;
  checkedAt: string;
  reference: string;
  detail: string;
}

export interface ReviewItem {
  id: string;
  applicationId: string;
  institution: string;
  shortName: string;
  reason: string;
  category: "source_unavailable" | "ambiguous_match" | "anomaly" | "extraction";
  age: string;
  priority: "urgent" | "high" | "normal";
  assignee: string | null;
  documents: number;
  ruleId: string;
}

export interface AuditEntry {
  id: string;
  sequence: number;
  action: string;
  actor: string;
  actorRole: string;
  entity: string;
  timestamp: string;
  hash: string;
  previousHash: string;
  payload: Record<string, string | number | boolean>;
}

export interface RuleRecord {
  id: string;
  title: string;
  group: string;
  type: string;
  severity: FindingSeverity;
  version: string;
  active: boolean;
  evaluations: number;
  failures: number;
  yaml: string;
}
