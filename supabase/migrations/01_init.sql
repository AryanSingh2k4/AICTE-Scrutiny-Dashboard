-- ==============================================================================
-- ScrutiniX AICTE Scrutiny Suite — Core Database Migration (01_init.sql)
-- Academic Year 2026–27 | Decision Support Only
-- ==============================================================================

-- Enable cryptographic and text extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Profiles & Roles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('institution', 'scrutiny_officer', 'senior_officer', 'auditor')),
  institution_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Institutions
CREATE TABLE IF NOT EXISTS public.institutions (
  id TEXT PRIMARY KEY, -- e.g. '1-3324567891'
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  established_year INT NOT NULL,
  trust_society TEXT NOT NULL,
  principal_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AICTE Central Portal Records (Pre-existing ground truth records)
CREATE TABLE IF NOT EXISTS public.aicte_records (
  institution_id TEXT PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
  approved_programmes TEXT[] NOT NULL DEFAULT '{}',
  total_approved_intake INT NOT NULL DEFAULT 0,
  faculty_count INT NOT NULL DEFAULT 0,
  deficiency_status TEXT NOT NULL DEFAULT 'Nil' CHECK (deficiency_status IN ('Nil', 'Pending', 'Deficient')),
  ter_payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (ter_payment_status IN ('paid', 'pending', 'exempt')),
  last_eoa_year TEXT NOT NULL DEFAULT '2025-26',
  last_scrutiny_status TEXT NOT NULL DEFAULT 'Approved',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Applications (EoA Renewal applications)
-- System status is strictly decision-support; outcomes reside ONLY in officer_decisions.
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY, -- e.g. 'APP-2026-8941'
  institution_id TEXT NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL DEFAULT '2026-27',
  application_category TEXT NOT NULL DEFAULT 'EoA Renewal',
  system_status TEXT NOT NULL DEFAULT 'submitted' CHECK (system_status IN ('submitted', 'processing', 'findings_available', 'ready_for_review')),
  overall_risk_score NUMERIC(3,2) DEFAULT 0.00,
  flags_count INT DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Documents (Supporting submissions)
CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY, -- e.g. 'DOC-APP-2026-8941-AFF'
  application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('affidavit', 'noc_university', 'accreditation_nba', 'fire_safety', 'land_ownership')),
  file_name TEXT NOT NULL,
  file_size INT NOT NULL DEFAULT 0,
  storage_path TEXT,
  sha256_hash TEXT NOT NULL,
  phash TEXT,
  qr_payload TEXT,
  is_scanned BOOLEAN DEFAULT FALSE,
  ocr_text TEXT,
  page_count INT DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Extracted Fields (Deterministic regex and OCR extractions)
CREATE TABLE IF NOT EXISTS public.extracted_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  raw_value TEXT NOT NULL,
  normalized_value TEXT,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  page_number INT DEFAULT 1,
  bbox JSONB, -- { x, y, width, height }
  source TEXT DEFAULT 'unpdf_layer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Rules (Configurable regulatory engine; no hardcoded law)
CREATE TABLE IF NOT EXISTS public.rules (
  id TEXT PRIMARY KEY, -- e.g. 'EOA-DOC-01'
  academic_year TEXT NOT NULL DEFAULT '2026-27',
  version TEXT NOT NULL DEFAULT '1.4',
  "group" TEXT NOT NULL, -- Completeness, Validity, Consistency, Records, Integrity, Compliance
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  active BOOLEAN DEFAULT TRUE,
  rule_spec JSONB NOT NULL,
  evaluations INT DEFAULT 0,
  failures INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Validation Results (Rule execution findings)
CREATE TABLE IF NOT EXISTS public.validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_id TEXT REFERENCES public.documents(id) ON DELETE SET NULL,
  rule_id TEXT NOT NULL REFERENCES public.rules(id) ON DELETE CASCADE,
  rule_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PASS', 'FAIL', 'REVIEW')),
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  confidence NUMERIC(3,2) DEFAULT 1.00,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Anomaly Flags (Preliminary advisory flags; never 'forgery' conclusion)
CREATE TABLE IF NOT EXISTS public.anomaly_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_id TEXT REFERENCES public.documents(id) ON DELETE SET NULL,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.80,
  reason TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  bbox JSONB,
  page_number INT DEFAULT 1,
  flagged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Verification Results (Original Issuing Authority verification)
CREATE TABLE IF NOT EXISTS public.verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  issuer_name TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('qr_payload', 'reference_lookup', 'portal_api')),
  status TEXT NOT NULL CHECK (status IN ('not_started', 'verification_pending', 'verified', 'mismatch_detected', 'expired', 'source_unavailable', 'manual_review_required')),
  request_payload JSONB DEFAULT '{}',
  response_payload JSONB DEFAULT '{}',
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Processing Events (Realtime pipeline progress)
CREATE TABLE IF NOT EXISTS public.processing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_id TEXT REFERENCES public.documents(id) ON DELETE SET NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),
  progress_percent INT DEFAULT 0,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Alerts (Realtime scrutiny alert broadcast)
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Officer Decisions (Recorded exclusively by authorized officers)
CREATE TABLE IF NOT EXISTS public.officer_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  officer_id TEXT NOT NULL,
  officer_name TEXT NOT NULL,
  officer_role TEXT NOT NULL CHECK (officer_role IN ('scrutiny_officer', 'senior_officer')),
  outcome TEXT NOT NULL CHECK (outcome IN ('accept', 'request_clarification', 'refer_for_inspection', 'reject')),
  remarks TEXT NOT NULL,
  conditions JSONB DEFAULT '[]',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Audit Log (Append-only SHA-256 hash-chained log)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  sequence_number BIGINT NOT NULL,
  prev_hash TEXT NOT NULL,
  current_hash TEXT NOT NULL,
  actor TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Mock Issuer Behaviour (Deterministic mock adapter registry)
