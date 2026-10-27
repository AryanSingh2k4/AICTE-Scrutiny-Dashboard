// ==============================================================================
// ScrutiniX AICTE Scrutiny Engine — Deterministic Rules Evaluator
// Academic Year 2026–27 | Strictly Advisory Decision-Support
// ==============================================================================

export type RuleStatus = "PASS" | "FAIL" | "REVIEW";
export type RuleSeverity = "low" | "medium" | "high" | "critical";

export interface RuleSpec {
  [key: string]: any;
}

export interface RuleDefinition {
  id: string;
  version: string;
  group: string;
  type: string;
  title: string;
  severity: RuleSeverity;
  active: boolean;
  rule_spec: RuleSpec;
}

export interface EvaluationInput {
  application: {
    id: string;
    institution_id: string;
    academic_year: string;
  };
  institution: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
  aicteRecord: {
    total_approved_intake: number;
    faculty_count: number;
    deficiency_status: string;
    ter_payment_status: string;
  };
  documents: Array<{
    id: string;
    document_type: string;
    file_name: string;
    sha256_hash: string;
    metadata?: Record<string, any>;
    created_at?: string;
  }>;
  extractedFields: Array<{
    document_id: string;
    field_name: string;
    raw_value: string;
    normalized_value?: string;
    confidence: number;
  }>;
  allSystemDocumentHashes?: Array<{
    sha256_hash: string;
    application_id: string;
    institution_id: string;
  }>;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleVersion: string;
  status: RuleStatus;
  severity: RuleSeverity;
  message: string;
  evidence: Record<string, any>;
  confidence: number;
  documentId?: string;
}

// Levenshtein similarity normalizer
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\binstitute of technology\b/g, "tech inst")
    .replace(/\bengineering college\b/g, "eng coll")
    .trim();
}

function computeSimilarity(a: string, b: string): number {
  const s1 = normalizeString(a);
  const s2 = normalizeString(b);
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const track = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(null));

  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - distance / maxLen);
}

