import type {
  Application,
  AuditEntry,
  DocumentRecord,
  Finding,
  ReviewItem,
  RuleRecord,
  VerificationRecord,
} from "./types";
import dataset from "./data/dataset.json";

export const applications: Application[] = dataset.applications as Application[];

export const dashboardMetrics = dataset.dashboardMetrics as Array<{
  label: string;
  value: string;
  delta: string;
  detail: string;
  tone: "pine" | "ochre" | "rust" | "neutral";
  series: number[];
}>;

export const throughputData: Array<{ day: string; validated: number; manual: number }> = dataset.throughputData;

export const signalData: Array<{ label: string; count: number; tone: string }> = dataset.signalData;

export const activityFeed: Array<{
  title: string;
  meta: string;
  time: string;
  tone: "rust" | "ochre" | "slate" | "pine";
}> = dataset.activityFeed as any;

export const documents: DocumentRecord[] = dataset.documents as DocumentRecord[];

export const findings: Finding[] = dataset.findings as Finding[];

export const verifications: VerificationRecord[] = [
  {
    documentId: "DOC-APP-2026-8941-NOC",
    adapter: "State Technical Board / University (QR)",
    status: "verified",
    source: "https://stateuniv.edu.in/verify?doc=NOC/MAH/2026/9935",
    checkedAt: "27 Oct 2026, 11:01 IST",
    reference: "NOC/MAH/2026/9935",
    detail: "QR code digital signature verified with State Technical University root cert. Intake: 360.",
  },
  {
    documentId: "DOC-APP-2026-8941-ACC",
    adapter: "NBA / NAAC Accreditation Registry",
    status: "verified",
    source: "https://nbaind.org/api/v1/accreditation/check",
    checkedAt: "27 Oct 2026, 11:01 IST",
    reference: "NBA/2026/MAH-ENG-3686",
    detail: "Accreditation status active (Tier-1) through 30 June 2028.",
  },
  {
    documentId: "DOC-APP-2026-9012-NOC",
    adapter: "State Technical Board / University (QR)",
    status: "verified",
    source: "https://stateuniv.edu.in/verify?doc=NOC/MAH/2026/8102",
    checkedAt: "27 Oct 2026, 11:15 IST",
    reference: "NOC/MAH/2026/8102",
    detail: "QR signature confirmed with University of Mumbai. Approved Intake: 360.",
  },
  {
    documentId: "DOC-APP-2026-9012-ACC",
    adapter: "NBA / NAAC Accreditation Registry",
    status: "verified",
    source: "https://nbaind.org/api/v1/accreditation/check",
    checkedAt: "27 Oct 2026, 11:15 IST",
    reference: "NBA/2026/MAH-ENG-1035",
    detail: "Accreditation valid (Tier-II) through 30 June 2028.",
  },
  {
    documentId: "DOC-APP-2026-8951-NOC",
    adapter: "State Technical Board / University (QR)",
    status: "source_unavailable",
    source: "https://stateuniv.edu.in/verify?doc=NOC/TEL/2026/4770",
    checkedAt: "27 Oct 2026, 11:01 IST",
    reference: "NOC/TEL/2026/4770",
    detail: "HTTP 503 gateway timeout after 5000ms. Routed to manual verification queue.",
  },
  {
    documentId: "DOC-APP-2026-8942-ACC",
    adapter: "NBA / NAAC Accreditation Registry",
    status: "expired",
    source: "https://nbaind.org/api/v1/accreditation/check",
    checkedAt: "27 Oct 2026, 11:01 IST",
    reference: "NBA/2024/MAH-ENG-3542",
    detail: "Record indicates accreditation expired on 30 June 2025. Does not cover AY 2026-27.",
  },
];

export const reviewQueue: ReviewItem[] = dataset.reviewQueue as ReviewItem[];

export const auditEntries: AuditEntry[] = dataset.auditEntries as unknown as AuditEntry[];

