CREATE TABLE IF NOT EXISTS public.ai_knowledge_documents (
  id text PRIMARY KEY, organization_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, title text NOT NULL, source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ai_knowledge_chunks (
  id text PRIMARY KEY, document_id text NOT NULL REFERENCES public.ai_knowledge_documents(id) ON DELETE CASCADE,
  organization_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, chunk_index integer NOT NULL,
  content text NOT NULL, search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english',content)) STORED,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(document_id,chunk_index)
);
CREATE INDEX IF NOT EXISTS ai_knowledge_chunks_search_idx ON public.ai_knowledge_chunks USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS ai_knowledge_chunks_org_idx ON public.ai_knowledge_chunks(organization_id,document_id);
