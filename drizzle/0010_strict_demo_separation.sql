-- Evalomics backend invariant: the public demo is never persisted in the production tenant database.
-- The demo lives in application fixture code only. Production tables may contain customer evidence only.

DELETE FROM public.provider_evidence_snapshots WHERE is_demo = true;
DELETE FROM public.ledger_events
WHERE recommendation_id IN (SELECT id FROM public.recommendations WHERE is_demo = true);
DELETE FROM public.verification_windows
WHERE recommendation_id IN (SELECT id FROM public.recommendations WHERE is_demo = true);
DELETE FROM public.implementation_records
WHERE recommendation_id IN (SELECT id FROM public.recommendations WHERE is_demo = true);
DELETE FROM public.recommendations WHERE is_demo = true;
DELETE FROM public.usage_records
WHERE import_run_id IN (SELECT id FROM public.import_runs WHERE is_demo = true);
DELETE FROM public.usage_records WHERE is_demo = true;
DELETE FROM public.import_runs WHERE is_demo = true;

ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_no_demo_backend_ck;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_no_demo_backend_ck CHECK (is_demo = false);

ALTER TABLE public.import_runs DROP CONSTRAINT IF EXISTS import_runs_no_demo_backend_ck;
ALTER TABLE public.import_runs ADD CONSTRAINT import_runs_no_demo_backend_ck CHECK (is_demo = false);

ALTER TABLE public.usage_records DROP CONSTRAINT IF EXISTS usage_records_no_demo_backend_ck;
ALTER TABLE public.usage_records ADD CONSTRAINT usage_records_no_demo_backend_ck CHECK (is_demo = false);

ALTER TABLE public.recommendations DROP CONSTRAINT IF EXISTS recommendations_no_demo_backend_ck;
ALTER TABLE public.recommendations ADD CONSTRAINT recommendations_no_demo_backend_ck CHECK (is_demo = false);

ALTER TABLE public.provider_evidence_snapshots DROP CONSTRAINT IF EXISTS provider_snapshots_no_demo_backend_ck;
ALTER TABLE public.provider_evidence_snapshots ADD CONSTRAINT provider_snapshots_no_demo_backend_ck CHECK (is_demo = false);
