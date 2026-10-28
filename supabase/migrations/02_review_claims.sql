-- ==============================================================================
-- ScrutiniX AICTE Scrutiny Suite — Review Claims (02_review_claims.sql)
-- Academic Year 2026–27 | Officer Review Queue Claim State
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.review_claims (
  item_key TEXT PRIMARY KEY,
  officer_name TEXT NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.review_claims ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'review_claims' AND policyname = 'review_claims_all'
  ) THEN
    CREATE POLICY review_claims_all ON public.review_claims
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