CREATE TABLE IF NOT EXISTS public.mock_issuer_behaviour (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_code TEXT NOT NULL,
  reference_number TEXT NOT NULL,
  simulated_status TEXT NOT NULL,
  response_payload JSONB NOT NULL DEFAULT '{}',
  delay_ms INT DEFAULT 0
);

-- Indexes for lightning-fast scrutiny queries
CREATE INDEX IF NOT EXISTS idx_applications_institution ON public.applications(institution_id);
CREATE INDEX IF NOT EXISTS idx_documents_application ON public.documents(application_id);
CREATE INDEX IF NOT EXISTS idx_extracted_fields_doc ON public.extracted_fields(document_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_app ON public.validation_results(application_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_flags_app ON public.anomaly_flags(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_seq ON public.audit_log(sequence_number);
CREATE INDEX IF NOT EXISTS idx_processing_events_app ON public.processing_events(application_id);
CREATE INDEX IF NOT EXISTS idx_alerts_app ON public.alerts(application_id);

-- Enforce append-only integrity on audit_log
REVOKE UPDATE, DELETE ON public.audit_log FROM PUBLIC, anon, authenticated;

-- Function: append_audit
CREATE OR REPLACE FUNCTION public.append_audit(
  p_actor TEXT,
  p_actor_role TEXT,
  p_action TEXT,
  p_entity TEXT,
  p_entity_id TEXT,
  p_payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_hash TEXT;
  v_next_seq BIGINT;
  v_new_hash TEXT;
  v_inserted_id BIGINT;
BEGIN
  -- Obtain advisory lock to serialize audit log appends
  PERFORM pg_advisory_xact_lock(42424242);

  SELECT current_hash, sequence_number
  INTO v_last_hash, v_next_seq
  FROM public.audit_log
  ORDER BY id DESC
  LIMIT 1;

  IF v_last_hash IS NULL THEN
    v_last_hash := '0000000000000000000000000000000000000000000000000000000000000000';
    v_next_seq := 1;
  ELSE
    v_next_seq := v_next_seq + 1;
  END IF;

  -- Compute current hash = sha256(prev_hash || sequence || fields...)
  v_new_hash := encode(digest(
    v_last_hash ||
    v_next_seq::TEXT ||
    p_actor ||
    p_actor_role ||
    p_action ||
    p_entity ||
    p_entity_id ||
    p_payload::TEXT,
    'sha256'
  ), 'hex');

  INSERT INTO public.audit_log (
    sequence_number,
    prev_hash,
    current_hash,
    actor,
    actor_role,
    action,
    entity,
    entity_id,
    payload,
    created_at
  ) VALUES (
    v_next_seq,
    v_last_hash,
    v_new_hash,
    p_actor,
    p_actor_role,
    p_action,
    p_entity,
    p_entity_id,
    p_payload,
    NOW()
  )
  RETURNING id INTO v_inserted_id;

  RETURN v_inserted_id;
END;
$$;

-- Function: verify_audit_chain
CREATE OR REPLACE FUNCTION public.verify_audit_chain()
RETURNS TABLE (
  status TEXT,
  first_broken_id BIGINT,
  total_entries INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  v_expected_prev TEXT := '0000000000000000000000000000000000000000000000000000000000000000';
  v_expected_hash TEXT;
  v_count INT := 0;
BEGIN
  FOR r IN SELECT * FROM public.audit_log ORDER BY sequence_number ASC LOOP
    v_count := v_count + 1;

    -- Check if prev_hash matches
    IF r.prev_hash != v_expected_prev THEN
      RETURN QUERY SELECT 'corrupted'::TEXT, r.id, v_count;
      RETURN;
    END IF;

    -- Recompute expected current hash
    v_expected_hash := encode(digest(
      r.prev_hash ||
      r.sequence_number::TEXT ||
      r.actor ||
      r.actor_role ||
      r.action ||
      r.entity ||
      r.entity_id ||
      r.payload::TEXT,
      'sha256'
    ), 'hex');

    IF r.current_hash != v_expected_hash THEN
      RETURN QUERY SELECT 'corrupted'::TEXT, r.id, v_count;
      RETURN;
    END IF;

    v_expected_prev := r.current_hash;
  END LOOP;

  RETURN QUERY SELECT 'ok'::TEXT, NULL::BIGINT, v_count;
END;
$$;

-- Seed default initial audit anchor
SELECT public.append_audit(
  'system',
  'system',
  'INIT_SCHEMA',
  'database',
  'scrutinix-db',
  jsonb_build_object('release', 'AY 2026-27', 'mode', 'advisory_decision_support')
);
