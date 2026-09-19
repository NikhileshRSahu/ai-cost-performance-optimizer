import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy | Evalomics',
  description:
    'How the Evalomics free launch beta handles usage evidence, provider connections, retention, deletion, and claim boundaries.',
};

export default function PrivacyPage() {
  return (
    <div className="landing-stack legal-page">
      <section className="hero hero-wide">
        <p className="eyebrow">Launch beta privacy notice</p>
        <h1>Use the minimum evidence needed.</h1>
        <p className="lede">
          Evalomics is designed around progressive access. You can start with a
          usage CSV, or optionally connect supported OpenAI or Anthropic
          organization usage through an Admin API key. Mailbox, drive, Slack,
          and raw prompt content are not required for the core usage-analysis
          flow.
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
          <h2>What the launch beta accepts</h2>
          <p>
            Evalomics accepts customer-supplied usage CSVs and, when you choose
            a supported provider connection, organization-level OpenAI or
            Anthropic usage and cost evidence. Analysis uses fields that are
            present and supported rather than silently inventing missing data.
          </p>
        </article>
        <article>
          <h2>What is not required to start</h2>
          <p>
            CSV analysis does not require a provider key. A provider Admin API
            key is only required when you explicitly choose an OpenAI or
            Anthropic connection. Gmail, Google Drive, Slack, and other
            workspace connectors are not part of the current core analysis flow.
          </p>
        </article>
        <article>
          <h2>Prompt and response content</h2>
          <p>
            Raw prompt and response bodies are not requested by the supported
            organization-usage connections and are not required for the core
            usage MRI. A separate sanitized-history workflow may analyze content
            deliberately supplied by the customer after redaction.
          </p>
        </article>
        <article>
          <h2>Provider credentials</h2>
          <p>
            Supported provider Admin API keys are encrypted before persistence
            and used to validate or sync the selected organization connection.
            Disconnecting a provider revokes the connection and clears the
            stored credential ciphertext. Previously imported evidence can
            remain available to the workspace.
          </p>
        </article>
        <article>
          <h2>Retention and deletion</h2>
          <p>
            Organization owners can export organization evidence, preview raw
            evidence affected by retention rules, enforce configured raw-data
            retention, and explicitly purge organization evidence. Decision and
            audit records are preserved only where the product&apos;s documented
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
            Product logging is designed to avoid credentials, authorization
            headers, uploaded CSV rows, connector tokens, and unrestricted raw
            prompt or response bodies. Operational events use bounded,
            non-sensitive identifiers and categories.
          </p>
        </article>
        <article>
          <h2>Evidence and claim boundaries</h2>
          <p>
            Public research, synthetic demos, modeled opportunities, benchmark
            results, and customer-verified production results remain distinct.
            Missing evidence is treated as unknown rather than silently
            converted to zero.
          </p>
        </article>
        <article>
          <h2>Connected sources</h2>
          <p>
            OpenAI and Anthropic organization-usage connections are supported in
            the current beta. Other workspace connectors remain unavailable
            unless they are separately released with explicit authorization and
            documented data boundaries.
          </p>
        </article>
      </section>
    </div>
  );
}
