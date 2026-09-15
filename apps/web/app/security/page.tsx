import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security | Evalomics',
  description:
    'Security model and release boundaries for the Evalomics CSV-first pilot.',
};

export default function SecurityPage() {
  return (
    <div className="landing-stack legal-page">
      <section className="hero hero-wide">
        <p className="eyebrow">Security model</p>
        <h1>Trust is a release gate, not a marketing claim.</h1>
        <p className="lede">
          Evalomics keeps the CSV-first pilot deliberately narrower than the
          long-term connector roadmap. Features that require deeper credentials
          stay disabled until their controls pass review.
        </p>
      </section>

      <section className="privacy-levels" aria-label="Security controls">
        <article>
          <span>AUTH</span>
          <strong>Session-derived authorization</strong>
          <p>
            Google sign-in maps verified identities into tenant-scoped
            membership roles. OWNER, OPERATOR, and VIEWER permissions remain
            enforced by the application authorization model.
          </p>
        </article>
        <article>
          <span>TENANCY</span>
          <strong>Organization isolation</strong>
          <p>
            Persistence and E2E tests cover tenant access boundaries, including
            cross-organization denial.
          </p>
        </article>
        <article>
          <span>SECRETS</span>
          <strong>Encrypted OAuth tokens</strong>
          <p>
            Google authentication tokens are configured for encrypted storage.
            Provider-admin and workspace-connector secrets are not collected in
            the CSV pilot.
          </p>
        </article>
        <article>
          <span>CI</span>
          <strong>Release security checks</strong>
          <p>
            Release CI includes formatting, linting, type checking, unit tests,
            database tests, browser E2E, dependency audit, production container
            build, backup/restore drill, and secret scanning.
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
          <strong>Gated by design</strong>
          <p>
            Workspace connectors remain unavailable until encrypted connector
            secret storage, rotation/revocation, least-privilege scope review,
            and connector-specific threat modeling are complete.
          </p>
        </article>
      </section>

      <section className="evidence-note">
        <strong>Reporting:</strong> until a dedicated security mailbox is live,
        security reporting uses the current founder/support route published with
        the beta deployment. Do not publish an address that is not actively
        monitored.
      </section>
    </div>
  );
}
