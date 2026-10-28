import { stringify } from "yaml";
import { getServerSupabase } from "@/lib/supabase/server";
import type {
  Application,
  ApplicationStatus,
  AuditEntry,
  DocumentRecord,
  DocumentStatus,
  ExtractedField,
  Finding,
  FindingSeverity,
  ReviewItem,
  RiskLevel,
  RuleRecord,
  VerificationRecord,
} from "@/lib/types";

type SupabaseClient = ReturnType<typeof getServerSupabase>;
type Row = Record<string, any>;

const STANDARD_DOCUMENT_TYPES = [
  "affidavit",
  "noc_university",
  "accreditation_nba",
  "fire_safety",
  "land_ownership",
];

const DOCUMENT_LABELS: Record<string, string> = {
  affidavit: "Affidavit of Undertaking",
  noc_university: "State Board / University NOC",
  accreditation_nba: "NBA / NAAC Accreditation",
  fire_safety: "Fire Safety Certificate",
  land_ownership: "Land Ownership / Title Deed",
};

const ANOMALY_LABELS: Record<string, { label: string; tone: string; ruleId: string }> = {
  image_tamper_ela: { label: "Image tamper (ELA)", tone: "#a24835", ruleId: "EOA-ALT-01" },
  cross_institution_plagiarism: { label: "Cross-institution text match", tone: "#a24835", ruleId: "EOA-PLAG-01" },
  duplicate: { label: "Exact duplicate hash", tone: "#98661c", ruleId: "EOA-DUP-01" },
  metadata_inconsistency: { label: "Metadata inconsistency", tone: "#98661c", ruleId: "EOA-META-01" },
  extraction_mismatch: { label: "Extraction mismatch", tone: "#4d544e", ruleId: "EOA-XDOC-01" },
};

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function shortNameFor(name: string) {
  const parenthesised = name.match(/\(([^)]+)\)\s*$/);
  if (parenthesised?.[1]) return parenthesised[1].toUpperCase();
  const words = name
    .replace(/[^a-zA-Z ]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !/^(of|and|the)$/i.test(word));
  return (words.slice(0, 4).map((word) => word[0]).join("") || name.slice(0, 3)).toUpperCase();
}

function submittedLabel(date: Date) {
  return (
    date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }) + " IST"
  );
}

function timestampLabel(value?: string | null) {
  if (!value) return "—";
  return (
    new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }) + " IST"
  );
}

