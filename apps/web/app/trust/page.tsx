import Link from 'next/link';
import TrustPage from '@/components/TrustPage';

export default function TrustPageRoute(){return <TrustPage eyebrow="TRUST CENTER" title="Current Evalomics assurance status" updated="September 20, 2026">
  <h2>What is production-ready today</h2>
  <p>Customer workspaces are tenant-scoped. Provider credentials are encrypted before storage. Public demo records are separated from customer evidence. Usage imports are validated before analysis, and Verified savings are controlled by deterministic evidence logic rather than language-model output.</p>
  <h2>Access control</h2>
  <p>Workspace owners control provider credentials and destructive evidence deletion. Operators can work with usage and knowledge evidence. Viewers are read-only for those mutation paths.</p>
  <h2>Current integration status</h2>
  <p>CSV ingestion is production-tested. OpenAI API organization usage/cost connectivity is implemented and has completed authenticated sync attempts. Anthropic Admin API remains beta until a real Admin connection completes end-to-end production verification.</p>
  <h2>AI availability</h2>
  <p>Evalomics keeps deterministic evidence available when generative reasoning is unavailable. The AI layer cannot promote an estimate into Verified savings.</p>
  <h2>Enterprise readiness</h2>
  <p>Evalomics is early access. SOC 2 certification and enterprise SSO are not currently claimed. Procurement teams should evaluate the documented controls against their requirements before using Evalomics with sensitive workloads.</p>
  <h2>Evidence and auditability</h2>
  <p>Recommendation state transitions are retained in a tenant-scoped evidence ledger and are visible to signed-in workspaces through the audit trail. Potential, Tested, and Verified remain distinct states.</p>
  <h2>Need a security review?</h2>
  <p>Use the in-product support form or the support page to request a technical review before connecting production evidence.</p>
  <p><Link className="btn black" href="/security">Read security details</Link> <Link className="btn outline" href="/support">Contact support</Link></p>
</TrustPage>}
