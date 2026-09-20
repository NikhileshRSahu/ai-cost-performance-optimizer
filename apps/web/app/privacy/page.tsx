import TrustPage from '@/components/TrustPage';

export default function PrivacyPage(){return <TrustPage eyebrow="PRIVACY" title="Privacy Policy" updated="September 20, 2026">
  <h2>What Evalomics processes</h2>
  <p>Evalomics processes account identity, workspace settings, usage exports, provider usage/cost evidence, and product interaction records needed to operate the service.</p>
  <h2>Provider credentials</h2>
  <p>Provider admin credentials are encrypted before storage and are not displayed back to users. Evalomics uses them only to request the usage and cost evidence needed for the connected workspace.</p>
  <h2>AI reasoning</h2>
  <p>When AI reasoning is available, Evalomics sends only sanitized workspace context needed to answer the user’s question. Provider credentials are not included in model context. Deterministic spend, evidence state, and Verified savings remain controlled by the evidence engine.</p>
  <h2>Demo separation</h2>
  <p>The public sample workspace is separate from customer workspaces. Production backend constraints prevent demo records from being written into customer evidence tables.</p>
  <h2>Retention and deletion</h2>
  <p>Workspace owners can remove connected providers and delete imported usage/evidence from Settings. Account and membership records may be retained to preserve authentication and workspace ownership unless the account itself is closed through support.</p>
  <h2>Early access</h2>
  <p>Evalomics is currently offered as an early-access product. This policy will be updated as additional processors, regions, or commercial features are added.</p>
</TrustPage>}