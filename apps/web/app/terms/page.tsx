import TrustPage from '@/components/TrustPage';

export default function TermsPage(){return <TrustPage eyebrow="TERMS" title="Terms of Early Access" updated="September 20, 2026">
  <h2>Service scope</h2>
  <p>Evalomics analyzes AI usage and cost evidence and can suggest experiments or optimization opportunities. Potential and Tested values are not guaranteed savings.</p>
  <h2>Customer responsibility</h2>
  <p>You remain responsible for production changes, provider credentials, data you upload, quality requirements, and deciding whether to act on any recommendation.</p>
  <h2>No automatic production control</h2>
  <p>Evalomics does not change production traffic merely because it detects an opportunity. Production changes require explicit customer action or approval.</p>
  <h2>Evidence labels</h2>
  <p>Observed describes measured evidence. Potential describes an estimate or hypothesis. Tested describes measured experiment evidence. Verified is reserved for production-reconciled evidence that satisfies the verification workflow.</p>
  <h2>Early-access availability</h2>
  <p>The service is provided during an early-access period and may change as reliability, provider integrations, billing, and support processes mature.</p>
  <h2>Limitation</h2>
  <p>Evalomics is an engineering and financial-analysis tool, not legal, tax, accounting, or investment advice. Customers should validate material decisions using their own controls.</p>
</TrustPage>}