export const rules: RuleRecord[] = [
  {
    id: "EOA-REQ-03",
    title: "Land & ownership document required",
    group: "Completeness",
    type: "required_document",
    severity: "high",
    version: "1.4",
    active: true,
    evaluations: 0,
    failures: 0,
    yaml: `id: EOA-REQ-03
version: 1.4
type: required_document
severity: high
document_class: land_ownership
accepted_types:
  - sale_deed
  - registered_lease
  - ownership_certificate
on_missing: fail
evidence:
  show_checklist_ref: true
`,
  },
  {
    id: "EOA-EXP-02",
    title: "Accreditation certificate not expired",
    group: "Validity",
    type: "not_expired",
    severity: "high",
    version: "1.4",
    active: true,
    evaluations: 0,
    failures: 0,
    yaml: `id: EOA-EXP-02
version: 1.4
type: not_expired
severity: high
document_class: accreditation
date_field: valid_to
buffer_days: 0
on_expired: fail
evidence:
  compare_with: academic_year_start
`,
  },
  {
    id: "EOA-XDOC-01",
    title: "Institution name matches across all documents",
    group: "Consistency",
    type: "field_match_across_documents",
    severity: "medium",
    version: "1.4",
    active: true,
    evaluations: 0,
    failures: 0,
    yaml: `id: EOA-XDOC-01
version: 1.4
type: field_match_across_documents
severity: medium
field: institution_name
threshold: 0.95
normalizers:
  - lowercase
  - remove_punctuation
  - expand_abbreviations
on_mismatch: review
`,
  },
  {
    id: "EOA-AIC-01",
    title: "Institution name matches AICTE portal records",
    group: "Records",
    type: "field_match_aicte_record",
    severity: "high",
    version: "1.4",
    active: true,
    evaluations: 0,
    failures: 0,
    yaml: `id: EOA-AIC-01
version: 1.4
type: field_match_aicte_record
severity: high
document_field: institution_name
record_field: institution_name
threshold: 0.90
on_mismatch: review
evidence:
  show_both_values: true
`,
  },
  {
    id: "EOA-DUP-01",
    title: "Document content hash is unique across applications",
    group: "Integrity",
    type: "exact_duplicate",
    severity: "high",
    version: "1.2",
    active: true,
    evaluations: 0,
    failures: 0,
    yaml: `id: EOA-DUP-01
version: 1.2
type: exact_duplicate
severity: high
algorithm: sha256
scope: all_academic_years
on_duplicate: flag_anomaly
wording: "Possible duplicate submission across applications"
`,
  },
  {
    id: "EOA-META-01",
    title: "PDF metadata creation date consistent with stated issue date",
    group: "Integrity",
    type: "metadata_consistency",
    severity: "medium",
    version: "1.1",
    active: true,
    evaluations: 0,
    failures: 0,
    yaml: `id: EOA-META-01
version: 1.1
type: metadata_consistency
severity: medium
check: creation_date_lte_issue_date
max_slack_hours: 48
on_inconsistency: flag_anomaly
wording: "PDF metadata creation date postdates stated issue date"
`,
  },
  {
    id: "EOA-TER-01",
    title: "TER (Technical Education Regulatory) fee paid",
    group: "Completeness",
    type: "ter_paid",
    severity: "medium",
    version: "1.4",
    active: true,
    evaluations: 0,
    failures: 0,
    yaml: `id: EOA-TER-01
version: 1.4
type: ter_paid
severity: medium
source: aicte_records.ter_payment_status
accepted:
  - paid
  - exempt
on_pending: review
`,
  },
  {
    id: "EOA-INF-01",
    title: "Lab area per student — advisory",
    group: "Compliance",
    type: "compliance_advisory",
    severity: "low",
    version: "1.0",
    active: true,
    evaluations: 0,
    failures: 0,
    yaml: `id: EOA-INF-01
version: 1.0
type: compliance_advisory
severity: low
advisory_only: true
metric: lab_area_sq_m_per_student
minimum: 1.5
source: floor_plan_field
on_shortfall: additional_evidence_needed
`,
  },
  {
    id: "EOA-VER-01",
    title: "Issuer source responds conclusively",
    group: "Verification",
    type: "source_verification",
    severity: "medium",
    version: "1.1",
    active: true,
    evaluations: 0,
    failures: 0,
    yaml: `id: EOA-VER-01
version: 1.1
type: source_verification
severity: medium
timeout_ms: 5000
on_timeout: manual_review_required
on_503: manual_review_required
retry:
  attempts: 2
  backoff_ms: 800
`,
  },
  {
    id: "EOA-DEF-01",
    title: "No pending AICTE deficiency",
    group: "Records",
    type: "no_pending_deficiency",
    severity: "medium",
    version: "1.4",
    active: true,
    evaluations: 0,
    failures: 0,
    yaml: `id: EOA-DEF-01
version: 1.4
type: no_pending_deficiency
severity: medium
source: aicte_records.deficiency_status
accepted:
  - none
  - closed
on_pending: review
`,
  },
  {
    id: "EOA-FMT-02",
    title: "Certificate number follows issued format",
    group: "Consistency",
    type: "format_regex",
    severity: "low",
    version: "1.3",
    active: true,
    evaluations: 0,
    failures: 0,
    yaml: `id: EOA-FMT-02
version: 1.3
type: format_regex
severity: low
field: certificate_no
pattern: "^[A-Z]{2,4}-[0-9]{4}-[0-9]{4}$"
on_mismatch: review
`,
  },
  {
    id: "EOA-INF-02",
    title: "Faculty–student ratio — advisory",
    group: "Compliance",
    type: "compliance_advisory",
    severity: "low",
    version: "1.0",
    active: true,
    evaluations: 0,
    failures: 0,
    yaml: `id: EOA-INF-02
version: 1.0
type: compliance_advisory
severity: low
advisory_only: true
metric: faculty_student_ratio
maximum: 1.20
source: aicte_records.faculty_count
on_shortfall: recommend_physical_inspection
`,
  },
];

export const ruleGroups = [
  "Completeness",
  "Validity",
  "Consistency",
  "Records",
  "Integrity",
  "Compliance",
  "Verification",
];

export const sourceHealth: Array<{
  name: string;
  status: string;
  tone: "pine" | "ochre";
  uptime: number;
}> = [
  { name: "State Technical Board / University (QR)", status: "Active · Online", tone: "pine", uptime: 99.8 },
  { name: "NBA / NAAC Accreditation Registry", status: "Active · Online", tone: "pine", uptime: 99.2 },
  { name: "Revenue & Land Registry Adapter", status: "Degraded · Intermittent latency", tone: "ochre", uptime: 84.5 },
  { name: "Municipal Fire Services Portal", status: "Active · Online", tone: "pine", uptime: 98.7 },
];
