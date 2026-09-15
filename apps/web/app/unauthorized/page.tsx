import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <section className="recovery-state" aria-labelledby="unauthorized-title">
      <p className="eyebrow">Access unavailable</p>
      <h1 id="unauthorized-title">
        You do not have access to this organization.
      </h1>
      <p className="lede">
        Sign in with an authorized account, or return home and choose an
        organization available to your current identity.
      </p>
      <div className="action-row">
        <Link className="primary-action" href="/">
          Return home
        </Link>
      </div>
    </section>
  );
}