function shortHash(value?: string | null) {
  if (!value) return "—";
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

export function relativeAge(value?: string | null) {
  if (!value) return "—";
  const diffMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "just now";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function riskFor(score: number | null | undefined, flags: number): RiskLevel {
  const numeric = Number(score ?? 0);
  if (numeric >= 0.6) return "high";
  if (numeric >= 0.2) return "medium";
  return flags > 0 ? "high" : "low";
}

function statusFor(status: string | null | undefined, flags: number): ApplicationStatus {
  if (flags > 0) return "findings_available";
  return (status as ApplicationStatus) || "ready_for_review";
}

export function mapApplicationRecord(
  row: Row,
  documents: Row[] = [],
  anomalies: Row[] = [],
  lastAudit?: { action: string; actor: string } | null
): Application {
  const institution = Array.isArray(row.institutions) ? row.institutions[0] : row.institutions;
  const aicte = Array.isArray(institution?.aicte_records)
    ? institution.aicte_records[0]
    : institution?.aicte_records;
  const institutionName = institution?.name || row.institution_id;
  const programmes: string[] = aicte?.approved_programmes || [];
  const highFlags = anomalies.filter(
    (flag) => flag.severity === "high" || flag.severity === "critical"
  ).length;
  const submittedDate = row.submitted_at ? new Date(row.submitted_at) : null;

  return {
    id: row.id,
    institution: institutionName,
    shortName: shortNameFor(institutionName),
    city: institution?.city || "—",
    state: institution?.state || "—",
    programme: programmes.length > 0 ? programmes.slice(0, 2).join(" & ") : "Not specified",
    intake: aicte?.total_approved_intake ?? 0,
    trust: institution?.trust_society || "—",
    submittedAt: submittedDate?.toISOString() ?? "",
    submittedLabel: submittedDate ? submittedLabel(submittedDate) : "Not recorded",
    documentsTotal: STANDARD_DOCUMENT_TYPES.length,
    documentsReceived: documents.length,
    findings: anomalies.length,
    highFindings: highFlags,
    status: statusFor(row.system_status, anomalies.length),
    risk: riskFor(row.overall_risk_score, anomalies.length),
    officer: lastAudit?.actor || "Unassigned",
    lastAction: lastAudit?.action
      ? humanize(lastAudit.action)
      : "Awaiting scrutiny review",
  } satisfies Application;
}

export async function fetchApplications(
  supabase: SupabaseClient = getServerSupabase()
): Promise<Application[]> {
  const { data: dbApps, error } = await supabase
    .from("applications")
    .select("*, institutions(*, aicte_records(*))")
    .order("submitted_at", { ascending: false });

  if (error) throw error;

  const [{ data: dbDocs }, { data: dbFlags }, { data: dbAudit }] = await Promise.all([
    supabase.from("documents").select("application_id, document_type"),
    supabase.from("anomaly_flags").select("application_id, severity"),
    supabase
      .from("audit_log")
      .select("entity_id, action, actor, created_at")
      .eq("entity", "applications")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const docsByApp: Record<string, Row[]> = {};
  for (const doc of dbDocs || []) {
    (docsByApp[doc.application_id] ||= []).push(doc);
  }

  const flagsByApp: Record<string, Row[]> = {};
  for (const flag of dbFlags || []) {
    (flagsByApp[flag.application_id] ||= []).push(flag);
  }

  const lastAudit: Record<string, { action: string; actor: string }> = {};
  for (const row of dbAudit || []) {
    if (row.entity_id && !lastAudit[row.entity_id]) {
      lastAudit[row.entity_id] = { action: row.action, actor: row.actor };
    }
  }

  return (dbApps || []).map((row: Row) =>
    mapApplicationRecord(row, docsByApp[row.id] || [], flagsByApp[row.id] || [], lastAudit[row.id])
  );
}

function ruleIdForAnomaly(type: string) {
  return ANOMALY_LABELS[type]?.ruleId || "EOA-INT-01";
}

function categoryForAnomaly(type: string): ReviewItem["category"] {
  if (type === "duplicate" || type === "cross_institution_plagiarism") return "ambiguous_match";
  return "anomaly";
}

function priorityForSeverity(severity: string): ReviewItem["priority"] {
  if (severity === "critical" || severity === "high") return "urgent";
  if (severity === "medium") return "high";
  return "normal";
}

async function fetchClaims(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("review_claims")
    .select("item_key, officer_name, claimed_at");
  if (error) {
    // The optional review_claims migration has not been applied yet.
    return new Map<string, { officerName: string; claimedAt: string }>();
  }
  return new Map(
    (data || []).map((claim: Row) => [
      claim.item_key,
      { officerName: claim.officer_name, claimedAt: claim.claimed_at },
    ])
  );
}

export async function fetchReviewQueue(
  supabase: SupabaseClient = getServerSupabase()
): Promise<ReviewItem[]> {
  const [{ data: anomalies }, { data: verifications }, { data: reviews }, { data: docs }, claims] =
    await Promise.all([
      supabase
        .from("anomaly_flags")
        .select("*, applications(id, institution_id, institutions(name))")
        .order("flagged_at", { ascending: false }),
      supabase
        .from("verification_results")
        .select(
          "id, document_id, issuer_name, method, status, response_payload, verified_at, documents(id, document_type, application_id, applications(id, institution_id, institutions(name)))"
        )
        .in("status", ["source_unavailable", "mismatch_detected", "expired", "manual_review_required"])
        .order("verified_at", { ascending: false }),
      supabase
        .from("validation_results")
        .select(
          'id, application_id, document_id, rule_id, rule_version, status, severity, message, evidence, confidence, evaluated_at, rules(title, "group", type), applications(id, institution_id, institutions(name))'
        )
        .eq("status", "REVIEW")
        .order("evaluated_at", { ascending: false }),
      supabase.from("documents").select("application_id"),
      fetchClaims(supabase),
    ]);

  const documentCounts: Record<string, number> = {};
  for (const doc of docs || []) {
    documentCounts[doc.application_id] = (documentCounts[doc.application_id] || 0) + 1;
  }

  const items: ReviewItem[] = [];
  const seen = new Set<string>();

  function push(item: Omit<ReviewItem, "id" | "age" | "documents" | "assignee"> & {
    id: string;
    age: string;
    applicationId: string;
  }) {
    const key = `${item.applicationId}:${item.ruleId}:${item.reason}`;
    if (seen.has(key)) return;
    seen.add(key);
    const claim = claims.get(item.id);
    items.push({
      ...item,
      documents: documentCounts[item.applicationId] || 0,
      assignee: claim?.officerName ?? null,
    });
  }

  for (const anomaly of anomalies || []) {
    const app = Array.isArray(anomaly.applications) ? anomaly.applications[0] : anomaly.applications;
    const institution = Array.isArray(app?.institutions) ? app.institutions[0] : app?.institutions;
    const institutionName = institution?.name || anomaly.application_id;
    const meta = ANOMALY_LABELS[anomaly.anomaly_type];
    push({
      id: `RQ-ANOM-${anomaly.id}`,
      applicationId: anomaly.application_id,
      institution: institutionName,
      shortName: shortNameFor(institutionName),
      reason: anomaly.reason || meta?.label || "Advisory anomaly flagged",
      category: categoryForAnomaly(anomaly.anomaly_type),
      age: relativeAge(anomaly.flagged_at),
      priority: priorityForSeverity(anomaly.severity),
      ruleId: ruleIdForAnomaly(anomaly.anomaly_type),
    });
  }

  for (const verification of verifications || []) {
    const doc = Array.isArray(verification.documents) ? verification.documents[0] : verification.documents;
    const app = Array.isArray(doc?.applications) ? doc.applications[0] : doc?.applications;
    const institution = Array.isArray(app?.institutions) ? app.institutions[0] : app?.institutions;
    const institutionName = institution?.name || app?.id || "Unknown institution";
    const reason =
      verification.status === "source_unavailable"
        ? `${verification.issuer_name} could not be reached. ${verification.response_payload?.error || "Retry the source before deciding."}`
        : `${verification.issuer_name} returned status "${String(verification.status).replaceAll("_", " ")}".`;
    push({
      id: `RQ-VER-${verification.id}`,
      applicationId: doc?.application_id || app?.id || "",
      institution: institutionName,
      shortName: shortNameFor(institutionName),
      reason,
      category: verification.status === "source_unavailable" ? "source_unavailable" : "anomaly",
      age: relativeAge(verification.verified_at),
      priority: verification.status === "expired" ? "urgent" : "high",
      ruleId: `ISS-${String(doc?.document_type || "DOC").toUpperCase()}`,
    });
  }

  for (const review of reviews || []) {
    const app = Array.isArray(review.applications) ? review.applications[0] : review.applications;
    const institution = Array.isArray(app?.institutions) ? app.institutions[0] : app?.institutions;
    const institutionName = institution?.name || review.application_id;
    const rule = Array.isArray(review.rules) ? review.rules[0] : review.rules;
    push({
      id: `RQ-REVIEW-${review.id}`,
      applicationId: review.application_id,
      institution: institutionName,
      shortName: shortNameFor(institutionName),
      reason: review.message || rule?.title || `Rule ${review.rule_id} needs human review`,
      category: rule?.type === "field_match_across_documents" ? "ambiguous_match" : "extraction",
      age: relativeAge(review.evaluated_at),
      priority: priorityForSeverity(review.severity),
      ruleId: review.rule_id,
    });
  }

  return items.sort((a, b) => {
    const order: Record<ReviewItem["priority"], number> = { urgent: 0, high: 1, normal: 2 };
    return order[a.priority] - order[b.priority];
  });
}

function toneForAction(action: string): "rust" | "ochre" | "slate" | "pine" {
  const normalized = action.toUpperCase();
  if (/REJECT|ANOMALY|FAIL|BROKEN/.test(normalized)) return "rust";
  if (/DECISION|CLARIF|INSPECT/.test(normalized)) return "ochre";
  if (/REVALIDATE|UPLOAD|PROCESS|CLAIM/.test(normalized)) return "pine";
  return "slate";
}

function actionLabel(action: string) {
  return humanize(action.toLowerCase());
}

export type OfficerOverview = {
  applications: Application[];
  reviewQueue: ReviewItem[];
  throughput: Array<{ day: string; validated: number; manual: number }>;
  signals: Array<{ label: string; count: number; tone: string }>;
  activity: Array<{ title: string; meta: string; time: string; tone: "rust" | "ochre" | "slate" | "pine" }>;
  sourceHealth: Array<{ name: string; status: string; tone: "pine" | "ochre"; uptime: number }>;
  rules: { total: number; active: number; version: string; updatedAt: string | null };
  audit: { totalEntries: number; lastSealedAt: string | null; lastHash: string | null };
  generatedAt: string;
};

export async function fetchOfficerOverview(
  supabase: SupabaseClient = getServerSupabase()
): Promise<OfficerOverview> {
  const [applications, reviewQueue] = await Promise.all([
    fetchApplications(supabase),
    fetchReviewQueue(supabase),
  ]);

  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const [
    { data: anomalies },
    { data: verifications },
    { data: recentAudit },
    { data: rules },
    { count: auditCount },
    { data: lastAudit },
  ] = await Promise.all([
    supabase.from("anomaly_flags").select("anomaly_type, severity, flagged_at"),
    supabase.from("verification_results").select("issuer_name, status, verified_at"),
    supabase
      .from("audit_log")
      .select("sequence_number, action, actor, actor_role, entity, entity_id, payload, created_at")
      .order("sequence_number", { ascending: false })
      .limit(120),
    supabase.from("rules").select("id, version, active, updated_at"),
    supabase.from("audit_log").select("*", { count: "exact", head: true }),
    supabase
      .from("audit_log")
      .select("sequence_number, current_hash, created_at")
      .order("sequence_number", { ascending: false })
      .limit(1),
  ]);

  const signals = Object.entries(
    (anomalies || []).reduce<Record<string, number>>((acc, anomaly: Row) => {
      acc[anomaly.anomaly_type] = (acc[anomaly.anomaly_type] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([type, count]) => ({
      label: ANOMALY_LABELS[type]?.label || type.replaceAll("_", " "),
      count,
      tone: ANOMALY_LABELS[type]?.tone || "#4d544e",
    }))
    .sort((a, b) => b.count - a.count);

  const sourceMap = new Map<string, { total: number; verified: number }>();
  for (const verification of verifications || []) {
    const entry = sourceMap.get(verification.issuer_name) || { total: 0, verified: 0 };
    entry.total += 1;
    if (verification.status === "verified") entry.verified += 1;
    sourceMap.set(verification.issuer_name, entry);
  }
  const sourceHealth = Array.from(sourceMap.entries()).map(([name, stats]) => {
    const issues = stats.total - stats.verified;
    return {
      name,
      status: issues > 0 ? `Degraded · ${issues} issue${issues === 1 ? "" : "s"}` : "Active · Online",
      tone: issues > 0 ? ("ochre" as const) : ("pine" as const),
      uptime: stats.total > 0 ? Math.round((stats.verified / stats.total) * 1000) / 10 : 100,
    };
  });

  const dayFormatter = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" });
  const buckets = new Map<string, { day: string; validated: number; manual: number }>();
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(since);
    date.setDate(since.getDate() + offset);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, { day: dayFormatter.format(date), validated: 0, manual: 0 });
  }
  for (const entry of recentAudit || []) {
    if (entry.action !== "REVALIDATE_APPLICATION") continue;
    if (new Date(entry.created_at) < since) continue;
    const key = new Date(entry.created_at).toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    const payload = entry.payload || {};
    const needsManual =
      Number(payload.review_count || 0) > 0 ||
      Number(payload.fail_count || 0) > 0 ||
      Number(payload.verif_issue_count || 0) > 0;
    if (needsManual) bucket.manual += 1;
    else bucket.validated += 1;
  }

  const activity = (recentAudit || []).slice(0, 8).map((entry: Row) => ({
    title: actionLabel(entry.action),
    meta: `${entry.actor} · ${entry.entity}:${entry.entity_id}`,
    time: new Date(entry.created_at).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }),
    tone: toneForAction(entry.action),
  }));

  const versions = (rules || []).map((rule: Row) => rule.version).filter(Boolean).sort();
  const latestRule = (rules || [])
    .map((rule: Row) => rule.updated_at)
    .filter(Boolean)
    .sort()
    .at(-1);

  return {
    applications,
    reviewQueue,
    throughput: Array.from(buckets.values()),
    signals,
    activity,
    sourceHealth,
    rules: {
      total: rules?.length || 0,
      active: (rules || []).filter((rule: Row) => rule.active).length,
      version: versions.at(-1) || "—",
      updatedAt: latestRule || null,
    },
    audit: {
      totalEntries: auditCount || 0,
      lastSealedAt: lastAudit?.[0]?.created_at || null,
      lastHash: lastAudit?.[0]?.current_hash || null,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function mapRuleRecord(row: Row): RuleRecord {
  return {
    id: row.id,
    title: row.title,
    group: row.group || "Uncategorised",
    type: row.type,
    severity: (row.severity as FindingSeverity) || "medium",
    version: row.version || "—",
    active: Boolean(row.active),
    evaluations: Number(row.evaluations || 0),
    failures: Number(row.failures || 0),
    yaml: stringify(row.rule_spec ?? {}),
    updatedAt: row.updated_at ?? null,
  } satisfies RuleRecord;
}

function severityFor(value?: string | null): FindingSeverity {
  const normalized = String(value || "").toLowerCase();
  if (["critical", "high", "medium", "low", "info"].includes(normalized)) {
    return normalized as FindingSeverity;
  }
  return "medium";
}

function evidenceStrings(evidence: Row | null | undefined): string[] {
  if (!evidence || typeof evidence !== "object") return ["Evidence recorded by the scrutiny engine."];
  return Object.entries(evidence).map(([key, value]) => {
    const rendered = typeof value === "object" ? JSON.stringify(value) : String(value);
    return `${humanize(key)}: ${rendered}`;
  });
}

function bboxFor(bbox: Row | null | undefined) {
  if (!bbox || typeof bbox !== "object") return undefined;
  return {
    x: Number(bbox.x ?? 0),
    y: Number(bbox.y ?? 0),
    width: Number(bbox.width ?? bbox.w ?? 0),
    height: Number(bbox.height ?? bbox.h ?? 0),
    label: bbox.label || undefined,
  };
}

export type ApplicationDossier = {
  application: Application | null;
  documents: DocumentRecord[];
  findings: Finding[];
  verifications: VerificationRecord[];
  auditEntries: AuditEntry[];
  rules: RuleRecord[];
  decisions: Row[];
  validationResults: Row[];
  anomalies: Row[];
  rulebookVersion: string;
  generatedAt: string;
};

export async function fetchApplicationDossier(applicationId: string): Promise<ApplicationDossier> {
  const supabase = getServerSupabase();

  const { data: application, error } = await supabase
    .from("applications")
    .select("*, institutions(*, aicte_records(*))")
    .eq("id", applicationId)
    .maybeSingle();

  if (error) throw error;

  const [
    { data: documents },
    { data: validationResults },
    { data: anomalies },
    { data: decisions },
    { data: rules },
  ] = await Promise.all([
    supabase.from("documents").select("*").eq("application_id", applicationId).order("created_at", { ascending: false }),
    supabase
      .from("validation_results")
      .select("*")
      .eq("application_id", applicationId)
      .order("evaluated_at", { ascending: false }),
    supabase
      .from("anomaly_flags")
      .select("*")
      .eq("application_id", applicationId)
      .order("flagged_at", { ascending: false }),
    supabase
      .from("officer_decisions")
      .select("*")
      .eq("application_id", applicationId)
      .order("recorded_at", { ascending: false }),
    supabase.from("rules").select("*").order("id", { ascending: true }),
  ]);

  const documentIds = (documents || []).map((doc: Row) => doc.id);
  const [extractedFields, verifications, auditEntries] = await Promise.all([
    documentIds.length > 0
      ? supabase.from("extracted_fields").select("*").in("document_id", documentIds)
      : Promise.resolve({ data: [], error: null }),
    documentIds.length > 0
      ? supabase.from("verification_results").select("*").in("document_id", documentIds).order("verified_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("audit_log")
      .select("*")
      .or(
        documentIds.length > 0
          ? `entity_id.eq.${applicationId},and(entity.eq.documents,entity_id.in.(${documentIds.join(",")}))`
          : `entity_id.eq.${applicationId}`
      )
      .order("sequence_number", { ascending: false })
      .limit(60),
  ]);

  if (!application) {
    return {
      application: null,
      documents: [],
      findings: [],
      verifications: [],
      auditEntries: [],
      rules: (rules || []).map(mapRuleRecord),
      decisions: [],
      validationResults: [],
      anomalies: [],
      rulebookVersion: (rules || [])[0]?.version || "—",
      generatedAt: new Date().toISOString(),
    };
  }

  const dbRules = rules || [];
  const ruleMap = new Map(dbRules.map((rule: Row) => [rule.id, rule]));
  const dbDocs = documents || [];
  const dbAnomalies = anomalies || [];
  const dbExtracted = extractedFields?.data || [];
  const dbVerifications = verifications?.data || [];

  const findings: Finding[] = [];

  for (const validation of validationResults || []) {
    if (validation.status !== "FAIL" && validation.status !== "REVIEW") continue;
    const rule = ruleMap.get(validation.rule_id);
    const document = dbDocs.find((doc: Row) => doc.id === validation.document_id);
    const evidence = validation.evidence || {};
    const bbox = bboxFor(evidence?.bbox);
    findings.push({
      id: `FND-${validation.id}`,
      title: validation.message || rule?.title || `Rule ${validation.rule_id} needs review`,
      severity: severityFor(validation.severity),
      ruleId: validation.rule_id,
      ruleVersion: validation.rule_version || rule?.version || "—",
      ruleType: rule?.type || "deterministic",
      documentId: validation.document_id || "",
      documentLabel: document ? DOCUMENT_LABELS[document.document_type] || document.document_type : "Application-level rule",
      page: Number(evidence?.page_number || 1),
      confidence: Number(validation.confidence ?? 1),
      description: validation.message || "Discrepancy detected during validation.",
      evidence: evidenceStrings(evidence),
      source: "Deterministic rule engine",
      timestamp: validation.evaluated_at || new Date().toISOString(),
      recommendation:
        validation.status === "REVIEW"
          ? "Human review required before an outcome is recorded."
          : "Request clarification or verify evidence with the institution.",
      bbox,
      status: "open",
    });
  }

  for (const anomaly of dbAnomalies) {
    const document = dbDocs.find((doc: Row) => doc.id === anomaly.document_id);
    const meta = ANOMALY_LABELS[anomaly.anomaly_type];
    findings.push({
      id: `ANOM-${anomaly.id}`,
      title:
        anomaly.anomaly_type === "duplicate"
          ? "Cross-institution duplicate document hash"
          : anomaly.anomaly_type === "cross_institution_plagiarism"
            ? "Cross-institution content match"
            : anomaly.anomaly_type === "image_tamper_ela"
              ? "Possible localized image alteration (ELA)"
              : meta?.label || humanize(anomaly.anomaly_type),
      severity: severityFor(anomaly.severity),
      ruleId: ruleIdForAnomaly(anomaly.anomaly_type),
      ruleVersion: ruleMap.get(ruleIdForAnomaly(anomaly.anomaly_type))?.version || "—",
      ruleType: anomaly.anomaly_type === "image_tamper_ela" ? "image_forensics" : "forensic_integrity",
      documentId: anomaly.document_id || "",
      documentLabel: document ? DOCUMENT_LABELS[document.document_type] || document.document_type : "Application evidence",
      page: Number(anomaly.page_number || 1),
      confidence: Number(anomaly.confidence ?? 0.8),
      description: anomaly.reason || "Advisory anomaly detected in the submitted evidence.",
      evidence: [
        anomaly.reason || "Advisory anomaly flagged",
        ...evidenceStrings(anomaly.evidence),
      ],
      source: "ScrutiniX forensic pipeline",
      timestamp: anomaly.flagged_at || new Date().toISOString(),
      recommendation: "Human inspection required. This is an advisory indicator, not a conclusion.",
      bbox: bboxFor(anomaly.bbox),
      status: "open",
    });
  }

  const mappedVerifications: VerificationRecord[] = dbVerifications.map((verification: Row) => {
    const document = dbDocs.find((doc: Row) => doc.id === verification.document_id);
    return {
      documentId: verification.document_id,
      adapter: `${verification.issuer_name} · ${humanize(verification.method || "lookup")}`,
      status: verification.status,
      source: verification.method || "issuer lookup",
      checkedAt: timestampLabel(verification.verified_at),
      reference: verification.response_payload?.reference || shortHash(verification.id),
      detail:
        verification.response_payload?.message ||
        `Issuer returned "${humanize(String(verification.status || "unknown"))}" for ${
          document ? DOCUMENT_LABELS[document.document_type] || document.document_type : "document"
        }.`,
    } satisfies VerificationRecord;
  });

  const mappedDocuments: DocumentRecord[] = dbDocs.map((document: Row) => {
    const documentFindings = findings.filter((finding) => finding.documentId === document.id);
    const verification = mappedVerifications.find((item) => item.documentId === document.id);
    let status: DocumentStatus = "manual_review";
    if (verification) {
      if (verification.status === "verified") status = "verified";
      else if (verification.status === "expired") status = "expired";
      else if (verification.status === "mismatch_detected") status = "mismatch";
    } else if (documentFindings.length === 0) {
      status = "processing";
    }

    const extracted: ExtractedField[] = dbExtracted
      .filter((field: Row) => field.document_id === document.id)
      .map((field: Row) => ({
        key: field.field_name,
        label: humanize(field.field_name),
        value: field.normalized_value || field.raw_value || "—",
        confidence: Number(field.confidence ?? 1),
        source: field.source || "extraction",
      }));

    return {
      id: document.id,
      type: document.document_type,
      label: DOCUMENT_LABELS[document.document_type] || humanize(document.document_type),
      fileName: document.file_name,
      pages: Number(document.page_count || 1),
      status,
      issuer: "Submitted by institution",
      reference: shortHash(document.sha256_hash),
      hash: document.sha256_hash || "—",
      uploadedAt: timestampLabel(document.created_at),
      extracted,
      findings: documentFindings.length,
      note: document.is_scanned ? "Scanned document · OCR layer used" : "Digital document · text layer available",
      ocrText: document.ocr_text || "",
    } satisfies DocumentRecord;
  });

  const presentTypes = new Set(dbDocs.map((document: Row) => document.document_type));
  for (const type of STANDARD_DOCUMENT_TYPES) {
    if (presentTypes.has(type)) continue;
    mappedDocuments.push({
      id: `MISSING-${applicationId}-${type}`,
      type,
      label: DOCUMENT_LABELS[type] || humanize(type),
      fileName: "Not submitted",
      pages: 0,
      status: "missing",
      issuer: "—",
      reference: "—",
      hash: "—",
      uploadedAt: "—",
      extracted: [],
      findings: 0,
      note: "Required document missing from the submission.",
    });
  }

  const lastApplicationAudit = (auditEntries?.data || []).find(
    (entry: Row) => entry.entity === "applications" && entry.entity_id === applicationId
  );

  const mappedAudit: AuditEntry[] = (auditEntries?.data || []).map((entry: Row) => ({
    id: String(entry.sequence_number),
    sequence: Number(entry.sequence_number),
    action: entry.action,
    actor: entry.actor,
    actorRole: entry.actor_role,
    entity: `${entry.entity}:${entry.entity_id}`,
    timestamp: timestampLabel(entry.created_at),
    hash: shortHash(entry.current_hash),
    previousHash: shortHash(entry.prev_hash),
    payload: entry.payload || {},
  }));

  return {
    application: mapApplicationRecord(application, dbDocs, dbAnomalies, lastApplicationAudit),
    documents: mappedDocuments,
    findings,
    verifications: mappedVerifications,
    auditEntries: mappedAudit,
    rules: dbRules.map(mapRuleRecord),
    decisions: decisions || [],
    validationResults: validationResults || [],
    anomalies: dbAnomalies,
    rulebookVersion: dbRules[0]?.version || "—",
    generatedAt: new Date().toISOString(),
  };
}
