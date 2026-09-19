import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Security | Evalomics',
  description:
    'Security model and release boundaries for the Evalomics free launch beta.',
};

export default function SecurityPage() {
  return (
    <div className="landing-stack legal-page">
      <section className="hero hero-wide">
        <p className="eyebrow">Security model</p>
        <h1>Trust is a release gate, not a marketing claim.</h1>
        <p className="lede">
          Evalomics keeps the launch beta deliberately bounded. CSV analysis
          and supported OpenAI or Anthropic organization-usage connections are
          available; broader workspace connectors and automatic production
          changes remain outside the current product boundary.
        </p>
      </section>

      <section className="privacy-levels" aria-label="Security controls">
        <article>
          <span>AUTH</span>
          <strong>Session-derived authorization</strong>
          <p>
            Google sign-in maps verified identities into tenant-scoped
            membership roles. OWNER, OPERATOR, and VIEWER permissions are
            enforced by the application authorization model.
          </p>
        </article>
        <article>
          <span>TENANCY</span>
          <strong>Organization isolation</strong>
          <p>
            Persistence and browser tests cover tenant access boundaries,
            including cross-organization denial.
          </p>
        </article>
        <article>
          <span>SECRETS</span>
          <strong>Encrypted authentication and provider credentials</strong>
          <p>
            Google OAuth tokens are configured for encrypted storage. Supported
            provider Admin API keys are encrypted before persistence, restricted
            to credential-management permissions, and cleared when the
            connection is revoked.
          </p>
        </article>
        <article>
          <span>CI</span>
          <strong>Release security checks</strong>
          <p>
            Repository CI is configured to run formatting, linting, type
            checking, unit and database tests, browser E2E, dependency audit, a
            production container build, a backup/restore drill, and secret
            scanning.
          </p>
        </article>
        <article>
          <span>DATA</span>
          <strong>Explicit deletion and retention</strong>
          <p>
            Owners have organization evidence export, retention preview and
            enforcement, and evidence-purge controls.
          </p>
        </article>
        <article>
          <span>CONNECTORS</span>
          <strong>Bounded connector scope</strong>
          <p>
            OpenAI and Anthropic organization-usage connections are the
            supported provider connectors in the current beta. Gmail, Drive,
            Slack, and other workspace connectors remain unavailable unless
            separately released.
          </p>
        </article>
      </section>

      <section className="evidence-note">
        <strong>Reporting:</strong> product, privacy, account, bug, and security
        issues can be submitted through the persisted support route. A
        successful submission returns a reference ID.
        <div className="mt-4">
          <Link className="primary-action" href="/support">
            Open support &amp; security
          </Link>
        </div>
      </section>
    </div>
  );
}
