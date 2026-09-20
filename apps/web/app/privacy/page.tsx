import Link from 'next/link';
import TrustPage from '@/components/TrustPage';

export default function PrivacyPage(){return <TrustPage eyebrow="PRIVACY" title="Privacy Policy" updated="September 20, 2026">
  <h2>Who controls the data</h2>
  <p>For self-serve early-access accounts, Evalomics acts as the service operator for account and product-operation data. For business customers with a signed order, pilot agreement, or data-processing agreement, that signed document controls where it says otherwise. Questions about the responsible entity or a DPA can be submitted through Support before production onboarding.</p>

  <h2>What Evalomics processes</h2>
  <p>Evalomics can process account identity, workspace membership and settings, usage exports, provider usage and cost evidence, support requests, audit events, and product interaction records needed to operate, secure, troubleshoot, and improve the service. The CSV-first workflow does not require raw prompt or response content.</p>

  <h2>Why the data is processed</h2>
  <p>Data is used to provide the requested analysis, authenticate users, protect tenant boundaries, support customers, detect abuse, maintain reliability, and improve the product. The applicable legal basis depends on the customer relationship and jurisdiction and may include performing a contract, legitimate operational interests, or consent where required.</p>

  <h2>Provider credentials</h2>
  <p>Provider admin credentials are encrypted before storage and are not displayed back to users. Evalomics uses them only for the connected workspace and requested integration functions. Workspace owners can revoke a provider connection.</p>

  <h2>AI reasoning</h2>
  <p>When AI reasoning is available, Evalomics sends only sanitized workspace context needed to answer the user’s question. Provider credentials are not included in model context. Deterministic spend, evidence state, and Verified savings remain controlled by the evidence engine.</p>

  <h2>Subprocessors and international processing</h2>
  <p>Infrastructure and identity providers may process service data in regions outside the customer’s country. The current service-provider list is published on the <Link href="/subprocessors">Subprocessors page</Link>. Customers that require specific transfer terms or a DPA should request review before connecting sensitive production evidence.</p>

  <h2>Retention and deletion</h2>
  <p>Workspace evidence is retained while the workspace needs it for the service, unless an owner deletes that evidence or closes the relevant workspace. Provider credentials are retained only while the connection remains active. Support and security records may be retained longer when reasonably necessary to resolve a request, prevent abuse, meet legal obligations, or preserve an audit trail. Deleted primary records can remain temporarily in infrastructure recovery systems until the applicable recovery window expires.</p>

  <h2>Exports and customer control</h2>
  <p>Workspace owners can disconnect providers and delete imported usage/evidence through the product where those controls are available. Organization-scoped exports include the customer records covered by the export workflow. For account closure, data-access requests, correction requests, or a DPA request, use the Support page.</p>

  <h2>Security and demo separation</h2>
  <p>The public sample workspace is separate from customer workspaces. Production backend constraints prevent demo records from being written into customer evidence tables. Evalomics uses tenant-scoped authorization, encrypted provider credentials, HTTPS, and evidence-state controls as described in the Trust Center.</p>

  <h2>Early access and policy changes</h2>
  <p>Evalomics is currently an early-access product. This policy can change as processors, regions, legal entities, or commercial features change. Material changes should be reflected here before they are relied on for new customer processing.</p>
</TrustPage>}