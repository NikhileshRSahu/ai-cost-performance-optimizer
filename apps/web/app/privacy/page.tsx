import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy | Evalomics',
  description:
    'How the Evalomics free launch beta handles usage evidence, retention, deletion, and connected-source boundaries.',
};

export default function PrivacyPage() {
  return (
    <div className="landing-stack legal-page">
      <section className="hero hero-wide">
        <p className="eyebrow">Launch beta privacy notice</p>
        <h1>Use the minimum evidence needed.</h1>
        <p className="lede">
          Evalomics is designed around progressive access. The CSV-first launch beta
          can provide useful analysis without provider admin credentials,
          mailbox access, drive access, or raw prompt content.
        </p>
        <div className="evidence-note">
          <strong>Beta transparency:</strong> this notice describes the current
          product behavior and data boundaries for the free launch beta. Product
          and legal terms may be updated as Evalomics moves toward general
          availability.
        </div>
      </section>

      <section className="legal-sections" aria-label="Privacy commitments">
        <article>
          <h2>What the CSV pilot accepts</h2>
          <p>
            Customer-supplied usage evidence such as timestamps, provider,
            model, token counts, measured cost, latency, retries, outcomes,
            workload identifiers, and other fields explicitly present in the
            uploaded evidence.
          </p>
        </article>
        <article>
          <h2>What is not required to start</h2>
          <p>
            Evalomics does not require provider admin keys, Gmail, Google Drive,
            Slack, or other workspace connectors for the CSV-first pilot. Those
            integrations remain gated and must not be represented as available.
          </p>
        </article>
        <article>
          <h2>Prompt and response content</h2>
          <p>
            Raw prompt and response bodies are not required for usage MRI
            analysis. A separate sanitized-history workflow may analyze content
            deliberately supplied by the customer after redaction. Product
            logging must not record raw prompt or response bodies.
          </p>
        </article>
        <article>
          <h2>Retention and deletion</h2>
          <p>
            Organization owners can export organization evidence, preview raw
            evidence affected by retention rules, enforce configured raw-data
            retention, and explicitly purge organization evidence. Decision and
            audit records are preserved only where the product's documented
            lifecycle requires them.
          </p>
        </article>
        <article>
          <h2>Training</h2>
          <p>
            Evalomics is not designed to train a shared model on customer
            evidence. Customer evidence is processed to provide the requested
            analysis, benchmark, implementation, verification, and audit
            workflow.
          </p>
        </article>
        <article>
          <h2>Operational logs</h2>
          <p>
            Logs are limited to safe categorical events and non-sensitive
            identifiers. Credentials, authorization headers, uploaded CSV rows,
            connector tokens, and unrestricted exception bodies must not be
            logged.
          </p>
        </article>
        <article>
          <h2>Evidence and claim boundaries</h2>
          <p>
            Public research, synthetic demos, benchmark results, projections,
            and customer-verified results remain distinct. Missing evidence is
            treated as unknown rather than silently converted to zero.
          </p>
        </article>
        <article>
          <h2>Connected sources</h2>
          <p>
            Workspace connectors and provider-admin credentials remain outside
            the CSV pilot until least-privilege authorization, encrypted secret
            storage, revocation, rotation, deletion controls, and connector
            threat-model reviews pass their release gates.
          </p>
        </article>
      </section>
    </div>
  );
}
