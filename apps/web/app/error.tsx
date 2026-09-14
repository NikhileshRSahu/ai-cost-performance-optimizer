'use client';

export default function ApplicationError({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <section className="recovery-state" aria-labelledby="application-error-title">
      <p className="eyebrow">Temporary problem</p>
      <h1 id="application-error-title">This page could not be completed safely.</h1>
      <p className="lede">
        Your evidence was not changed by this error screen. Retry the request, or
        return to the home page and reopen the workflow.
      </p>
      <div className="action-row">
        <button className="primary-button" type="button" onClick={reset}>
          Retry
        </button>
        <a className="secondary-action" href="/">
          Return home
        </a>
      </div>
      <p className="projection-note">
        Internal exception details are intentionally withheld from this screen.
      </p>
    </section>
  );
}
