import Link from 'next/link';
import TrustPage from '@/components/TrustPage';

export default function TermsPage(){return <TrustPage eyebrow="TERMS" title="Terms of Early Access" updated="September 20, 2026">
  <h2>Service scope</h2>
  <p>Evalomics analyzes AI usage and cost evidence and can identify optimization opportunities, support controlled tests, and reconcile post-change evidence. Potential and Tested values are not guaranteed savings. Verified is reserved for production-reconciled evidence that satisfies the verification workflow.</p>

  <h2>Accounts and authorized use</h2>
  <p>You are responsible for keeping account access secure, using the service only for data and systems you are authorized to access, and ensuring workspace members have appropriate permissions. You must not use Evalomics to probe, disrupt, or access another customer’s workspace or systems.</p>

  <h2>Customer data and ownership</h2>
  <p>You retain ownership of data you provide. You grant Evalomics the limited rights needed to host, process, secure, and analyze that data to provide the service. Evalomics retains ownership of the service, its software, product design, methods, and non-customer-specific improvements.</p>

  <h2>Customer responsibility</h2>
  <p>You remain responsible for production changes, provider credentials, uploaded data, quality requirements, regulatory obligations, and deciding whether to act on any recommendation. Evalomics does not change production traffic merely because it detects an opportunity.</p>

  <h2>Fees, invoices, and refunds</h2>
  <p>Free-beta features have no subscription charge. Any paid design-partner work, pilot, or other commercial service is governed by the price, scope, payment due date, cancellation terms, and refund terms shown in the applicable order or invoice. No percentage of estimated savings is charged unless a separate signed agreement explicitly says so.</p>

  <h2>Availability and changes</h2>
  <p>The service is provided during early access and may change. Evalomics may suspend a feature or account when reasonably necessary for security, abuse prevention, legal compliance, maintenance, or protection of other customers. Where practical, customer-facing changes should preserve access to customer-owned evidence and exports.</p>

  <h2>Termination and data handling</h2>
  <p>You may stop using the service and remove supported workspace evidence using product controls. Paid engagements can be terminated according to their order or pilot agreement. Data deletion and residual recovery copies are handled as described in the <Link href="/privacy">Privacy Policy</Link>.</p>

  <h2>Warranty and decision limits</h2>
  <p>Early-access features are provided on an as-available basis. Evalomics does not promise uninterrupted operation, a particular savings amount, or that every recommendation will be appropriate for every workload. Evalomics is an engineering and financial-analysis tool, not legal, tax, accounting, investment, or regulatory advice.</p>

  <h2>Commercial liability and governing terms</h2>
  <p>For paid B2B engagements, any negotiated liability allocation, governing law, dispute venue, service warranty, DPA, or procurement terms must be stated in the signed order, pilot agreement, or other executed commercial document. Evalomics does not claim that this public early-access page alone satisfies an enterprise customer’s procurement requirements.</p>

  <h2>Security and acceptable evidence use</h2>
  <p>Customers should avoid uploading secrets or data that are unnecessary for the requested analysis. Security details and current assurance status are available in the <Link href="/trust">Trust Center</Link> and <Link href="/security">Security page</Link>.</p>
</TrustPage>}