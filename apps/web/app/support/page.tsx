import Link from 'next/link';
import TrustPage from '@/components/TrustPage';

export default function SupportPage(){return <TrustPage eyebrow="SUPPORT" title="Early-access support" updated="September 20, 2026">
  <h2>Fastest path</h2>
  <p>For pilot users, support is founder-led. Email <a href="mailto:nikhilesh2003sahu@gmail.com">nikhilesh2003sahu@gmail.com</a> and include the workspace name, what you expected to happen, and any visible error code. Do not send provider secrets.</p>
  <h2>Before reporting an import issue</h2>
  <p>Use Import Doctor first. Include the accepted/rejected row counts and the issue code shown in the product. Do not send provider secrets in a support message.</p>
  <h2>Provider problems</h2>
  <p>OpenAI and Anthropic connections require organization-level Admin usage/cost access. Personal ChatGPT or Claude consumer usage is not what these connectors read.</p>
  <h2>Need to remove data?</h2>
  <p>Open workspace Settings to disconnect providers or delete imported usage/evidence. If account-level removal is needed, email support from the address used to sign in.</p>
  <p><a className="btn black" href="mailto:nikhilesh2003sahu@gmail.com?subject=Evalomics%20support">Email support</a> <Link className="btn outline" href="/auth/sign-in">Open my workspace</Link></p>
</TrustPage>}
