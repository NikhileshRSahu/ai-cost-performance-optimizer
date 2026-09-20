import TrustPage from '@/components/TrustPage';

export default function SecurityPage(){return <TrustPage eyebrow="SECURITY" title="How Evalomics handles customer evidence" updated="September 20, 2026">
  <h2>Tenant isolation</h2>
  <p>Production data is scoped by workspace organization. The public demo does not share its backend records with customer workspaces.</p>
  <h2>Credential handling</h2>
  <p>OpenAI and Anthropic Admin credentials are encrypted before storage. They are used server-side for provider synchronization and are never returned in workspace APIs or rendered back to the browser.</p>
  <h2>Read-only ingestion</h2>
  <p>Provider integrations are designed to read organization usage and cost evidence. Evalomics does not need permission to modify customer model traffic in order to analyze usage.</p>
  <h2>Evidence integrity</h2>
  <p>The language-model layer cannot write Verified savings. Observed, Tested, and Verified states are determined by deterministic application logic and persisted evidence.</p>
  <h2>Deletion</h2>
  <p>Workspace owners can disconnect provider credentials and delete imported usage/evidence. The product requires explicit confirmation before destructive evidence deletion.</p>
  <h2>Current integration status</h2>
  <p>CSV ingestion and OpenAI API connectivity are production-tested. Anthropic Admin API support is currently beta until a real customer Admin connection completes an end-to-end production sync.</p>
</TrustPage>}