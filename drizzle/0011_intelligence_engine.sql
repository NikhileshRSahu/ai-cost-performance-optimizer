CREATE TABLE IF NOT EXISTS public.ai_invocation_tokens (
  token_hash text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('COPILOT','IMPORT_DOCTOR')),
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_invocation_tokens_expiry_idx ON public.ai_invocation_tokens(expires_at);

CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  question text,
  answer jsonb,
  model text,
  status text NOT NULL CHECK (status IN ('STARTED','COMPLETED','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS ai_interactions_org_created_idx ON public.ai_interactions(organization_id,created_at DESC);
