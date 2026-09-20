import TrustPage from '@/components/TrustPage';

export default function SubprocessorsPage(){return <TrustPage eyebrow="PRIVACY" title="Subprocessors and service providers" updated="September 20, 2026">
  <p>Evalomics uses a small set of infrastructure and identity providers to operate the service. This page is the current public list for early access.</p>
  <h2>Vercel</h2>
  <p>Purpose: application hosting, delivery, runtime logs, and privacy-conscious product analytics. Data involved can include request metadata and product interaction events.</p>
  <h2>Neon</h2>
  <p>Purpose: PostgreSQL database infrastructure and related backend services. Customer workspace evidence and application records are stored in the configured Neon project.</p>
  <h2>Google</h2>
  <p>Purpose: OAuth authentication when a user chooses Google sign-in. Evalomics receives the identity fields needed to establish the account session.</p>
  <h2>Customer-connected AI providers</h2>
  <p>OpenAI and Anthropic endpoints are contacted only for the product capabilities the customer explicitly connects or invokes. Provider credentials are handled server-side and are not rendered back to the browser.</p>
  <h2>Changes</h2>
  <p>Material changes to this list should be reflected here before new processors are used for customer evidence. Enterprise customers can request a current security and data-flow review before onboarding.</p>
</TrustPage>}
