import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <section className="recovery-state" aria-labelledby="not-found-title">
      <p className="eyebrow">Not found</p>
      <h1 id="not-found-title">This workbench page does not exist.</h1>
      <p className="lede">
        The link may be old, mistyped, or point to evidence that is no longer
        available.
      </p>
      <div className="action-row">
        <Link className="primary-action" href="/">
          Return home
        </Link>
      </div>
    </section>
  );
}