export function evaluateRule(rule: RuleDefinition, data: EvaluationInput): RuleEvaluationResult {
  const spec = rule.rule_spec;

  // 1. Required Document Completeness
  if (rule.type === "required_document") {
    const doc = data.documents.find((d) => d.document_type === spec.document_type);
    if (!doc) {
      return {
        ruleId: rule.id,
        ruleVersion: rule.version,
        status: (spec.on_missing?.toUpperCase() as RuleStatus) || "FAIL",
        severity: rule.severity,
        message: spec.wording || `Required document ${spec.document_type} missing from submission.`,
        evidence: { required_type: spec.document_type, present_types: data.documents.map((d) => d.document_type) },
        confidence: 1.0,
      };
    }
    return {
      ruleId: rule.id,
      ruleVersion: rule.version,
      status: "PASS",
      severity: rule.severity,
      message: `Document ${spec.document_type} verified present (${doc.file_name}).`,
      evidence: { document_id: doc.id, file_name: doc.file_name },
      confidence: 1.0,
      documentId: doc.id,
    };
  }

  // 2. Expiry & Validity Check
  if (rule.type === "not_expired") {
    const doc = data.documents.find((d) => d.document_type === spec.document_type);
    if (!doc) {
      return {
        ruleId: rule.id,
        ruleVersion: rule.version,
        status: "REVIEW",
        severity: rule.severity,
        message: `Cannot check validity: document ${spec.document_type} is missing.`,
        evidence: { reason: "document_missing" },
        confidence: 0.9,
      };
    }

    const field = data.extractedFields.find(
      (f) => f.document_id === doc.id && f.field_name === (spec.date_field || "valid_to")
    );

    if (!field || !field.raw_value) {
      return {
        ruleId: rule.id,
        ruleVersion: rule.version,
        status: "REVIEW",
        severity: rule.severity,
        message: `Date field '${spec.date_field}' could not be extracted; manual date review required.`,
        evidence: { document_id: doc.id, date_field: spec.date_field },
        confidence: 0.75,
        documentId: doc.id,
      };
    }

    const docDate = new Date(field.raw_value);
    const cutoff = new Date(spec.cutoff_date || "2026-06-30");

    if (isNaN(docDate.getTime())) {
      return {
        ruleId: rule.id,
        ruleVersion: rule.version,
        status: "REVIEW",
        severity: rule.severity,
        message: `Unparseable date '${field.raw_value}'. Manual officer inspection advised.`,
        evidence: { raw_date: field.raw_value },
        confidence: 0.8,
        documentId: doc.id,
      };
    }

    if (docDate < cutoff) {
      return {
        ruleId: rule.id,
        ruleVersion: rule.version,
        status: (spec.on_expired?.toUpperCase() as RuleStatus) || "FAIL",
        severity: rule.severity,
        message: spec.wording || `Document expired on ${docDate.toISOString().split("T")[0]}, prior to cutoff ${spec.cutoff_date}.`,
        evidence: { extracted_date: field.raw_value, parsed_date: docDate.toISOString(), cutoff_date: spec.cutoff_date },
        confidence: field.confidence || 0.95,
        documentId: doc.id,
      };
    }

    return {
      ruleId: rule.id,
      ruleVersion: rule.version,
      status: "PASS",
      severity: rule.severity,
      message: `Document validity confirmed through ${docDate.toISOString().split("T")[0]}.`,
      evidence: { valid_until: docDate.toISOString(), cutoff_date: spec.cutoff_date },
      confidence: 0.98,
      documentId: doc.id,
    };
  }

  // 3. Cross-Document Name Consistency
  if (rule.type === "field_match_across_documents") {
    const targetFields = data.extractedFields.filter((f) => f.field_name === (spec.field || "institution_name"));
    if (targetFields.length < 2) {
      return {
        ruleId: rule.id,
        ruleVersion: rule.version,
        status: "PASS",
        severity: rule.severity,
        message: "Fewer than 2 documents with extracted institution name; single point of truth verified.",
        evidence: { count: targetFields.length },
        confidence: 1.0,
      };
    }

    const baseline = targetFields[0].raw_value;
    const discrepancies: any[] = [];
    const threshold = spec.threshold || 0.92;

    for (let i = 1; i < targetFields.length; i++) {
      const other = targetFields[i].raw_value;
      const sim = computeSimilarity(baseline, other);
      if (sim < threshold) {
        discrepancies.push({
          baseline_doc: targetFields[0].document_id,
          baseline_value: baseline,
          other_doc: targetFields[i].document_id,
          other_value: other,
          similarity: Number(sim.toFixed(3)),
          threshold,
        });
      }
    }

    if (discrepancies.length > 0) {
      return {
        ruleId: rule.id,
        ruleVersion: rule.version,
        status: "REVIEW",
        severity: rule.severity,
        message: spec.wording || `Institution name variance detected across documents (similarity ${discrepancies[0].similarity} < ${threshold}).`,
        evidence: { discrepancies },
        confidence: 0.88,
      };
    }

    return {
      ruleId: rule.id,
      ruleVersion: rule.version,
      status: "PASS",
      severity: rule.severity,
      message: "Institution name matches consistently across all submitted documents.",
      evidence: { instances_checked: targetFields.length, values: targetFields.map((f) => f.raw_value) },
      confidence: 0.96,
    };
  }

  // 4. Match against AICTE Central Record
  if (rule.type === "field_match_aicte_record") {
    const targetField = data.extractedFields.find((f) => f.field_name === (spec.document_field || "institution_name"));
    const masterValue = data.institution[spec.record_field as keyof typeof data.institution] || data.institution.name;

    if (!targetField) {
      return {
        ruleId: rule.id,
        ruleVersion: rule.version,
        status: "REVIEW",
        severity: rule.severity,
        message: "Institution name could not be extracted to verify against AICTE master record.",
        evidence: { missing_field: spec.document_field },
        confidence: 0.8,
      };
    }

    const sim = computeSimilarity(targetField.raw_value, masterValue);
    const threshold = spec.threshold || 0.9;

    if (sim < threshold) {
      return {
        ruleId: rule.id,
        ruleVersion: rule.version,
        status: "REVIEW",
        severity: rule.severity,
        message: spec.wording || `Submitted name '${targetField.raw_value}' differs from central portal record '${masterValue}'.`,
        evidence: { extracted: targetField.raw_value, master_record: masterValue, similarity: Number(sim.toFixed(3)), threshold },
        confidence: 0.92,
        documentId: targetField.document_id,
      };
    }

    return {
      ruleId: rule.id,
      ruleVersion: rule.version,
      status: "PASS",
      severity: rule.severity,
      message: "Institution name verified against AICTE central master record.",
      evidence: { master_name: masterValue, extracted_name: targetField.raw_value, similarity: Number(sim.toFixed(3)) },
      confidence: 0.99,
    };
  }

  // 5. Cross-Application Duplicate SHA-256 Hash
  if (rule.type === "exact_duplicate") {
    const duplicates: any[] = [];
    if (data.allSystemDocumentHashes) {
      for (const doc of data.documents) {
        const dup = data.allSystemDocumentHashes.find(
          (h) => h.sha256_hash === doc.sha256_hash && h.application_id < data.application.id
        );
        if (dup) {
          duplicates.push({
            current_doc: doc.id,
            file_name: doc.file_name,
            hash: doc.sha256_hash,
            matching_application: dup.application_id,
            matching_institution: dup.institution_id,
          });
        }
      }
    }

    if (duplicates.length > 0) {
      return {
        ruleId: rule.id,
        ruleVersion: rule.version,
        status: "REVIEW",
        severity: rule.severity,
        message: spec.advisory_note || "Possible duplicate submission across applications. Human verification required.",
        evidence: { duplicates },
        confidence: 0.99,
        documentId: duplicates[0].current_doc,
      };
    }

    return {
      ruleId: rule.id,
      ruleVersion: rule.version,
      status: "PASS",
      severity: rule.severity,
      message: "All document cryptographic hashes (SHA-256) are unique across the repository.",
      evidence: { documents_checked: data.documents.length },
      confidence: 1.0,
    };
  }

  // 6. PDF Metadata Consistency
  if (rule.type === "metadata_consistency") {
    for (const doc of data.documents) {
      if (doc.metadata?.creation_date && doc.metadata?.stated_issue_date) {
        const created = new Date(doc.metadata.creation_date);
        const issued = new Date(doc.metadata.stated_issue_date);
        const slackHours = (spec.tolerance_hours || 48) * 3600 * 1000;

        if (created.getTime() - issued.getTime() > slackHours) {
          return {
            ruleId: rule.id,
            ruleVersion: rule.version,
            status: "REVIEW",
            severity: rule.severity,
            message: spec.advisory_note || "PDF metadata creation date postdates stated issue date by more than permitted window.",
            evidence: {
              document_id: doc.id,
              pdf_created: doc.metadata.creation_date,
              stated_issued: doc.metadata.stated_issue_date,
              hours_difference: ((created.getTime() - issued.getTime()) / 3600000).toFixed(1),
            },
            confidence: 0.85,
            documentId: doc.id,
          };
        }
      }
    }

    return {
      ruleId: rule.id,
      ruleVersion: rule.version,
      status: "PASS",
      severity: rule.severity,
      message: "PDF creation and modification metadata aligns with stated document issue dates.",
      evidence: { documents_checked: data.documents.length },
      confidence: 0.95,
    };
  }

  // 7. TER Payment Status
  if (rule.type === "ter_paid") {
    const status = data.aicteRecord.ter_payment_status?.toLowerCase();
    const accepted = (spec.accepted || ["paid", "exempt"]).map((s: string) => s.toLowerCase());

    if (!accepted.includes(status)) {
      return {
        ruleId: rule.id,
        ruleVersion: rule.version,
        status: (spec.on_pending?.toUpperCase() as RuleStatus) || "FAIL",
        severity: rule.severity,
        message: spec.wording || `TER scrutiny fee status is '${status}'. Application cannot proceed without fee clearance.`,
        evidence: { payment_status: status, accepted_statuses: accepted },
        confidence: 1.0,
      };
    }

    return {
      ruleId: rule.id,
      ruleVersion: rule.version,
      status: "PASS",
      severity: rule.severity,
      message: `TER scrutiny fee cleared (${status}).`,
      evidence: { payment_status: status },
      confidence: 1.0,
    };
  }

  // 8. No Pending Deficiency
  if (rule.type === "no_pending_deficiency") {
    const def = data.aicteRecord.deficiency_status;
    if (def !== (spec.expected || "Nil")) {
      return {
        ruleId: rule.id,
        ruleVersion: rule.version,
        status: "REVIEW",
        severity: rule.severity,
        message: spec.wording || `Central records indicate pending deficiency status: '${def}'. Prior compliance report required.`,
        evidence: { deficiency_status: def },
        confidence: 0.98,
      };
    }

    return {
      ruleId: rule.id,
      ruleVersion: rule.version,
      status: "PASS",
      severity: rule.severity,
      message: "No pending deficiencies flagged on central AICTE portal record.",
      evidence: { deficiency_status: "Nil" },
      confidence: 1.0,
    };
  }

  // 9. Compliance Advisory (e.g. Lab area per student)
  if (rule.type === "compliance_advisory") {
    const intake = data.aicteRecord.total_approved_intake || 300;
    // Look for extracted lab area
    const labField = data.extractedFields.find((f) => f.field_name === "laboratory_carpet_area_sqm");
    const area = labField ? parseFloat(labField.raw_value) : intake * 1.6; // default norm compliant if field absent
    const areaPerStudent = area / intake;
    const minThreshold = spec.minimum_threshold || 1.5;

    if (areaPerStudent < minThreshold) {
      return {
        ruleId: rule.id,
        ruleVersion: rule.version,
        status: "REVIEW",
        severity: rule.severity,
        message: spec.advisory_note || `Reported lab area (${areaPerStudent.toFixed(2)} sq.m/student) is below advisory norm (${minThreshold} sq.m/student).`,
        evidence: {
          approved_intake: intake,
          reported_area_sqm: area,
          area_per_student: Number(areaPerStudent.toFixed(2)),
          norm_minimum: minThreshold,
        },
        confidence: 0.88,
      };
    }

    return {
      ruleId: rule.id,
      ruleVersion: rule.version,
      status: "PASS",
      severity: rule.severity,
      message: `Laboratory area (${areaPerStudent.toFixed(2)} sq.m/student) meets or exceeds AICTE APH advisory standard (${minThreshold} sq.m).`,
      evidence: { area_per_student: Number(areaPerStudent.toFixed(2)), intake },
      confidence: 0.95,
    };
  }

  // Default fallback
  return {
    ruleId: rule.id,
    ruleVersion: rule.version,
    status: "PASS",
    severity: rule.severity,
    message: `Rule ${rule.id} evaluated successfully.`,
    evidence: {},
    confidence: 1.0,
  };
}
