import Link from 'next/link';
import TrustPage from '@/components/TrustPage';

export default function SupportPage(){return <TrustPage eyebrow="SUPPORT" title="Early-access support" updated="September 20, 2026">
  <h2>Fastest path</h2>
  <p>For pilot users, support is founder-led. Reply to the onboarding or pilot conversation that invited you to Evalomics and include the workspace name plus what you expected to happen.</p>
  <h2>Before reporting an import issue</h2>
  <p>Use Import Doctor first. Include the accepted/rejected row counts and the issue code shown in the product. Do not send provider secrets in a support message.</p>
  <h2>Provider problems</h2>
  <p>OpenAI and Anthropic connections require organization-level Admin usage/cost access. Personal ChatGPT or Claude consumer usage is not what these connectors read.</p>
  <h2>Need to remove data?</h2>
  <p>Open workspace Settings to disconnect providers or delete imported usage/evidence. If account-level removal is needed, request it through the same pilot support channel.</p>
  <p><Link className="btn black" href="/auth/sign-in">Open my workspace</Link></p>
</TrustPage>}
